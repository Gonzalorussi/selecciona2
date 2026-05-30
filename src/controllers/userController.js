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

export async function getUserProfile(
  req,
  res
) {
  try {

    const { uid } = req.params;

    const userRef = db
      .collection("users")
      .doc(uid);

    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const user = userSnap.data();

    /*
    ==========================
    RANKING GLOBAL
    ==========================
    */

    const leaderboardSnap = await db
      .collection("users")
      .orderBy("totalPoints", "desc")
      .get();

    const position =
      leaderboardSnap.docs.findIndex(
        (doc) => doc.id === uid
      ) + 1;

    /*
    ==========================
    TOTAL PICKS
    ==========================
    */

    let totalPredictions = 0;

    const predictionsSnap = await db
      .collection("predictions")
      .doc(uid)
      .get();

    if (predictionsSnap.exists) {

      const predictions =
        predictionsSnap.data().predictions || {};

      totalPredictions =
        Object.keys(predictions).length;
    }

    /*
    ==========================
    LIGAS
    ==========================
    */

    let leagues = [];

    if (
      Array.isArray(user.leagues) &&
      user.leagues.length > 0
    ) {

      const leaguePromises =
        user.leagues.map(
          async (leagueId) => {

            const leagueSnap =
              await db
                .collection("leagues")
                .doc(leagueId)
                .get();

            if (!leagueSnap.exists) {
              return null;
            }

            return {
              id: leagueSnap.id,
              ...leagueSnap.data(),
            };
          }
        );

      leagues = (
        await Promise.all(
          leaguePromises
        )
      ).filter(Boolean);
    }

    return res.json({
      uid: user.uid,
      displayName:
        user.displayName || "",
      photoURL:
        user.photoURL || "",
      isPro:
        user.isPro || false,

      createdAt:
        user.createdAt || null,

      totalPoints:
        user.totalPoints || 0,

      position,

      totalPredictions,

      correctPredictions: 0,

      streak: 0,

      bestStreak: 0,

      leagues,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message:
        "Error obteniendo perfil",
    });
  }
}