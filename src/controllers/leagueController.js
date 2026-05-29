import admin from "firebase-admin";

import { db } from "../firebase/firebaseAdmin.js";
import { createLeagueActivity } from "../services/leagueActivityService.js"

function generateLeagueCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return code;
}

export async function createLeague(
  req,
  res
) {
  try {
    const uid = req.user.uid;

    const {
      name,
      description = "",
      imageUrl = "",
      isPrivate = true,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "League name required",
      });
    }

    const userDoc = await db
      .collection("users")
      .doc(uid)
      .get();

    const userData = userDoc.data();

    let code = generateLeagueCode();

    let existingLeague = await db
      .collection("leagues")
      .where("code", "==", code)
      .get();

    while (!existingLeague.empty) {
      code = generateLeagueCode();

      existingLeague = await db
        .collection("leagues")
        .where("code", "==", code)
        .get();
    }

    const leagueRef =
      db.collection("leagues").doc();

    await leagueRef.set({
      name,
      description,
      imageUrl,

      code,

      isPrivate,

      ownerId: uid,
      ownerName:
        userData.displayName,

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),

      membersCount: 1,
    });

    await leagueRef
      .collection("members")
      .doc(uid)
      .set({
        uid,

        displayName:
          userData.displayName,

        photoURL:
          userData.photoURL,

        totalPoints:
          userData.totalPoints || 0,

        joinedAt:
          admin.firestore.FieldValue.serverTimestamp(),
      });

    await createLeagueActivity({
      leagueId: leagueRef.id,
      type: "created",
      uid,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      message: "creó la liga 👑",
    });

    await db.collection("users").doc(uid).update({
      leagues: admin.firestore.FieldValue.arrayUnion(leagueRef.id),
    });

    res.json({
      success: true,
      leagueId: leagueRef.id,
      code,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error creating league",
    });
  }
}

export async function joinLeague(
  req,
  res
) {
  try {
    const uid = req.user.uid;

    const { code, leagueId } = req.body;

    if (!code && !leagueId) {
      return res.status(400).json({
        message:
          "League code or leagueId required",
      });
    }

    let leagueDoc;
    let finalLeagueId;

    // JOIN POR ID (ligas públicas)
    if (leagueId) {
      const doc = await db
        .collection("leagues")
        .doc(leagueId)
        .get();

      if (!doc.exists) {
        return res.status(404).json({
          message: "League not found",
        });
      }

      leagueDoc = doc;
      finalLeagueId = doc.id;
    }

    // JOIN POR CÓDIGO (ligas privadas)
    else {
      const leagueSnapshot = await db
        .collection("leagues")
        .where(
          "code",
          "==",
          code.toUpperCase()
        )
        .limit(1)
        .get();

      if (leagueSnapshot.empty) {
        return res.status(404).json({
          message: "League not found",
        });
      }

      leagueDoc =
        leagueSnapshot.docs[0];

      finalLeagueId = leagueDoc.id;
    }

    // verificar si ya pertenece
    const memberRef = db
      .collection("leagues")
      .doc(finalLeagueId)
      .collection("members")
      .doc(uid);

    const existingMember =
      await memberRef.get();

    if (existingMember.exists) {
      return res.status(400).json({
        message:
          "You are already in this league",
      });
    }

    // obtener usuario
    const userDoc = await db
      .collection("users")
      .doc(uid)
      .get();

    const userData = userDoc.data();

    // agregar miembro
    await memberRef.set({
      uid,

      displayName:
        userData.displayName,

      photoURL:
        userData.photoURL,

      totalPoints:
        userData.totalPoints || 0,

      joinedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("users").doc(uid).update({
      leagues: admin.firestore.FieldValue.arrayUnion(finalLeagueId),
    });

    // incrementar contador
    await db
      .collection("leagues")
      .doc(finalLeagueId)
      .update({
        membersCount:
          admin.firestore.FieldValue.increment(
            1
          ),
      });

    await createLeagueActivity({
      leagueId: finalLeagueId,
      type: "joined",
      uid,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      message: "se unió a la liga 🚀",
    });

    res.json({
      success: true,
      leagueId: finalLeagueId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error joining league",
    });
  }
}

export async function getMyLeagues(req, res) {
  try {
    const uid = req.user.uid;

    const userDoc = await db.collection("users").doc(uid).get();

    const userData = userDoc.data();

    const leagueIds = userData.leagues || [];

    if (leagueIds.length === 0) {
      return res.json([]);
    }

    const promises = leagueIds.map((id) =>
      db.collection("leagues").doc(id).get()
    );

    const leaguesDocs = await Promise.all(promises);

    const leagues = leaguesDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    return res.json(leagues);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error getting leagues",
    });
  }
}

export async function getLeagueById(
  req,
  res
) {
  try {
    const { leagueId } = req.params;

    const leagueDoc = await db
      .collection("leagues")
      .doc(leagueId)
      .get();

    if (!leagueDoc.exists) {
      return res.status(404).json({
        message: "League not found",
      });
    }

    const membersSnapshot = await db
      .collection("leagues")
      .doc(leagueId)
      .collection("members")
      .orderBy(
        "totalPoints",
        "desc"
      )
      .get();

    const members =
      membersSnapshot.docs.map(
        (doc) => doc.data()
      );

    res.json({
      id: leagueDoc.id,
      ...leagueDoc.data(),
      members,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error getting league",
    });
  }
}

export async function leaveLeague(
  req,
  res
) {
  try {
    const uid = req.user.uid;

    const { leagueId } = req.params;

    const leagueRef = db
      .collection("leagues")
      .doc(leagueId);

    const leagueDoc =
      await leagueRef.get();

    if (!leagueDoc.exists) {
      return res.status(404).json({
        message: "League not found",
      });
    }

    const leagueData =
      leagueDoc.data();

    if (leagueData.ownerId === uid) {
      return res.status(400).json({
        message:
          "Owner cannot leave league",
      });
    }

    await leagueRef
      .collection("members")
      .doc(uid)
      .delete();

    await leagueRef.update({
      membersCount:
        admin.firestore.FieldValue.increment(
          -1
        ),
    });

    const userDoc = await db
      .collection("users")
      .doc(uid)
      .get();

    const userData = userDoc.data();

    await db.collection("users").doc(uid).update({
      leagues: admin.firestore.FieldValue.arrayRemove(leagueId),
    });

    await createLeagueActivity({
      leagueId,
      type: "left",
      uid,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      message: "abandonó la liga 👋",
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error leaving league",
    });
  }
}

export async function deleteLeague(
  req,
  res
) {
  try {
    const uid = req.user.uid;

    const { leagueId } = req.params;

    const leagueRef = db
      .collection("leagues")
      .doc(leagueId);

    const leagueDoc =
      await leagueRef.get();

    if (!leagueDoc.exists) {
      return res.status(404).json({
        message: "League not found",
      });
    }

    const leagueData =
      leagueDoc.data();

    if (leagueData.ownerId !== uid) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const membersSnapshot =
      await leagueRef
        .collection("members")
        .get();

    const batch = db.batch();

    membersSnapshot.docs.forEach(
      (doc) => {
        const uid = doc.id;

        batch.update(db.collection("users").doc(uid), {
          leagues: admin.firestore.FieldValue.arrayRemove(leagueId),
        });
        batch.delete(doc.ref);
      }
    );

    batch.delete(leagueRef);

    await batch.commit();

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error deleting league",
    });
  }
}

export async function getLeagueActivities(
  req,
  res
) {
  try {
    const { leagueId } = req.params;

    const snapshot = await db
      .collection("leagues")
      .doc(leagueId)
      .collection("activities")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const activities =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    res.json(activities);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error getting activities",
    });
  }
}

export async function getPublicLeagues(
  req,
  res
) {
  try {
    const snapshot = await db
      .collection("leagues")
      .where("isPrivate", "==", false)
      .get();

    const publicLeagues = snapshot.docs.map(
      (doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
        }
      }
    )
    res.json(publicLeagues);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error getting public leagues",
    });
  }
}