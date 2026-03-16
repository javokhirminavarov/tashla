import { Router } from "express";
import { query, isSQLite, formatDateValue } from "../db.js";
import { authMiddleware } from "../auth.js";
import { randomBytes } from "crypto";

const router = Router();

function generateInviteCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

// POST /api/groups — create group
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Group name is required" });
      return;
    }

    const inviteCode = generateInviteCode();

    const groupResult = await query(
      `INSERT INTO groups (name, invite_code, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, invite_code, created_by, created_at`,
      [name.trim(), inviteCode, req.user.id]
    );

    const group = groupResult.rows[0];

    // Auto-join creator
    await query(
      `INSERT INTO group_members (group_id, user_id, hide_alkogol)
       VALUES ($1, $2, 1)`,
      [group.id, req.user.id]
    );

    res.status(201).json({
      data: {
        ...group,
        member_count: 1,
      },
    });
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/groups — list my groups
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT g.id, g.name, g.invite_code, g.created_at,
              (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );

    res.json({ data: result.rows });
  } catch (err) {
    console.error("List groups error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/groups/:id — group detail with members, progress, streaks
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);

    // Check membership
    const membership = await query(
      `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user.id]
    );

    if (membership.rows.length === 0) {
      res.status(403).json({ error: "Not a member of this group" });
      return;
    }

    // Get group info
    const group = await query(
      `SELECT id, name, invite_code, created_at FROM groups WHERE id = $1`,
      [groupId]
    );

    if (group.rows.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    // Get members with progress
    const members = await query(
      `SELECT gm.user_id, gm.hide_alkogol, u.first_name, u.telegram_id
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at`,
      [groupId]
    );

    const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";
    const dateNow = isSQLite ? "date('now')" : "CURRENT_DATE";

    const dateOffset7 = isSQLite
      ? "date('now', '-7 days')"
      : "CURRENT_DATE - INTERVAL '7 days'";
    const dateOffset90 = isSQLite
      ? "date('now', '-90 days')"
      : "CURRENT_DATE - INTERVAL '90 days'";

    const enrichedMembers = [];
    for (const member of members.rows) {
      const userId = Number(member.user_id);
      const hideAlkogol = Number(member.hide_alkogol);

      // Today's counts
      const todayResult = await query(
        `SELECT habit_type, COALESCE(SUM(quantity), 0) as count
         FROM usage_logs
         WHERE user_id = $1 AND ${dateExpr} = ${dateNow}
         GROUP BY habit_type`,
        [userId]
      );

      const todayCounts: Record<string, number> = {};
      for (const row of todayResult.rows) {
        const ht = row.habit_type as string;
        if (ht === "alkogol" && hideAlkogol && userId !== req.user.id) continue;
        todayCounts[ht] = Number(row.count);
      }

      // Profiles (baselines + limits)
      const profilesResult = await query(
        `SELECT habit_type, daily_limit, daily_baseline
         FROM habit_profiles
         WHERE user_id = $1 AND is_active = 1`,
        [userId]
      );

      const limits: Record<string, number> = {};
      const baselines: Record<string, number> = {};
      for (const row of profilesResult.rows) {
        const ht = row.habit_type as string;
        if (ht === "alkogol" && hideAlkogol && userId !== req.user.id) continue;
        limits[ht] = Number(row.daily_limit ?? row.daily_baseline);
        baselines[ht] = Number(row.daily_baseline);
      }

      // 7-day averages for reduction %
      const avg7Result = await query(
        `SELECT habit_type, COALESCE(AVG(daily_count), 0) as avg_count
         FROM (
           SELECT habit_type, ${dateExpr} as d, COALESCE(SUM(quantity), 0) as daily_count
           FROM usage_logs
           WHERE user_id = $1 AND ${dateExpr} >= ${dateOffset7}
           GROUP BY habit_type, ${dateExpr}
         ) sub
         GROUP BY habit_type`,
        [userId]
      );

      const reductionPct: Record<string, number> = {};
      const avgByHabit: Record<string, number> = {};
      for (const row of avg7Result.rows) {
        const ht = row.habit_type as string;
        if (ht === "alkogol" && hideAlkogol && userId !== req.user.id) continue;
        const avg = Number(row.avg_count);
        avgByHabit[ht] = avg;
        const bl = baselines[ht];
        if (bl && bl > 0) {
          reductionPct[ht] = Math.round(Math.max(0, (1 - avg / bl) * 100));
        } else {
          reductionPct[ht] = 0;
        }
      }
      // Fill habits with no logs in last 7 days as 100% reduction
      for (const ht of Object.keys(baselines)) {
        if (!(ht in reductionPct)) {
          reductionPct[ht] = 100;
        }
      }

      // Streaks (consecutive zero-use days, last 90 days)
      const streakLogsResult = await query(
        `SELECT ${dateExpr} as date, habit_type, COALESCE(SUM(quantity), 0) as count
         FROM usage_logs
         WHERE user_id = $1 AND ${dateExpr} >= ${dateOffset90}
         GROUP BY ${dateExpr}, habit_type
         ORDER BY ${dateExpr} DESC`,
        [userId]
      );

      const dailyMap: Record<string, Record<string, number>> = {};
      for (const row of streakLogsResult.rows) {
        const date = formatDateValue(row.date);
        if (!dailyMap[date]) dailyMap[date] = {};
        dailyMap[date][row.habit_type as string] = Number(row.count);
      }

      const streaks: Record<string, number> = {};
      const nowDate = new Date();
      const todayStr = nowDate.toISOString().split("T")[0];

      for (const ht of Object.keys(baselines)) {
        if (ht === "alkogol" && hideAlkogol && userId !== req.user.id) continue;
        const limit = limits[ht] ?? baselines[ht];
        let streak = 0;

        const tc = dailyMap[todayStr]?.[ht] ?? 0;
        if (tc > limit) {
          streaks[ht] = 0;
          continue;
        }
        if (tc > 0) streak = 1;

        for (let d = 1; d <= 90; d++) {
          const dd = new Date(nowDate);
          dd.setDate(dd.getDate() - d);
          const ds = dd.toISOString().split("T")[0];
          const count = dailyMap[ds]?.[ht];
          if (count === undefined) break;
          if (count > limit) break;
          streak++;
        }
        streaks[ht] = streak;
      }

      // Overall score
      const habitTypes = Object.keys(baselines);
      const avgReduction = habitTypes.length > 0
        ? habitTypes.reduce((sum, ht) => sum + (reductionPct[ht] ?? 0), 0) / habitTypes.length
        : 0;
      const avgStreak = habitTypes.length > 0
        ? habitTypes.reduce((sum, ht) => sum + Math.min(streaks[ht] ?? 0, 30), 0) / habitTypes.length
        : 0;
      const overallScore = Math.round(avgReduction * 0.6 + (avgStreak / 30) * 100 * 0.4);

      enrichedMembers.push({
        user_id: userId,
        first_name: member.first_name,
        hide_alkogol: hideAlkogol,
        is_self: userId === req.user.id,
        today: todayCounts,
        limits,
        baselines,
        streaks,
        reduction_pct: reductionPct,
        overall_score: overallScore,
      });
    }

    // Sort by overall_score descending
    enrichedMembers.sort((a, b) => b.overall_score - a.overall_score);

    res.json({
      data: {
        ...group.rows[0],
        members: enrichedMembers,
      },
    });
  } catch (err) {
    console.error("Group detail error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/groups/join — join by invite code
router.post("/join", authMiddleware, async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      res.status(400).json({ error: "invite_code is required" });
      return;
    }

    const group = await query(
      `SELECT id, name FROM groups WHERE invite_code = $1`,
      [invite_code.trim().toUpperCase()]
    );

    if (group.rows.length === 0) {
      res.status(404).json({ error: "Invalid invite code" });
      return;
    }

    const groupId = Number(group.rows[0].id);

    // Check if already a member
    const existing = await query(
      `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user.id]
    );

    if (existing.rows.length > 0) {
      res.json({ data: { group_id: groupId, already_member: true } });
      return;
    }

    await query(
      `INSERT INTO group_members (group_id, user_id, hide_alkogol) VALUES ($1, $2, 1)`,
      [groupId, req.user.id]
    );

    res.status(201).json({
      data: { group_id: groupId, name: group.rows[0].name },
    });
  } catch (err) {
    console.error("Join group error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/groups/:id/leave — leave group
router.delete("/:id/leave", authMiddleware, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);

    await query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user.id]
    );

    // Check if group is empty, if so delete it
    const remaining = await query(
      `SELECT COUNT(*) as cnt FROM group_members WHERE group_id = $1`,
      [groupId]
    );

    if (Number(remaining.rows[0].cnt) === 0) {
      await query(`DELETE FROM groups WHERE id = $1`, [groupId]);
    }

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("Leave group error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/groups/:id/privacy — toggle hide_alkogol
router.patch("/:id/privacy", authMiddleware, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const { hide_alkogol } = req.body;

    await query(
      `UPDATE group_members SET hide_alkogol = $1 WHERE group_id = $2 AND user_id = $3`,
      [hide_alkogol ? 1 : 0, groupId, req.user.id]
    );

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("Privacy toggle error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
