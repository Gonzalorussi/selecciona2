import admin from "firebase-admin";

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    const decodedToken = await admin
      .auth()
      .verifyIdToken(token);

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
}