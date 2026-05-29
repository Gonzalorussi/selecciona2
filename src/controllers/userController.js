import admin from "firebase-admin";
import { db } from "../firebase/firebaseAdmin.js";

export async function syncUser(req, res) {
  try {
    const { uid, name, email, picture } = req.user;

    const userRef = db.collection("users").doc(uid);

    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        uid,
        displayName: name,
        email,
        photoURL: picture,
        role:"user",
        isPro: false,
        totalPoints: 0,
        leagues: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await userRef.update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const updatedDoc = await userRef.get();

    return res.json(updatedDoc.data());
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error syncing user",
    });
  }
}

export async function getLeaderboard(
  req,
  res
) {
  try {
    const snapshot = await db
      .collection("users")
      .orderBy("totalPoints", "desc")
      .limit(100)
      .get();

    const leaderboard =
      snapshot.docs.map((doc, index) => ({
        position: index + 1,
        ...doc.data(),
      }));

    res.json(leaderboard);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error getting leaderboard",
    });
  }
}