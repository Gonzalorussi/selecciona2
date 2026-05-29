import admin from "firebase-admin";
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(admin.app(), "(default)");

export {admin, db};