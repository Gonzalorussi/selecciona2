import express from "express";

import {
  createPreference,
  mercadopagoWebhook,
} from "../controllers/paymentController.js";

import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-preference",
  verifyFirebaseToken,
  createPreference
);

router.post(
  "/webhook",
  mercadopagoWebhook
);

export default router;