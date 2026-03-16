import { Router } from "express";
import { query, isSQLite, formatDateValue } from "../db.js";
import { authMiddleware } from "../auth.js";

const router = Router();

// GET /api/stats/money — money saved today + total per habit
router.get("/money", authMiddleware, async (req, res) => {
  try {
    // Get active profiles with cost info
    const profiles = await query(
      `SELECT habit_type, daily_baseline, cost_per_unit
       FROM habit_profiles
       WHERE user_id = $1 AND is_active = 1`,
      [req.user.id]
    );

    if (profiles.rows.length === 0) {
      res.json({ data: { today: {}, total: {} } });
      return;
    }

    const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";
    const dateNow = isSQLite ? "date('now')" : "CURRENT_DATE";

    // Today's counts per habit
    const todayResult = await query(
      `SELECT habit_type, COALESCE(SUM(quantity), 0) as count
       FROM usage_logs
       WHERE user_id = $1 AND ${dateExpr} = ${dateNow}
       GROUP BY habit_type`,
      [req.user.id]
    );

    const todayCounts: Record<string, number> = {};
    for (const row of todayResult.rows) {
      todayCounts[row.habit_type as string] = Number(row.count);
    }

    // Daily counts for all time (for total calculation)
    const dailyResult = await query(
      `SELECT ${dateExpr} as date, habit_type, COALESCE(SUM(quantity), 0) as count
       FROM usage_logs
       WHERE user_id = $1
       GROUP BY ${dateExpr}, habit_type`,
      [req.user.id]
    );

    // Group daily results by date+habit
    const dailyMap: Record<string, Record<string, number>> = {};
    for (const row of dailyResult.rows) {
      const date = formatDateValue(row.date);
      if (!dailyMap[date]) dailyMap[date] = {};
      dailyMap[date][row.habit_type as string] = Number(row.count);
    }

    // Build today + total saved per habit in a single loop
    const totalSaved: Record<string, number> = {};
    const todaySaved: Record<string, number> = {};

    for (const profile of profiles.rows) {
      const ht = profile.habit_type as string;
      const baseline = Number(profile.daily_baseline);
      const cost = Number(profile.cost_per_unit);

      // Today saved
      const todayCount = todayCounts[ht] || 0;
      todaySaved[ht] = Math.max(0, baseline - todayCount) * cost;

      // Total saved across all days
      let total = 0;
      for (const dateData of Object.values(dailyMap)) {
        const dayCount = dateData[ht] || 0;
        total += Math.max(0, baseline - dayCount) * cost;
      }
      totalSaved[ht] = total;
    }

    res.json({
      data: {
        today: todaySaved,
        total: totalSaved,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/stats/streak — consecutive days within limit per habit
router.get("/streak", authMiddleware, async (req, res) => {
  try {
    // Get active profiles with limits
    const profiles = await query(
      `SELECT habit_type, daily_baseline, daily_limit
       FROM habit_profiles
       WHERE user_id = $1 AND is_active = 1`,
      [req.user.id]
    );

    if (profiles.rows.length === 0) {
      res.json({ data: {} });
      return;
    }

    const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";

    // Get daily counts for last 90 days
    const dateOffset = isSQLite
      ? "date('now', '-90 days')"
      : "CURRENT_DATE - INTERVAL '90 days'";

    const logsResult = await query(
      `SELECT ${dateExpr} as date, habit_type, COALESCE(SUM(quantity), 0) as count
       FROM usage_logs
       WHERE user_id = $1 AND ${dateExpr} >= ${dateOffset}
       GROUP BY ${dateExpr}, habit_type
       ORDER BY ${dateExpr} DESC`,
      [req.user.id]
    );

    // Build map: date -> habit -> count
    const dailyMap: Record<string, Record<string, number>> = {};
    for (const row of logsResult.rows) {
      const date = formatDateValue(row.date);
      if (!dailyMap[date]) dailyMap[date] = {};
      dailyMap[date][row.habit_type as string] = Number(row.count);
    }

    const streaks: Record<string, number> = {};
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    for (const profile of profiles.rows) {
      const ht = profile.habit_type as string;
      const limit = Number(profile.daily_limit ?? profile.daily_baseline);
      let streak = 0;

      // Check today first
      const todayCount = dailyMap[todayStr]?.[ht] ?? 0;
      if (todayCount === 0) {
        // No logs today — start counting from yesterday
      } else if (todayCount > limit) {
        // Over limit today — streak is 0
        streaks[ht] = 0;
        continue;
      } else {
        // Within limit today — count today
        streak = 1;
      }

      // Go backwards from yesterday
      for (let d = 1; d <= 90; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split("T")[0];
        const count = dailyMap[dateStr]?.[ht];

        if (count === undefined) {
          // No logs this day — streak breaks
          break;
        }
        if (count > limit) {
          // Over limit — streak breaks
          break;
        }
        streak++;
      }

      streaks[ht] = streak;
    }

    res.json({ data: streaks });
  } catch (err) {
    console.error("Streak error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
