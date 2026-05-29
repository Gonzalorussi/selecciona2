import { db } from "../firebase/firebaseAdmin.js";
import { calculateMatchPoints } from "../services/calculateMatchPoints.js";

export const getMatches = async (
  req,
  res
) => {
  try {
    const snapshot = await db
      .collection("matches")
      .orderBy("startsAt")
      .get();

    const matches = snapshot.docs.map(
      (doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
          startsAt: data.startsAt.toDate(),
        }
      }
    );

    res.json(matches);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error obteniendo partidos",
    });
  }
};

export const updateMatch = async (
  req,
  res
) => {
  try {
    const { matchId } = req.params;

    const {
      homeScore,
      awayScore,
      status,
    } = req.body;

    let winner = "draw";

    if (homeScore > awayScore) {
      winner = "home";
    }

    if (awayScore > homeScore) {
      winner = "away";
    }

    await db
      .collection("matches")
      .doc(matchId)
      .update({
        homeScore,
        awayScore,
        winner,
        status,
      });

    if (status === "finished") {
      await calculateMatchPoints(matchId);
    }

    res.json(true);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error updating match",
    });
  }
};

export const getUpcomingMatches = async (
  req,
  res
) => {
  try {
    const now = new Date();

    const snapshot = await db
      .collection("matches")
      .where("status", "==", "upcoming")
      .where("startsAt", ">=", now)
      .orderBy("startsAt")
      .limit(4)
      .get();

    const matches = snapshot.docs.map(
      (doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
          startsAt: data.startsAt.toDate(),
        };
      }
    );

    res.json(matches);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error obteniendo próximos partidos",
    });
  }
};