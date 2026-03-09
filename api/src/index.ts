import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import logRoutes from "./routes/logs.js";
import healthRoutes from "./routes/health.js";
import statRoutes from "./routes/stats.js";
import quitPlanRoutes from "./routes/quit-plan.js";
import groupRoutes from "./routes/groups.js";
import { startCronJobs } from "./cron.js";
import { startBot, stopBot } from "./bot.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const WEBAPP_URL = process.env.WEBAPP_URL || "http://localhost:5173";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow the configured webapp URL and common local dev ports
      const allowed = [
        WEBAPP_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "https://webapp-production-4b53.up.railway.app",
      ];
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// Health check
app.get("/api/ping", (_req, res) => {
  res.json({ data: "pong" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/quit-plan", quitPlanRoutes);
app.use("/api/groups", groupRoutes);

const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  startCronJobs();
  startBot().catch((err) => console.error("Bot startup failed:", err));
});

// Graceful shutdown
const shutdown = () => {
  console.log("🛑 Shutting down...");
  stopBot();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
};
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
