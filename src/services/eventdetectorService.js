import { createLeagueActivity } from "./leagueActivityService.js";

/**
 * Detecta cambios de ranking entre dos snapshots
 */
export async function detectRankEvents({
  leagueId,
  before = [],
  after = [],
}) {
  if (!before.length || !after.length) return [];

  // ---------------------------
  // ORDENAR POR PUNTOS
  // ---------------------------
  const sortedBefore = [...before].sort(
    (a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)
  );

  const sortedAfter = [...after].sort(
    (a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)
  );

  // ---------------------------
  // MAPAS DE POSICIÓN
  // ---------------------------
  const beforePos = new Map(
    sortedBefore.map((u, i) => [u.uid, i + 1])
  );

  const afterPos = new Map(
    sortedAfter.map((u, i) => [u.uid, i + 1])
  );

  const events = [];

  // ---------------------------
  // DETECCIÓN POR USUARIO
  // ---------------------------
  for (const user of sortedAfter) {
    const uid = user.uid;

    const prevPos = beforePos.get(uid);
    const newPos = afterPos.get(uid);

    if (prevPos == null || newPos == null) continue;

    const delta = prevPos - newPos;

    const basePayload = {
      leagueId,
      uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };

    // =========================
    // 🥇 ENTRÓ AL PODIO
    // =========================
    if (newPos <= 3 && prevPos > 3) {
      events.push(
        createLeagueActivity({
          ...basePayload,
          type: "podium_entry",
          message: `entró al podio 👑 (#${newPos})`,
        })
      );
    }

    // =========================
    // 😬 PERDIÓ EL #1
    // =========================
    if (prevPos === 1 && newPos !== 1) {
      events.push(
        createLeagueActivity({
          ...basePayload,
          type: "leader_fall",
          message: `perdió el liderazgo 😬`,
        })
      );
    }

    // =========================
    // 🚀 CAMBIO FUERTE
    // =========================
    if (Math.abs(delta) >= 5) {
      events.push(
        createLeagueActivity({
          ...basePayload,
          type: delta > 0 ? "rank_up" : "rank_down",
          message:
            delta > 0
              ? `subió ${delta} posiciones 🚀`
              : `bajó ${Math.abs(delta)} posiciones 📉`,
        })
      );
    }

    // =========================
    // 👑 NUEVO LÍDER
    // =========================
    if (prevPos !== 1 && newPos === 1) {
      events.push(
        createLeagueActivity({
          ...basePayload,
          type: "new_leader",
          message: `tomó el liderazgo 🔥`,
        })
      );
    }
  }

  // ejecutar en paralelo (mejor performance)
  await Promise.all(events);

  return events;
}