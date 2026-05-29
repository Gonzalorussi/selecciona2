import admin from "firebase-admin";

import { db } from "../firebase/firebaseAdmin.js";

export async function getMyPicks(req, res) {
  try {
    const uid = req.user.uid;

    const doc = await db
      .collection("predictions")
      .doc(uid)
      .get();

    if (!doc.exists) {
      return res.json({
        predictions: {},
      });
    }

    res.json(doc.data());
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error getting picks",
    });
  }
}

export async function savePicks(req, res) {
  try {
    const uid = req.user.uid;

    const { predictions } = req.body;

    const matchIds = Object.keys(predictions);

    const matchesSnapshot = await db
      .collection("matches")
      .where(
        admin.firestore.FieldPath.documentId(),
        "in",
        matchIds
      )
      .get();

    for (const doc of matchesSnapshot.docs) {
      const match = doc.data();

      const startsAt =
        match.startsAt.toDate();

      const isLocked =
        startsAt < new Date();

      if (isLocked) {
        return res.status(403).json({
          message:
            `El partido ${doc.id} ya comenzó`,
        });
      }
    }

    await db
      .collection("predictions")
      .doc(uid)
      .set(
        {
          userId: uid,
          predictions,
          updatedAt:
            admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        }
      );

    res.json(true);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error saving picks",
    });
  }
}