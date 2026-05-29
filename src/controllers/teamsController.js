import { db } from "../firebase/firebaseAdmin.js";

export const getTeams = async (
  req,
  res
) => {
  try {
    const snapshot = await db
      .collection("teams")
      .get();

    const teams = snapshot.docs.map(
      (doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
        }
      }
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