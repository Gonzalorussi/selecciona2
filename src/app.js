import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import { db } from "./firebase/firebaseAdmin.js";
import matchRoutes from "./routes/matchRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import pickRoutes from "./routes/pickRoutes.js";
import leagueRoutes from "./routes/leagueRoutes.js";
import teamsRoutes from "./routes/teamRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://selecciona2.netlify.app/",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/predictions",predictionRoutes);
app.use("/api/picks", pickRoutes);
app.use("/api/leagues", leagueRoutes);
app.use("/api/teams", teamsRoutes);
app.get("/", (_, res) => {
  res.send("API funcionando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});