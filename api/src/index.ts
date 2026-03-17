import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import logRoutes from "./routes/logs.js";
import healthRoutes from "./routes/health.js";
import statRoutes from "./routes/stats.js";
import quitPlanRoutes from "./routes/quit-plan.js";
import groupRoutes from "./routes/groups.js";
import { startCronJobs } from "./cron.js";
import { startBot, stopBot, getBotWebhookCallback, getWebhookPath } from "./bot.js";
import { closePool } from "./db.js";

// ── Env validation ─────────────────────────────────────────────────
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_PRODUCTION && process.env.DEV_MODE === "true") {
  console.error("FATAL: DEV_MODE=true is not allowed in production (NODE_ENV=production)");
  process.exit(1);
}

const REQUIRED_VARS = ["BOT_TOKEN", "DATABASE_URL"];
if (IS_PRODUCTION) REQUIRED_VARS.push("WEBAPP_URL");

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Global error handlers — ensure crashes produce visible logs
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
console.log(`Configured PORT=${PORT} (env: ${process.env.PORT || "not set, defaulting to 3000"})`);

// ── CORS ────────────────────────────────────────────────────────────
const WEBAPP_URL = process.env.WEBAPP_URL;
if (!WEBAPP_URL && IS_PRODUCTION) {
  console.error("FATAL: WEBAPP_URL is required in production for CORS");
  process.exit(1);
}
app.use(cors({
  origin: WEBAPP_URL || "http://localhost:5173",
  credentials: true
}));

// ── Rate limiting ───────────────────────────────────────────────────
app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
}));

app.use(express.json());

// Health check
app.get("/api/ping", (_req, res) => {
  res.json({ data: "pong" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/quit-plan", quitPlanRoutes);
app.use("/api/groups", groupRoutes);

// Bot webhook route
const webhookCb = getBotWebhookCallback();
if (webhookCb) {
  app.post(getWebhookPath(), webhookCb);
  console.log(`Bot webhook route registered at ${getWebhookPath()}`);
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startCronJobs();
  startBot().catch((err) => console.error("Bot startup failed:", err));
});

// Graceful shutdown with timeout
const shutdown = () => {
  console.log("Shutting down...");
  stopBot();
  closePool();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
  // Force exit after 5s if graceful shutdown hangs
  setTimeout(() => {
    console.log("Shutdown timeout — forcing exit");
    process.exit(1);
  }, 5000).unref();
};
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
