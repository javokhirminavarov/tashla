import { Router } from "express";
import { query } from "../db.js";
import { authMiddleware } from "../auth.js";

const router = Router();

interface StepRow {
  id: number;
  plan_id: number;
  step_number: number;
  daily_limit: number;
  start_date: string;
  end_date: string;
  status: string;
}

function generateSteps(
  startLimit: number,
  targetLimit: number,
  reductionPercent: number,
  stepDurationDays: number,
  startDate: Date
): { step_number: number; daily_limit: number; start_date: string; end_date: string }[] {
  const steps: { step_number: number; daily_limit: number; start_date: string; end_date: string }[] = [];
  let limit = startLimit;
  let step = 1;
  let date = new Date(startDate);

  while (limit > targetLimit) {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + stepDurationDays - 1);

    steps.push({
      step_number: step,
      daily_limit: limit,
      start_date: date.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    });

    const nextLimit = Math.max(targetLimit, Math.floor(limit * (1 - reductionPercent / 100)));
    if (nextLimit === limit) break; // Avoid infinite loop
    limit = nextLimit;
    date = new Date(endDate);
    date.setDate(date.getDate() + 1);
    step++;
  }

  // Final step at target
  if (steps.length === 0 || steps[steps.length - 1].daily_limit !== targetLimit) {
    const lastEnd = steps.length > 0 ? new Date(steps[steps.length - 1].end_date) : new Date(startDate);
    lastEnd.setDate(lastEnd.getDate() + 1);
    const endDate = new Date(lastEnd);
    endDate.setDate(endDate.getDate() + stepDurationDays - 1);

    steps.push({
      step_number: step,
      daily_limit: targetLimit,
      start_date: lastEnd.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    });
  }

  return steps;
}

// POST /api/quit-plan — create plan + generate steps
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { habit_type, start_limit, target_limit, reduction_percent, step_duration_days } = req.body;

    if (!habit_type || start_limit === undefined) {
      res.status(400).json({ error: "habit_type and start_limit are required" });
      return;
    }

    if (!["sigaret", "nos", "alkogol"].includes(habit_type)) {
      res.status(400).json({ error: "Invalid habit_type" });
      return;
    }

    const targetLim = target_limit ?? 0;
    const reductionPct = reduction_percent ?? 15;
    const stepDays = step_duration_days ?? 7;

    // Upsert plan
    const planResult = await query(
      `INSERT INTO quit_plans (user_id, habit_type, start_limit, target_limit, reduction_percent, step_duration_days, current_step, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 1, 1)
       ON CONFLICT (user_id, habit_type) DO UPDATE SET
         start_limit = EXCLUDED.start_limit,
         target_limit = EXCLUDED.target_limit,
         reduction_percent = EXCLUDED.reduction_percent,
         step_duration_days = EXCLUDED.step_duration_days,
         current_step = 1,
         is_active = 1,
         started_at = datetime('now')
       RETURNING id`,
      [req.user.id, habit_type, start_limit, targetLim, reductionPct, stepDays]
    );

    const planId = Number(planResult.rows[0].id);

    // Delete old steps
    await query(`DELETE FROM quit_plan_steps WHERE plan_id = $1`, [planId]);

    // Generate new steps
    const steps = generateSteps(start_limit, targetLim, reductionPct, stepDays, new Date());

    // Insert steps
    for (const step of steps) {
      const status = step.step_number === 1 ? "active" : "upcoming";
      await query(
        `INSERT INTO quit_plan_steps (plan_id, step_number, daily_limit, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [planId, step.step_number, step.daily_limit, step.start_date, step.end_date, status]
      );
    }

    // Update habit_profiles daily_limit to first step's limit
    await query(
      `UPDATE habit_profiles SET daily_limit = $1 WHERE user_id = $2 AND habit_type = $3`,
      [steps[0].daily_limit, req.user.id, habit_type]
    );

    // Fetch and return
    const stepsResult = await query(
      `SELECT * FROM quit_plan_steps WHERE plan_id = $1 ORDER BY step_number`,
      [planId]
    );

    res.status(201).json({
      data: {
        ...planResult.rows[0],
        habit_type,
        start_limit,
        target_limit: targetLim,
        reduction_percent: reductionPct,
        step_duration_days: stepDays,
        steps: stepsResult.rows,
      },
    });
  } catch (err) {
    console.error("Create quit plan error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/quit-plan — list all active plans
router.get("/", authMiddleware, async (req, res) => {
  try {
    const plans = await query(
      `SELECT * FROM quit_plans WHERE user_id = $1 AND is_active = 1`,
      [req.user.id]
    );

    // For each plan, fetch steps
    const result = [];
    for (const plan of plans.rows) {
      const steps = await query(
        `SELECT * FROM quit_plan_steps WHERE plan_id = $1 ORDER BY step_number`,
        [plan.id]
      );
      result.push({ ...plan, steps: steps.rows });
    }

    res.json({ data: result });
  } catch (err) {
    console.error("Get quit plans error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/quit-plan/:habitType — plan detail with steps
router.get("/:habitType", authMiddleware, async (req, res) => {
  try {
    const { habitType } = req.params;

    const plan = await query(
      `SELECT * FROM quit_plans WHERE user_id = $1 AND habit_type = $2 AND is_active = 1`,
      [req.user.id, habitType]
    );

    if (plan.rows.length === 0) {
      res.json({ data: null });
      return;
    }

    const steps = await query(
      `SELECT * FROM quit_plan_steps WHERE plan_id = $1 ORDER BY step_number`,
      [plan.rows[0].id]
    );

    res.json({ data: { ...plan.rows[0], steps: steps.rows } });
  } catch (err) {
    console.error("Get quit plan error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/quit-plan/:habitType — deactivate plan
router.delete("/:habitType", authMiddleware, async (req, res) => {
  try {
    const { habitType } = req.params;

    await query(
      `UPDATE quit_plans SET is_active = 0 WHERE user_id = $1 AND habit_type = $2`,
      [req.user.id, habitType]
    );

    res.json({ data: { success: true } });
  } catch (err) {
    console.error("Delete quit plan error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/quit-plan/:habitType/adjust — speed up or slow down
router.post("/:habitType/adjust", authMiddleware, async (req, res) => {
  try {
    const { habitType } = req.params;
    const { direction } = req.body; // "faster" or "slower"

    const plan = await query(
      `SELECT * FROM quit_plans WHERE user_id = $1 AND habit_type = $2 AND is_active = 1`,
      [req.user.id, habitType]
    );

    if (plan.rows.length === 0) {
      res.status(404).json({ error: "No active plan found" });
      return;
    }

    const p = plan.rows[0];
    let newPct = Number(p.reduction_percent);
    if (direction === "faster") {
      newPct = Math.min(30, newPct + 5);
    } else {
      newPct = Math.max(5, newPct - 5);
    }

    await query(
      `UPDATE quit_plans SET reduction_percent = $1 WHERE id = $2`,
      [newPct, p.id]
    );

    // Regenerate remaining steps from current step
    const currentStep = await query(
      `SELECT * FROM quit_plan_steps WHERE plan_id = $1 AND status = 'active' ORDER BY step_number LIMIT 1`,
      [p.id]
    );

    if (currentStep.rows.length > 0) {
      const cs = currentStep.rows[0] as unknown as StepRow;
      // Delete future steps
      await query(
        `DELETE FROM quit_plan_steps WHERE plan_id = $1 AND step_number > $2`,
        [p.id, cs.step_number]
      );

      // Regenerate from current limit
      const futureSteps = generateSteps(
        cs.daily_limit,
        Number(p.target_limit),
        newPct,
        Number(p.step_duration_days),
        new Date(cs.end_date)
      );

      for (let i = 1; i < futureSteps.length; i++) {
        const s = futureSteps[i];
        await query(
          `INSERT INTO quit_plan_steps (plan_id, step_number, daily_limit, start_date, end_date, status)
           VALUES ($1, $2, $3, $4, $5, 'upcoming')`,
          [p.id, cs.step_number + i, s.daily_limit, s.start_date, s.end_date]
        );
      }
    }

    res.json({ data: { success: true, reduction_percent: newPct } });
  } catch (err) {
    console.error("Adjust quit plan error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
