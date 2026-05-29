import admin from "firebase-admin";
import { db } from "../firebase/firebaseAdmin.js";

import { getLeagueSnapshots } from "../services/rankingSnapshotService.js";
import { detectRoundEvents } from "../services/roundEventService.js";
import {
  lockRound,
  unlockRound,
} from "../services/systemLockService.js";

/**
 * Construye snapshot baseline (ronda 1)
 */
function buildZeroSnapshot(leagues) {
  return leagues.map((l) => ({
    leagueId: l.leagueId,
    members: l.members.map((m) => ({
      uid: m.uid,
      displayName: m.displayName,
      photoURL: m.photoURL,
      totalPoints: 0,
    })),
  }));
}

/**
 * POST /admin/close-round
 */
export async function closeRound(req, res) {
  try {
    const { label, isFirstRound } = req.body;

    // 1. LOCK SISTEMA (ANTI DOBLE CLICK)
    try {
      await lockRound(label);
    } catch (err) {
      if (err.message === "ROUND_ALREADY_CLOSING") {
        return res.status(409).json({
          message: "Round already closing",
        });
      }
      throw err;
    }

    // 2. SNAPSHOT AFTER (estado actual real)
    const after = await getLeagueSnapshots();

    // 3. SNAPSHOT BEFORE (baseline o real)
    const before = isFirstRound
      ? buildZeroSnapshot(after)
      : after;

    // 4. EVENTOS POR LIGA
    for (const leagueAfter of after) {
      const leagueBefore = before.find(
        (l) => l.leagueId === leagueAfter.leagueId
      );

      if (!leagueBefore) continue;

      await detectRoundEvents({
        leagueId: leagueAfter.leagueId,
        label,
        before: leagueBefore.members,
        after: leagueAfter.members,
      });
    }

    // 5. UNLOCK
    await unlockRound();

    return res.json({
      success: true,
      message: "Round closed successfully",
    });
  } catch (err) {
    console.error(err);

    await unlockRound().catch(() => {});

    return res.status(500).json({
      message: "Error closing round",
    });
  }
}