import admin from "firebase-admin";

admin.initializeApp({
    credential: admin.credential.cert(
        JSON.parse(process.env.SERVICE_ACCOUNT_KEY)
    ),
    projectId: "selecciona2-v2",
});

const db = admin.firestore();

export { admin, db };