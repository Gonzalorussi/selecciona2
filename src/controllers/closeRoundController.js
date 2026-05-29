import { getLeagueSnapshots } from "../services/rankingSnapshotService.js";
import { detectRoundEvents } from "../services/roundEventService.js";

function buildZeroSnapshot(leagues) {
  return leagues.map((league) => ({
    leagueId: league.leagueId,
    members: league.members.map((m) => ({
      uid: m.uid,
      displayName: m.displayName,
      photoURL: m.photoURL,
      totalPoints: 0,
    })),
  }));
}

export async function closeRound(req, res) {
  try {
    const { label, isFirstRound } = req.body;

    // snapshot real del sistema (post match updates)
    const after = await getLeagueSnapshots();

    // BEFORE lógico
    const before = isFirstRound
      ? buildZeroSnapshot(after)
      : after;

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

    return res.json({
      success: true,
      message: "Round closed",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Error closing round",
    });
  }
}