import admin from "firebase-admin";
import { db } from "../firebase/firebaseAdmin.js";

export async function createLeagueActivity({
  leagueId,
  type,
  uid,
  displayName,
  photoURL,
  message,
  points = 0,
}) {

  await db
    .collection("leagues")
    .doc(leagueId)
    .collection("activities")
    .add({
      type,
      uid,
      displayName,
      photoURL,
      message,
      points,

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });
}