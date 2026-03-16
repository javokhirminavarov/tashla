import { Router } from "express";
import { query, isSQLite, formatDateValue } from "../db.js";
import { authMiddleware } from "../auth.js";

const router = Router();

// POST /api/logs — log usage
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { habit_type, quantity } = req.body;

    if (!habit_type) {
      res.status(400).json({ error: "habit_type is required" });
      return;
    }

    await query(
      `INSERT INTO usage_logs (user_id, habit_type, quantity) VALUES ($1, $2, $3)`,
      [req.user.id, habit_type, quantity ?? 1]
    );

    // Get today's count
    const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";
    const dateNow = isSQLite ? "date('now')" : "CURRENT_DATE";
    const todayResult = await query(
      `SELECT COALESCE(SUM(quantity), 0) as count
       FROM usage_logs
       WHERE user_id = $1 AND habit_type = $2 AND ${dateExpr} = ${dateNow}`,
      [req.user.id, habit_type]
    );

    res.status(201).json({
      data: {
        today_count: Number(todayResult.rows[0]?.count ?? 0),
      },
    });
  } catch (err) {
    console.error("Log error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/logs/last — undo last log for a habit today
router.delete("/last", authMiddleware, async (req, res) => {
  try {
    const { habit_type } = req.body;

    if (!habit_type) {
      res.status(400).json({ error: "habit_type is required" });
      return;
    }

    const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";
    const dateNow = isSQLite ? "date('now')" : "CURRENT_DATE";

    // Find the most recent log for this habit today
    const lastLog = await query(
      `SELECT id FROM usage_logs
       WHERE user_id = $1 AND habit_type = $2 AND ${dateExpr} = ${dateNow}
       ORDER BY logged_at DESC LIMIT 1`,
      [req.user.id, habit_type]
    );

    if (lastLog.rows.length === 0) {
      res.status(400).json({ error: "No logs to undo" });
      return;
    }

    await query(`DELETE FROM usage_logs WHERE id = $1`, [lastLog.rows[0].id]);

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("Undo log error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/logs/today — today's count per active habit
router.get("/today", authMiddleware, async (req, res) => {
  try {
    const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";
    const dateNow = isSQLite ? "date('now')" : "CURRENT_DATE";

    const result = await query(
      `SELECT habit_type, COALESCE(SUM(quantity), 0) as count
       FROM usage_logs
       WHERE user_id = $1 AND ${dateExpr} = ${dateNow}
       GROUP BY habit_type`,
      [req.user.id]
    );

    const counts: Record<string, number> = {};
    for (const row of result.rows) {
      counts[row.habit_type as string] = Number(row.count);
    }

    res.json({ data: counts });
  } catch (err) {
    console.error("Today logs error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/logs/daily?days=7 — daily totals for last N days
router.get("/daily", authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 7;

    const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";
    const dateOffset = isSQLite
      ? `date('now', '-${days} days')`
      : `CURRENT_DATE - INTERVAL '${days} days'`;

    const result = await query(
      `SELECT ${dateExpr} as date, habit_type, COALESCE(SUM(quantity), 0) as count
       FROM usage_logs
       WHERE user_id = $1 AND ${dateExpr} >= ${dateOffset}
       GROUP BY ${dateExpr}, habit_type
       ORDER BY ${dateExpr}`,
      [req.user.id]
    );

    // Group by date
    const dailyMap: Record<string, Record<string, number>> = {};
    for (const row of result.rows) {
      const date = formatDateValue(row.date);
      if (!dailyMap[date]) dailyMap[date] = {};
      dailyMap[date][row.habit_type as string] = Number(row.count);
    }

    const daily = Object.entries(dailyMap).map(([date, habits]) => ({
      date,
      ...habits,
    }));

    res.json({ data: daily });
  } catch (err) {
    console.error("Daily logs error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
