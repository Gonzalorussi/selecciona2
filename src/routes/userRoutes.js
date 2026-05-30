import express from "express";

import { syncUser, getLeaderboard, getUserProfile } from "../controllers/userController.js";

import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/sync",
  verifyFirebaseToken,
  syncUser
);

router.get(
  "/leaderboard",
  getLeaderboard
);

router.get(
  "/profile/:uid",
  getUserProfile
);

export default router;