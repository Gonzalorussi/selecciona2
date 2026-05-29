import { db } from "../firebase/firebaseAdmin.js";

export async function verifyAdmin(
  req,
  res,
  next
) {
  try {
    const uid = req.user.uid;

    const userDoc = await db
      .collection("users")
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const userData = userDoc.data();

    if (userData.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Error verifying admin",
    });
  }
}