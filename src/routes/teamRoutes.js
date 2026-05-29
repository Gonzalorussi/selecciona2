import express from "express";

import {getTeams} from "../controllers/teamsController.js";

const router = express.Router();

router.get("/", getTeams);

export default router;