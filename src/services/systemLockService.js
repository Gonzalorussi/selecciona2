import admin from "firebase-admin";
import { db } from "../firebase/firebaseAdmin.js";

/**
 * Evita doble ejecución de cierre de ronda
 */
export async function lockRound(label) {
  const ref = db.collection("system").doc("roundLock");

  const doc = await ref.get();

  if (doc.exists && doc.data().closing) {
    throw new Error("ROUND_ALREADY_CLOSING");
  }

  await ref.set({
    closing: true,
    label,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function unlockRound() {
  const ref = db.collection("system").doc("roundLock");

  await ref.set({
    closing: false,
    label: null,
  });
}

export async function isRoundLocked() {
  const ref = db.collection("system").doc("roundLock");

  const doc = await ref.get();

  return doc.exists && doc.data().closing;
}