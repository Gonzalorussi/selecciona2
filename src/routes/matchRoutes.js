import express from "express";

import {
  getMatches,
  updateMatch,
  getUpcomingMatches
} from "../controllers/matchController.js";

import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import { verifyAdmin } from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/", getMatches);

router.get(
  "/upcoming",
  getUpcomingMatches
);

router.put(
  "/:matchId",
  verifyFirebaseToken,
  verifyAdmin,
  updateMatch
);

export default router;