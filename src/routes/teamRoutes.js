import express from "express";

import {getTeams} from "../controllers/teamsController.js";

const router = express.Router();

router.get("/", getTeams);

router.put("/:teamId",
     updateTeam
);

export default router;