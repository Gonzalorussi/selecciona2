import express from "express";

import {
  createLeague,
  joinLeague,
  getMyLeagues,
  getPublicLeagues,
  getLeagueById,
  leaveLeague,
  deleteLeague,
  getLeagueActivities,
} from "../controllers/leagueController.js";

import { verifyFirebaseToken }
from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  verifyFirebaseToken,
  createLeague
);

router.get(
  "/public",
  getPublicLeagues
)

router.post(
  "/join",
  verifyFirebaseToken,
  joinLeague
);

router.get(
  "/me",
  verifyFirebaseToken,
  getMyLeagues
);

router.get(
  "/:leagueId",
  verifyFirebaseToken,
  getLeagueById
);

router.post(
  "/:leagueId/leave",
  verifyFirebaseToken,
  leaveLeague
);

router.delete(
  "/:leagueId",
  verifyFirebaseToken,
  deleteLeague
);

router.get(
  "/:leagueId/activities",
  verifyFirebaseToken,
  getLeagueActivities
);

export default router;