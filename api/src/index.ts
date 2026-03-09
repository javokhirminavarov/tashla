import "dotenv/config";
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
import { startBot, stopBot } from "./bot.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBAPP_DIR = process.env.WEBAPP_DIR || path.join(__dirname, "../../public");

app.use(cors({ origin: true }));
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
