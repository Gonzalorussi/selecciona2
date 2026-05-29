import admin from "firebase-admin";

import { db } from "../firebase/firebaseAdmin.js";

export const savePrediction = async (
  req,
  res
) => {
  try {
    const userId = req.user.uid;

    const {
      matchId,
      prediction,
    } = req.body;

    if (
      !matchId ||
      !prediction
    ) {
      return res.status(400).json({
        message:
          "Datos incompletos",
      });
    }

    const matchRef = db
      .collection("matches")
      .doc(matchId);

    const matchSnap =
      await matchRef.get();

    if (!matchSnap.exists) {
      return res.status(404).json({
        message:
          "Partido no encontrado",
      });
    }

    const matchData =
      matchSnap.data();

    const now = new Date();

    const startsAt =
      matchData.startsAt.toDate();

    if (now >= startsAt) {
      return res.status(403).json({
        message:
          "El partido ya comenzó",
      });
    }

    const predictionId = `${userId}_${matchId}`;

    await db
      .collection("predictions")
      .doc(predictionId)
      .set({
        userId,
        matchId,
        prediction,

        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),
      });

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Error guardando predicción",
    });
  }
};