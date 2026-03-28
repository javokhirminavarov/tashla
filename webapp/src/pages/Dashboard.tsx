import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MultiRingProgress from "../components/MultiRingProgress";
import HabitProgressBars from "../components/HabitProgressBars";
import BottomSheet from "../components/BottomSheet";
import MoneySaved from "../components/MoneySaved";
import { useLogs } from "../hooks/useLogs";
import { haptic } from "../lib/telegram";
import { api } from "../lib/api";
import {
  HABIT_COLORS,
} from "../lib/types";
import type {
  HabitProfile,
  MoneySaved as MoneySavedType,
  HabitType,
  QuitPlan,
} from "../lib/types";

interface DashboardProps {
  profiles: HabitProfile[];
}

export default function Dashboard({ profiles }: DashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { todayCounts, logUsage } = useLogs();
  const [money, setMoney] = useState<MoneySavedType>({ today: {}, total: {} });
  const [selectedHabit, setSelectedHabit] = useState<HabitType>(
    profiles[0]?.habit_type ?? "sigaret"
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [quitPlans, setQuitPlans] = useState<QuitPlan[]>([]);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    setDataError(false);
    Promise.all([
      api.getMoneySaved().then(setMoney),
      api.getStreaks().then(setStreaks),
      api.getQuitPlans().then(setQuitPlans),
    ]).catch(() => setDataError(true));
  }, [todayCounts]);

  const handleLog = () => {
    haptic("light");
    if (profiles.length === 1) {
      logUsage(profiles[0].habit_type);
    } else {
      setSheetOpen(true);
    }
  };

  const handleSheetLog = async (ht: HabitType) => {
    await logUsage(ht);
  };

  const now = new Date();
  const weekday = t(`dashboard.weekday_${now.getDay()}`);
  const month = t(`dashboard.month_${now.getMonth()}`);
  const dateStr = t("dashboard.dateFormat", { date: now.getDate(), month });

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="pt-4 pb-3 px-5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-text-muted text-sm font-medium">
            {weekday}
          </span>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {dateStr}
          </h1>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="h-10 w-10 rounded-full bg-bg-surface flex items-center justify-center border border-border overflow-hidden transition-colors hover:bg-bg-card"
        >
          <span className="material-symbols-outlined text-text-muted text-[20px]">
            person
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-5">
        {/* Hero Card — multi-ring + progress bars */}
        <div className="w-full bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-5">
            <MultiRingProgress
              habits={profiles.map((p) => ({
                color: HABIT_COLORS[p.habit_type],
                current: todayCounts[p.habit_type] ?? 0,
                max: p.daily_limit ?? p.daily_baseline,
              }))}
              totalCount={profiles.reduce(
                (sum, p) => sum + (todayCounts[p.habit_type] ?? 0),
                0
              )}
              label={t("common.pieces")}
            />
            <HabitProgressBars
              habits={profiles.map((p) => ({
                type: p.habit_type,
                current: todayCounts[p.habit_type] ?? 0,
                max: p.daily_limit ?? p.daily_baseline,
                color: HABIT_COLORS[p.habit_type],
              }))}
              selected={selectedHabit}
              onSelect={setSelectedHabit}
            />
          </div>
          {(streaks[selectedHabit] ?? 0) > 0 && (
            <div className="mt-3 flex justify-center animate-streak-pop">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-sm font-bold">
                {t("dashboard.streak", { count: streaks[selectedHabit] })}
              </span>
            </div>
          )}
        </div>

        {/* Error banner */}
        {dataError && (
          <div className="w-full bg-[#EF4444]/10 rounded-xl p-3 border border-[#EF4444]/20 flex items-center justify-between mt-4">
            <span className="text-xs text-[#EF4444]">{t("common.error")}</span>
            <button
              onClick={() => {
                setDataError(false);
                api.getMoneySaved().then(setMoney).catch(() => setDataError(true));
                api.getStreaks().then(setStreaks).catch(() => setDataError(true));
                api.getQuitPlans().then(setQuitPlans).catch(() => setDataError(true));
              }}
              className="text-xs text-[#1fc762] font-semibold active:scale-[0.97] transition-transform"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {/* Savings Card */}
        <div className="w-full mt-4">
          <MoneySaved money={money} />
        </div>

        {/* Quit Plan Progress */}
        {(() => {
          const plan = quitPlans.find((p) => p.habit_type === selectedHabit);
          if (!plan) return null;
          const activeStep = plan.steps.find((s) => s.status === "active");
          const nextStep = plan.steps.find((s) => s.status === "upcoming");
          if (!activeStep) return null;
          const daysLeft = Math.max(0, Math.ceil((new Date(activeStep.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          return (
            <div className="w-full bg-bg-card rounded-2xl p-4 shadow-card border border-border mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-brand text-[20px]">trending_down</span>
                <span className="text-sm font-semibold text-text-primary">
                  {t("quitPlan.planProgress", { step: activeStep.step_number })}
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                {t("quitPlan.currentLimitLabel", {
                  current: activeStep.daily_limit,
                  next: nextStep?.daily_limit ?? plan.target_limit,
                  days: daysLeft,
                })}
              </p>
            </div>
          );
        })()}

      </main>

      {/* FAB */}
      <button
        onClick={handleLog}
        className="fixed bottom-24 right-5 z-[45] w-14 h-14 rounded-full bg-[#1fc762] flex items-center justify-center shadow-[0_0_20px_rgba(31,199,98,0.3)] transition-transform duration-150 active:scale-[0.95]"
      >
        <span className="material-symbols-outlined text-[24px] text-[#0d1a12]">add</span>
      </button>

      {/* Bottom sheet for multi-habit logging */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        profiles={profiles}
        todayCounts={todayCounts}
        onLog={handleSheetLog}
      />
    </div>
  );
}
