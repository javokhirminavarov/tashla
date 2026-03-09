import { Router } from "express";
import { query } from "../db.js";
import { authMiddleware } from "../auth.js";

const router = Router();

// GET /api/profiles — get user's active profiles
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, habit_type, daily_baseline, daily_limit, cost_per_unit, target_quit_date, is_active, created_at
       FROM habit_profiles
       WHERE user_id = $1 AND is_active = 1
       ORDER BY created_at`,
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error("Get profiles error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/profiles — create or update a habit profile
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { habit_type, daily_baseline, daily_limit, cost_per_unit, target_quit_date } = req.body;

    if (!habit_type || !daily_baseline) {
      res.status(400).json({ error: "habit_type and daily_baseline are required" });
      return;
    }

    if (!["sigaret", "nos", "alkogol"].includes(habit_type)) {
      res.status(400).json({ error: "Invalid habit_type" });
      return;
    }

    const result = await query(
      `INSERT INTO habit_profiles (user_id, habit_type, daily_baseline, daily_limit, cost_per_unit, target_quit_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (user_id, habit_type) DO UPDATE SET
         daily_baseline = EXCLUDED.daily_baseline,
         daily_limit = EXCLUDED.daily_limit,
         cost_per_unit = EXCLUDED.cost_per_unit,
         target_quit_date = EXCLUDED.target_quit_date,
         is_active = 1
       RETURNING id, habit_type, daily_baseline, daily_limit, cost_per_unit, target_quit_date, is_active, created_at`,
      [
        req.user.id,
        habit_type,
        daily_baseline,
        daily_limit ?? null,
        cost_per_unit ?? 0,
        target_quit_date ?? null,
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error("Create profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/profiles/:habitType — soft delete (deactivate)
router.delete("/:habitType", authMiddleware, async (req, res) => {
  try {
    const { habitType } = req.params;

    await query(
      `UPDATE habit_profiles SET is_active = 0 WHERE user_id = $1 AND habit_type = $2`,
      [req.user.id, habitType]
    );

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("Delete profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/profiles/me — update user preferences (language)
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;

    if (language && !["uz", "ru"].includes(language)) {
      res.status(400).json({ error: "Invalid language" });
      return;
    }

    if (language) {
      await query(
        `UPDATE users SET language = $1 WHERE id = $2`,
        [language, req.user.id]
      );
    }

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/profiles/me/notifications — update notification settings
router.patch("/me/notifications", authMiddleware, async (req, res) => {
  try {
    const { notifications_enabled, notification_time, weekly_summary } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (notifications_enabled !== undefined) {
      updates.push(`notifications_enabled = $${idx++}`);
      params.push(notifications_enabled ? 1 : 0);
    }
    if (notification_time !== undefined) {
      updates.push(`notification_time = $${idx++}`);
      params.push(notification_time);
    }
    if (weekly_summary !== undefined) {
      updates.push(`weekly_summary = $${idx++}`);
      params.push(weekly_summary ? 1 : 0);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    params.push(req.user.id);
    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}`,
      params
    );

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("Update notifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
