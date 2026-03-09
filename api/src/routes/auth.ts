import { Router } from "express";
import { query } from "../db.js";
import { authMiddleware } from "../auth.js";

const router = Router();

// POST /api/auth — validate initData, upsert user, return user + profiles
router.post("/", authMiddleware, async (req, res) => {
  try {
    const profiles = await query(
      `SELECT id, habit_type, daily_baseline, daily_limit, cost_per_unit, target_quit_date, is_active, created_at
       FROM habit_profiles
       WHERE user_id = $1 AND is_active = 1
       ORDER BY created_at`,
      [req.user.id]
    );

    res.json({
      data: {
        user: req.user,
        profiles: profiles.rows,
      },
    });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
