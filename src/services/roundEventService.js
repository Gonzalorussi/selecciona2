import { createLeagueActivity } from "./leagueActivityService.js";

export async function detectRoundEvents({
  leagueId,
  label,
  before = [],
  after = [],
}) {
  if (!before.length || !after.length) return;

  const beforeMap = new Map(before.map(u => [u.uid, u]));
  const afterMap = new Map(after.map(u => [u.uid, u]));

  const gains = [];

  for (const afterUser of after) {
    const beforeUser = beforeMap.get(afterUser.uid);

    const diff =
      (afterUser.totalPoints || 0) -
      (beforeUser?.totalPoints || 0);

    gains.push({
      ...afterUser,
      diff,
    });
  }

  // ordenar por rendimiento en la “ronda”
  const sortedByGain = [...gains].sort(
    (a, b) => b.diff - a.diff
  );

  const sortedByPoints = [...after].sort(
    (a, b) => b.totalPoints - a.totalPoints
  );

  const winner = sortedByPoints[0];
  const loser = sortedByPoints[sortedByPoints.length - 1];
  const topGainer = sortedByGain[0];
  const worstGainer = sortedByGain[sortedByGain.length - 1];

  // 🥇 ganador
  await createLeagueActivity({
    leagueId,
    type: "round_winner",
    uid: winner.uid,
    displayName: winner.displayName,
    photoURL: winner.photoURL,
    message: `ganó la ronda (${label}) 🏆 con ${winner.totalPoints} pts`,
  });

  // 🪨 último
  await createLeagueActivity({
    leagueId,
    type: "round_loser",
    uid: loser.uid,
    displayName: loser.displayName,
    photoURL: loser.photoURL,
    message: `terminó último en ${label} 💀`,
  });

  // 🚀 mayor subida
  if (topGainer.diff > 0) {
    await createLeagueActivity({
      leagueId,
      type: "round_top_gain",
      uid: topGainer.uid,
      displayName: topGainer.displayName,
      photoURL: topGainer.photoURL,
      message: `mejor rendimiento de la ronda +${topGainer.diff} pts 🚀`,
      points: topGainer.diff,
    });
  }

  // 📉 peor caída (solo si aplica)
  if (worstGainer.diff < 0) {
    await createLeagueActivity({
      leagueId,
      type: "round_worst",
      uid: worstGainer.uid,
      displayName: worstGainer.displayName,
      photoURL: worstGainer.photoURL,
      message: `peor rendimiento de la ronda ${worstGainer.diff} pts 📉`,
      points: worstGainer.diff,
    });
  }
}