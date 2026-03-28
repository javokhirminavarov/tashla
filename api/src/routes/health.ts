import { Router } from "express";
import { query } from "../db.js";
import { authMiddleware } from "../auth.js";

const router = Router();

// GET /api/health/:habitType — milestones with unlock status
router.get("/:habitType", authMiddleware, async (req, res) => {
  try {
    const { habitType } = req.params;

    if (!["sigaret", "nos", "alkogol"].includes(habitType)) {
      res.status(400).json({ error: "Invalid habit_type" });
      return;
    }

    // Get the user's last log for this habit
    const lastLogResult = await query(
      `SELECT logged_at FROM usage_logs
       WHERE user_id = $1 AND habit_type = $2
       ORDER BY logged_at DESC LIMIT 1`,
      [req.user.id, habitType]
    );

    // Get the profile creation date as fallback
    const profileResult = await query(
      `SELECT created_at FROM habit_profiles
       WHERE user_id = $1 AND habit_type = $2 AND is_active = 1`,
      [req.user.id, habitType]
    );

    const rawLastLog = lastLogResult.rows[0]?.logged_at;
    const rawProfileCreated = profileResult.rows[0]?.created_at;

    // Reference time: last log, or profile creation if no logs
    const rawRef = rawLastLog || rawProfileCreated;

    // Get all milestones for this habit
    const milestones = await query(
      `SELECT id, hours_after, title_uz, description_uz, title_ru, description_ru, icon
       FROM health_milestones
       WHERE habit_type = $1
       ORDER BY hours_after`,
      [habitType]
    );

    let hoursSinceRef = 0;
    let lastLogAt: string | null = null;
    if (rawRef) {
      let refDate: Date;
      if (rawRef instanceof Date) {
        refDate = rawRef;
      } else {
        const s = String(rawRef);
        refDate = new Date(s + (s.includes("Z") || s.includes("+") ? "" : "Z"));
      }
      hoursSinceRef = (Date.now() - refDate.getTime()) / (1000 * 60 * 60);
    }
    if (rawLastLog) {
      lastLogAt = rawLastLog instanceof Date ? rawLastLog.toISOString() : String(rawLastLog);
    }

    const enriched = milestones.rows.map((m) => {
      const hoursAfter = Number(m.hours_after);
      const unlocked = rawRef ? hoursSinceRef >= hoursAfter : false;

      let unlocked_ago: string | undefined;
      if (unlocked) {
        const diff = hoursSinceRef - hoursAfter;
        if (diff < 1) unlocked_ago = `${Math.round(diff * 60)} daqiqa oldin`;
        else if (diff < 24) unlocked_ago = `${Math.round(diff)} soat oldin`;
        else unlocked_ago = `${Math.round(diff / 24)} kun oldin`;
      }

      let time_until: string | undefined;
      if (!unlocked && rawRef) {
        const diff = hoursAfter - hoursSinceRef;
        if (diff < 1) time_until = `${Math.round(diff * 60)} daqiqa`;
        else if (diff < 24) time_until = `${Math.round(diff)} soat`;
        else time_until = `${Math.round(diff / 24)} kun`;
      }

      return {
        ...m,
        hours_after: hoursAfter,
        unlocked,
        unlocked_ago,
        time_until,
      };
    });

    res.json({
      data: {
        last_log_at: lastLogAt || null,
        hours_since: Math.round(hoursSinceRef * 10) / 10,
        milestones: enriched,
      },
    });
  } catch (err) {
    console.error("Health error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
