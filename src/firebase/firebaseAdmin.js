import admin from "firebase-admin";

admin.initializeApp({
  projectId: "selecciona2-v2",
});

const db = admin.firestore();

export { admin, db };