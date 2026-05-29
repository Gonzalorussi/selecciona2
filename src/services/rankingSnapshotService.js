import { db } from "../firebase/firebaseAdmin.js";

export async function getLeagueSnapshots() {
  const leaguesSnapshot = await db.collection("leagues").get();

  const snapshots = await Promise.all(
    leaguesSnapshot.docs.map(async (leagueDoc) => {
      const membersSnap = await db
        .collection("leagues")
        .doc(leagueDoc.id)
        .collection("members")
        .get();

      const members = membersSnap.docs.map((d) => d.data());

      if (members.length === 0) {
        return null;
      }

      const sorted = members.sort(
        (a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)
      );

      return {
        leagueId: leagueDoc.id,
        members: sorted,
      };
    })
  );

  return snapshots.filter(Boolean);
}