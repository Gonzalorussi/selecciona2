import { db } from "../firebase/firebaseAdmin.js";

function normalizeTeam(team) {
  const goalsFor = team.goalsFor ?? 0;
  const goalsAgainst =
    team.goalsAgainst ?? 0;

  return {
    ...team,

    played: team.played ?? 0,
    wins: team.wins ?? 0,
    draws: team.draws ?? 0,
    losses: team.losses ?? 0,

    goalsFor,
    goalsAgainst,

    goalDifference:
      goalsFor - goalsAgainst,

    yellowCards:
      team.yellowCards ?? 0,

    redCards:
      team.redCards ?? 0,
  };
}

export const getTeams = async (
  req,
  res
) => {
  try {
    const snapshot = await db
      .collection("teams")
      .orderBy("nombre")
      .get();

    const teams = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...normalizeTeam(doc.data()),
      })
    );

    res.json(teams);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error obteniendo equipos",
    });
  }
};

export const updateTeam = async (
  req,
  res
) => {
  try {
    const { teamId } = req.params;

    await db
      .collection("teams")
      .doc(teamId)
      .update({
        ...req.body,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error actualizando equipo",
    });
  }
};