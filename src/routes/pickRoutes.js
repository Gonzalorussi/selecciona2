import express from "express";

import {
  savePicks,
  getMyPicks,
} from "../controllers/pickController.js";

import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyFirebaseToken);

router.get("/me", getMyPicks);

router.post("/", savePicks);

export default router;