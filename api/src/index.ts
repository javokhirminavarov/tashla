import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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
import { startBot, stopBot, getBot, getBotWebhookCallback, getWebhookPath } from "./bot.js";

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
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBAPP_DIR = process.env.WEBAPP_DIR || path.join(__dirname, "../../public");

app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get("/api/ping", (_req, res) => {
  res.json({ data: "pong" });
});

// Debug endpoint — diagnose deployment issues (no secrets exposed)
app.get("/api/debug", (_req, res) => {
  const botToken = (process.env.BOT_TOKEN || "").trim();
  let webappFiles: string[] = [];
  try {
    webappFiles = fs.readdirSync(WEBAPP_DIR);
  } catch {
    webappFiles = ["ERROR: cannot read WEBAPP_DIR"];
  }
  res.json({
    data: {
      env: {
        BOT_TOKEN: botToken ? `present (len=${botToken.length}, ${botToken.slice(0, 4)}...${botToken.slice(-4)})` : "MISSING",
        DATABASE_URL: process.env.DATABASE_URL ? "present" : "MISSING",
        DEV_MODE: process.env.DEV_MODE || "not set",
        WEBAPP_URL: process.env.WEBAPP_URL || "not set",
        PORT: process.env.PORT || "not set",
        NODE_ENV: process.env.NODE_ENV || "not set",
      },
      webapp_dir: WEBAPP_DIR,
      webapp_files: webappFiles,
    },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/quit-plan", quitPlanRoutes);
app.use("/api/groups", groupRoutes);

// Bot webhook route (must be before static/SPA fallback)
const webhookCb = getBotWebhookCallback();
if (webhookCb) {
  app.post(getWebhookPath(), webhookCb);
  console.log(`Bot webhook route registered at ${getWebhookPath()}`);
}

// Serve webapp static files
app.use(express.static(WEBAPP_DIR));

// SPA fallback — serve index.html for all non-API routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(WEBAPP_DIR, "index.html"));
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving webapp from ${WEBAPP_DIR}`);
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
