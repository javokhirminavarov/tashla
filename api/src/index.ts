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
import { startBot, stopBot, getBotWebhookCallback, getWebhookPath } from "./bot.js";

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

app.use(cors({
  origin: process.env.WEBAPP_URL || true,
  credentials: true
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
