import express from "express";

import {
  savePrediction,
} from "../controllers/predictionController.js";

import {
  verifyFirebaseToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  verifyFirebaseToken,
  savePrediction
);

export default router;