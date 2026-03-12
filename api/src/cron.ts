import cron from "node-cron";
import { InlineKeyboard } from "grammy";
import { query, isSQLite } from "./db.js";
import { getBot } from "./bot.js";

const WEBAPP_URL = process.env.WEBAPP_URL || "";

function openAppKeyboard(): InlineKeyboard {
  return new InlineKeyboard().webApp("Ochish / Открыть", WEBAPP_URL);
}

interface NotifUser {
  telegram_id: number;
  language: string;
  notification_time: string;
  notifications_enabled: number;
  weekly_summary: number;
}

function msg(lang: string, uz: string, ru: string): string {
  return lang === "ru" ? ru : uz;
}

async function sendSafe(telegramId: number, text: string): Promise<void> {
  const b = getBot();
  if (!b) return;
  try {
    await b.api.sendMessage(telegramId, text, {
      reply_markup: openAppKeyboard(),
    });
  } catch (err) {
    console.error(`Failed to send to ${telegramId}:`, err);
  }
}

// Daily reminder — runs every 15 minutes, checks users whose notification_time matches current HH:MM (±7 min)
async function dailyReminder(): Promise<void> {
  const now = new Date();
  // Tashkent is UTC+5
  const tashkentHour = (now.getUTCHours() + 5) % 24;
  const tashkentMin = now.getUTCMinutes();
  const currentTime = `${String(tashkentHour).padStart(2, "0")}:${String(tashkentMin).padStart(2, "0")}`;

  // Find users whose notification_time is within ±7 minutes of now
  const users = await query(
    `SELECT telegram_id, language, notification_time FROM users
     WHERE notifications_enabled = 1 AND notification_time IS NOT NULL`,
    []
  );

  for (const user of users.rows as unknown as NotifUser[]) {
    const [h, m] = user.notification_time.split(":").map(Number);
    const userMin = h * 60 + m;
    const nowMin = tashkentHour * 60 + tashkentMin;
    if (Math.abs(userMin - nowMin) <= 7) {
      await sendSafe(
        user.telegram_id,
        msg(user.language,
          "📝 Bugungi natijalaringizni yozing!",
          "📝 Запишите сегодняшние результаты!"
        )
      );
    }
  }
}

// Streak motivation — runs at 09:00 Tashkent
async function streakMotivation(): Promise<void> {
  const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";

  const users = await query(
    `SELECT u.telegram_id, u.language, hp.habit_type, hp.daily_limit, hp.daily_baseline
     FROM users u
     JOIN habit_profiles hp ON hp.user_id = u.id AND hp.is_active = 1
     WHERE u.notifications_enabled = 1`,
    []
  );

  // Group by telegram_id
  const userHabits: Record<number, { language: string; habits: { habit_type: string; limit: number }[] }> = {};
  for (const row of users.rows) {
    const tid = Number(row.telegram_id);
    if (!userHabits[tid]) {
      userHabits[tid] = { language: row.language as string, habits: [] };
    }
    userHabits[tid].habits.push({
      habit_type: row.habit_type as string,
      limit: Number(row.daily_limit ?? row.daily_baseline),
    });
  }

  for (const [tidStr, data] of Object.entries(userHabits)) {
    const tid = Number(tidStr);
    // Simple streak check: just count days within limit for the best habit
    // (Full streak calc is complex; we do a simplified version for notifications)
    let bestStreak = 0;
    for (const habit of data.habits) {
      const logsResult = await query(
        `SELECT ${dateExpr} as date, COALESCE(SUM(quantity), 0) as count
         FROM usage_logs
         WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1) AND habit_type = $2
         GROUP BY ${dateExpr}
         ORDER BY ${dateExpr} DESC
         LIMIT 30`,
        [tid, habit.habit_type]
      );
      let streak = 0;
      for (const row of logsResult.rows) {
        const count = Number(row.count);
        if (count <= habit.limit) streak++;
        else break;
      }
      bestStreak = Math.max(bestStreak, streak);
    }

    if (bestStreak > 3) {
      await sendSafe(tid,
        msg(data.language,
          `🔥 ${bestStreak} kunlik streak! Davom eting!`,
          `🔥 Серия ${bestStreak} дней! Продолжайте!`
        )
      );
    }
  }
}

// Weekly summary — runs Sunday 20:00 Tashkent
async function weeklySummaryNotif(): Promise<void> {
  const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";
  const weekAgo = isSQLite ? "date('now', '-7 days')" : "CURRENT_DATE - INTERVAL '7 days'";
  const twoWeeksAgo = isSQLite ? "date('now', '-14 days')" : "CURRENT_DATE - INTERVAL '14 days'";

  const users = await query(
    `SELECT u.id, u.telegram_id, u.language
     FROM users u
     WHERE u.notifications_enabled = 1 AND u.weekly_summary = 1`,
    []
  );

  for (const user of users.rows) {
    const uid = Number(user.id);
    const tid = Number(user.telegram_id);
    const lang = user.language as string;

    // This week total
    const thisWeek = await query(
      `SELECT habit_type, COALESCE(SUM(quantity), 0) as count
       FROM usage_logs
       WHERE user_id = $1 AND ${dateExpr} >= ${weekAgo}
       GROUP BY habit_type`,
      [uid]
    );

    // Last week total
    const lastWeek = await query(
      `SELECT habit_type, COALESCE(SUM(quantity), 0) as count
       FROM usage_logs
       WHERE user_id = $1 AND ${dateExpr} >= ${twoWeeksAgo} AND ${dateExpr} < ${weekAgo}
       GROUP BY habit_type`,
      [uid]
    );

    const thisMap: Record<string, number> = {};
    for (const r of thisWeek.rows) thisMap[r.habit_type as string] = Number(r.count);
    const lastMap: Record<string, number> = {};
    for (const r of lastWeek.rows) lastMap[r.habit_type as string] = Number(r.count);

    const parts: string[] = [];
    for (const ht of Object.keys(thisMap)) {
      const thisCount = thisMap[ht];
      const lastCount = lastMap[ht] || thisCount;
      if (lastCount > 0) {
        const pctChange = Math.round(((lastCount - thisCount) / lastCount) * 100);
        if (pctChange > 0) {
          const habitName = ht === "sigaret" ? (lang === "ru" ? "Сигареты" : "Sigaret") :
                            ht === "nos" ? (lang === "ru" ? "Насвай" : "Nos") :
                            (lang === "ru" ? "Алкоголь" : "Alkogol");
          parts.push(`${habitName} ${pctChange}%↓`);
        }
      }
    }

    if (parts.length > 0) {
      const summary = parts.join(", ");
      await sendSafe(tid,
        msg(lang,
          `📊 Bu hafta: ${summary}. Ajoyib natija!`,
          `📊 На этой неделе: ${summary}. Отличный результат!`
        )
      );
    }
  }
}

// Streak warning — runs at 22:00 Tashkent
async function streakWarning(): Promise<void> {
  const dateExpr = isSQLite ? "date(logged_at)" : "logged_at::date";
  const dateNow = isSQLite ? "date('now')" : "CURRENT_DATE";

  const users = await query(
    `SELECT u.telegram_id, u.language
     FROM users u
     JOIN habit_profiles hp ON hp.user_id = u.id AND hp.is_active = 1
     WHERE u.notifications_enabled = 1
     GROUP BY u.id, u.telegram_id, u.language`,
    []
  );

  for (const user of users.rows) {
    const tid = Number(user.telegram_id);
    const lang = user.language as string;

    // Check if user has any logs today
    const todayLogs = await query(
      `SELECT COUNT(*) as cnt FROM usage_logs
       WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1) AND ${dateExpr} = ${dateNow}`,
      [tid]
    );

    const hasLogs = Number(todayLogs.rows[0]?.cnt ?? 0) > 0;
    if (!hasLogs) {
      await sendSafe(tid,
        msg(lang,
          "⚠️ Streakingiz yo'qolmasin! Bugungi natijangizni yozing.",
          "⚠️ Не потеряйте серию! Запишите сегодняшний результат."
        )
      );
    }
  }
}

// Quit plan step transitions — runs daily at 00:05 Tashkent
async function quitPlanTransitions(): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Find active plans where current step's end_date < today
  const activePlans = await query(
    `SELECT qp.id as plan_id, qp.user_id, qp.habit_type, qp.current_step, qp.target_limit,
            u.telegram_id, u.language, u.notifications_enabled
     FROM quit_plans qp
     JOIN users u ON u.id = qp.user_id
     WHERE qp.is_active = 1`,
    []
  );

  for (const plan of activePlans.rows) {
    const planId = Number(plan.plan_id);
    const currentStepNum = Number(plan.current_step);

    // Get current step
    const currentStep = await query(
      `SELECT * FROM quit_plan_steps WHERE plan_id = $1 AND step_number = $2`,
      [planId, currentStepNum]
    );

    if (currentStep.rows.length === 0) continue;
    const cs = currentStep.rows[0];

    // Check if current step's end_date has passed
    if (String(cs.end_date) >= today) continue;

    // Mark current as completed
    await query(
      `UPDATE quit_plan_steps SET status = 'completed' WHERE plan_id = $1 AND step_number = $2`,
      [planId, currentStepNum]
    );

    // Get next step
    const nextStep = await query(
      `SELECT * FROM quit_plan_steps WHERE plan_id = $1 AND step_number = $2`,
      [planId, currentStepNum + 1]
    );

    if (nextStep.rows.length > 0) {
      const ns = nextStep.rows[0];
      // Activate next step
      await query(
        `UPDATE quit_plan_steps SET status = 'active' WHERE plan_id = $1 AND step_number = $2`,
        [planId, currentStepNum + 1]
      );
      // Update plan's current_step
      await query(
        `UPDATE quit_plans SET current_step = $1 WHERE id = $2`,
        [currentStepNum + 1, planId]
      );
      // Update habit_profiles daily_limit
      await query(
        `UPDATE habit_profiles SET daily_limit = $1 WHERE user_id = $2 AND habit_type = $3`,
        [ns.daily_limit, plan.user_id, plan.habit_type]
      );

      // Send notification
      if (Number(plan.notifications_enabled)) {
        const newLimit = Number(ns.daily_limit);
        await sendSafe(Number(plan.telegram_id),
          msg(plan.language as string,
            `📉 Yangi bosqich! Limitingiz endi: ${newLimit}`,
            `📉 Новый этап! Ваш лимит теперь: ${newLimit}`
          )
        );
      }
    } else {
      // No more steps — plan completed
      await query(
        `UPDATE quit_plans SET is_active = 0 WHERE id = $1`,
        [planId]
      );
      // Set limit to target
      await query(
        `UPDATE habit_profiles SET daily_limit = $1 WHERE user_id = $2 AND habit_type = $3`,
        [plan.target_limit, plan.user_id, plan.habit_type]
      );
      if (Number(plan.notifications_enabled)) {
        await sendSafe(Number(plan.telegram_id),
          msg(plan.language as string,
            "🎉 Tabriklaymiz! Kamaytirish rejangiz muvaffaqiyatli yakunlandi!",
            "🎉 Поздравляем! Ваш план снижения успешно завершён!"
          )
        );
      }
    }
  }
}

export function startCronJobs(): void {
  if (!getBot()) {
    console.log("⚠️ BOT_TOKEN not configured — cron jobs disabled");
    return;
  }

  console.log("🕐 Starting cron jobs...");

  // Daily reminder: every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      await dailyReminder();
    } catch (err) {
      console.error("Cron dailyReminder error:", err);
    }
  });

  // Streak motivation: 09:00 Tashkent (04:00 UTC)
  cron.schedule("0 4 * * *", async () => {
    try {
      await streakMotivation();
    } catch (err) {
      console.error("Cron streakMotivation error:", err);
    }
  });

  // Weekly summary: Sunday 20:00 Tashkent (15:00 UTC)
  cron.schedule("0 15 * * 0", async () => {
    try {
      await weeklySummaryNotif();
    } catch (err) {
      console.error("Cron weeklySummary error:", err);
    }
  });

  // Streak warning: 22:00 Tashkent (17:00 UTC)
  cron.schedule("0 17 * * *", async () => {
    try {
      await streakWarning();
    } catch (err) {
      console.error("Cron streakWarning error:", err);
    }
  });

  // Quit plan step transitions: 00:05 Tashkent (19:05 UTC previous day)
  cron.schedule("5 19 * * *", async () => {
    try {
      await quitPlanTransitions();
    } catch (err) {
      console.error("Cron quitPlanTransitions error:", err);
    }
  });

  console.log("✅ Cron jobs scheduled");
}
