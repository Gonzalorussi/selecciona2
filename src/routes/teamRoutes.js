import express from "express";

import {getTeams, updateTeam} from "../controllers/teamsController.js";

const router = express.Router();

router.get("/", getTeams);

router.put("/:teamId",
     updateTeam
);

export default router;