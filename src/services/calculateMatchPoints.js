import admin from "firebase-admin";
import { db } from "../firebase/firebaseAdmin.js";

import { getLeagueSnapshots } from "../services/rankingSnapshotService.js";
import { detectRankEvents } from "../services/eventdetectorService.js";

export async function calculateMatchPoints(matchId) {
  try {
    const matchRef = db.collection("matches").doc(matchId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) throw new Error("Match not found");

    const match = matchDoc.data();

    if (match.pointsCalculated) {
      console.log("Puntos ya calculados");
      return;
    }

    const before = await getLeagueSnapshots();

    const predictionsSnapshot = await db
      .collection("predictions")
      .get();

    const batch = db.batch();

    for (const predictionDoc of predictionsSnapshot.docs) {
      const predictionData = predictionDoc.data();

      const userPrediction =
        predictionData.predictions?.[matchId];

      if (!userPrediction) continue;

      const userId = predictionData.userId;

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) continue;

      const userData = userDoc.data();

      let points = 0;

      if (userPrediction.result === match.winner) {
        points += 1;
      }

      if (
        userData.isPro &&
        userPrediction.homeScore === match.homeScore &&
        userPrediction.awayScore === match.awayScore
      ) {
        points += 2;
      }

      if (points <= 0) continue;

      batch.update(userRef, {
        totalPoints: admin.firestore.FieldValue.increment(points),
      });

      const leaguesSnapshot = await db.collection("leagues").get();

      for (const leagueDoc of leaguesSnapshot.docs) {
        const memberRef = db
          .collection("leagues")
          .doc(leagueDoc.id)
          .collection("members")
          .doc(userId);

        const memberDoc = await memberRef.get();

        if (!memberDoc.exists) continue;

        batch.update(memberRef, {
          totalPoints:
            admin.firestore.FieldValue.increment(points),
        });
      }
    }

    await batch.commit();

    await matchRef.update({
      pointsCalculated: true,
    });

    const after = await getLeagueSnapshots();

    for (const leagueBefore of before) {
      const leagueAfter = after.find(
        (l) => l.leagueId === leagueBefore.leagueId
      );

      if (!leagueAfter) continue;

      await detectRankEvents({
        leagueId: leagueBefore.leagueId,
        before: leagueBefore.members,
        after: leagueAfter.members,
      });
    }

    console.log(`Puntos calculados para ${matchId}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}