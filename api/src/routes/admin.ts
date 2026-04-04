import { Router } from "express";
import { query, isSQLite } from "../db.js";
import { authMiddleware, adminMiddleware } from "../auth.js";

const router = Router();

// All admin routes require auth + admin
router.use(authMiddleware, adminMiddleware);

// ── Date helpers (same pattern as stats.ts) ─────────────────────────
const dateExpr = (col: string) =>
  isSQLite ? `date(${col})` : `${col}::date`;

const dateNow = isSQLite ? "date('now')" : "CURRENT_DATE";

const daysAgo = (n: number) =>
  isSQLite ? `date('now', '-${n} days')` : `CURRENT_DATE - INTERVAL '${n} days'`;

// GET /api/admin/overview
router.get("/overview", async (_req, res) => {
  try {
    const [totalUsers, activeUsers, totalLogs, newUsersTrend] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM users`, []),
      query(
        `SELECT COUNT(DISTINCT user_id) as count FROM usage_logs
         WHERE ${dateExpr("logged_at")} >= ${daysAgo(7)}`,
        []
      ),
      query(`SELECT COUNT(*) as count FROM usage_logs`, []),
      query(
        `SELECT ${dateExpr("created_at")} as day, COUNT(*) as count
         FROM users
         WHERE ${dateExpr("created_at")} >= ${daysAgo(14)}
         GROUP BY ${dateExpr("created_at")}
         ORDER BY day`,
        []
      ),
    ]);

    res.json({
      data: {
        totalUsers: Number(totalUsers.rows[0].count),
        activeUsers: Number(activeUsers.rows[0].count),
        totalLogs: Number(totalLogs.rows[0].count),
        newUsersTrend: newUsersTrend.rows.map((r) => ({
          day: String(r.day),
          count: Number(r.count),
        })),
      },
    });
  } catch (err) {
    console.error("Admin overview error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/users?search=&page=&limit=
router.get("/users", async (req, res) => {
  try {
    const search = String(req.query.search || "");
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const castId = isSQLite ? "CAST(telegram_id AS TEXT)" : "telegram_id::text";

    const whereClause = search
      ? `WHERE (u.first_name LIKE $1 OR u.username LIKE $1 OR ${castId} LIKE $1)`
      : "";
    const params = search ? [searchPattern] : [];

    const [usersResult, countResult] = await Promise.all([
      query(
        `SELECT u.id, u.telegram_id, u.first_name, u.username, u.language, u.created_at,
           (SELECT COUNT(*) FROM usage_logs WHERE user_id = u.id) as log_count,
           (SELECT COUNT(*) FROM habit_profiles WHERE user_id = u.id AND is_active = 1) as profile_count
         FROM users u
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) as total FROM users u ${whereClause}`,
        params
      ),
    ]);

    res.json({
      data: {
        users: usersResult.rows.map((r) => ({
          id: Number(r.id),
          telegram_id: Number(r.telegram_id),
          first_name: String(r.first_name || ""),
          username: String(r.username || ""),
          language: String(r.language || "uz"),
          created_at: String(r.created_at),
          log_count: Number(r.log_count),
          profile_count: Number(r.profile_count),
        })),
        total: Number(countResult.rows[0].total),
      },
    });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const [userResult, profiles, recentLogs, dailyActivity] = await Promise.all([
      query(`SELECT id, telegram_id, first_name, username, language, notifications_enabled, notification_time, timezone, weekly_summary, created_at FROM users WHERE id = $1`, [userId]),
      query(`SELECT * FROM habit_profiles WHERE user_id = $1 ORDER BY created_at`, [userId]),
      query(
        `SELECT id, habit_type, quantity, logged_at FROM usage_logs
         WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 50`,
        [userId]
      ),
      query(
        `SELECT ${dateExpr("logged_at")} as day, habit_type, COALESCE(SUM(quantity), 0) as total
         FROM usage_logs
         WHERE user_id = $1 AND ${dateExpr("logged_at")} >= ${daysAgo(30)}
         GROUP BY ${dateExpr("logged_at")}, habit_type
         ORDER BY day`,
        [userId]
      ),
    ]);

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      data: {
        user: userResult.rows[0],
        profiles: profiles.rows,
        recentLogs: recentLogs.rows,
        dailyActivity: dailyActivity.rows.map((r) => ({
          day: String(r.day),
          habit_type: String(r.habit_type),
          total: Number(r.total),
        })),
      },
    });
  } catch (err) {
    console.error("Admin user detail error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/habits
router.get("/habits", async (_req, res) => {
  try {
    const result = await query(
      `SELECT
         hp.habit_type,
         COUNT(DISTINCT hp.user_id) as user_count,
         AVG(hp.daily_baseline) as avg_baseline,
         AVG(hp.daily_limit) as avg_limit,
         (SELECT COUNT(*) FROM usage_logs ul WHERE ul.habit_type = hp.habit_type) as total_logs,
         (SELECT COALESCE(SUM(ul.quantity), 0) FROM usage_logs ul WHERE ul.habit_type = hp.habit_type) as total_quantity
       FROM habit_profiles hp
       WHERE hp.is_active = 1
       GROUP BY hp.habit_type`,
      []
    );

    res.json({
      data: result.rows.map((r) => ({
        habit_type: String(r.habit_type),
        user_count: Number(r.user_count),
        avg_baseline: Math.round(Number(r.avg_baseline) * 10) / 10,
        avg_limit: Math.round(Number(r.avg_limit) * 10) / 10,
        total_logs: Number(r.total_logs),
        total_quantity: Number(r.total_quantity),
      })),
    });
  } catch (err) {
    console.error("Admin habits error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/activity?days=30
router.get("/activity", async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(String(req.query.days || "30"), 10)));

    const result = await query(
      `SELECT ${dateExpr("logged_at")} as day,
              COUNT(DISTINCT user_id) as active_users,
              COUNT(*) as log_count,
              COALESCE(SUM(quantity), 0) as total_quantity
       FROM usage_logs
       WHERE ${dateExpr("logged_at")} >= ${daysAgo(days)}
       GROUP BY ${dateExpr("logged_at")}
       ORDER BY day`,
      []
    );

    res.json({
      data: result.rows.map((r) => ({
        day: String(r.day),
        active_users: Number(r.active_users),
        log_count: Number(r.log_count),
        total_quantity: Number(r.total_quantity),
      })),
    });
  } catch (err) {
    console.error("Admin activity error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
