import express from "express";
import { closeRound } from "../controllers/adminController.js";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import { verifyAdmin } from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.post(
  "/close-round",
  verifyFirebaseToken,
  verifyAdmin,
  closeRound
);

export default router;