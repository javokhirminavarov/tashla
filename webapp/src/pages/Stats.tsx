import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import WeeklyChart from "../components/WeeklyChart";
import { api } from "../lib/api";
import type { HabitProfile, DailyEntry, HabitType } from "../lib/types";
import { HABIT_COLORS, HABIT_MATERIAL_ICONS } from "../lib/types";

interface StatsProps {
  profiles: HabitProfile[];
}

export default function Stats({ profiles }: StatsProps) {
  const { t } = useTranslation();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periods = [
    { label: t("stats.week"), value: 7 },
    { label: t("stats.month"), value: 30 },
  ];

  const fetchData = () => {
    setLoading(true);
    setError(null);
    api
      .getDailyLogs(days)
      .then(setData)
      .catch((err) => {
        console.error(err);
        setError(err.message || t("common.error"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  // Compute summary + trend per habit
  const summaries = profiles.map((p) => {
    const ht = p.habit_type as HabitType;
    const values = data.map((d) => (d[ht] as number) ?? 0);
    const total = values.reduce((s, v) => s + v, 0);
    const avg = total / days;

    let trend: "down" | "up" | "flat" = "flat";
    if (values.length >= 2) {
      const mid = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, mid);
      const secondHalf = values.slice(mid);
      const firstAvg =
        firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
      if (secondAvg < firstAvg * 0.9) trend = "down";
      else if (secondAvg > firstAvg * 1.1) trend = "up";
    }

    // Overall completion percentage
    const limit = p.daily_limit ?? p.daily_baseline;
    let completionPct: number;
    if (limit <= 0) {
      completionPct = 0;
    } else if (avg === 0) {
      completionPct = 100;
    } else {
      completionPct = Math.round((1 - avg / limit) * 100);
    }

    return { ht, total, avg, trend, completionPct };
  });

  // Overall best performer
  const bestHabit = summaries.reduce(
    (best, s) => (s.completionPct > best.completionPct ? s : best),
    summaries[0]
  );
  const overallPct =
    summaries.length > 0
      ? Math.round(
          summaries.reduce((sum, s) => sum + Math.min(100, Math.max(0, s.completionPct)), 0) /
            summaries.length
        )
      : 0;

  const periodLabel =
    days === 7 ? t("stats.periodWeek") : t("stats.periodMonth");

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-bg/90 backdrop-blur-md">
        <div className="w-10" />
        <h1 className="text-lg font-semibold text-text-primary">{t("stats.title")}</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col gap-3 px-5 pb-28">
        {/* Segmented Control */}
        <div className="flex p-1 bg-bg-surface rounded-full">
          {periods.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all active:scale-[0.97] transition-transform duration-100 ${
                days === opt.value
                  ? "bg-brand/20 text-brand font-semibold shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-48 bg-white/5 rounded-xl" />
            <div className="h-6 bg-white/5 rounded-lg w-1/2" />
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full mb-4 bg-danger/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] text-danger">error</span>
            </div>
            <p className="text-sm text-[#94A3A1] mb-3">{error}</p>
            <button
              onClick={fetchData}
              className="min-h-[44px] px-6 rounded-lg bg-brand/15 text-brand text-sm font-semibold active:scale-[0.97] transition-transform duration-100"
            >
              {t("stats.retry")}
            </button>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full mb-4 bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] text-[#5C716A]">bar_chart</span>
            </div>
            <p className="text-sm text-[#94A3A1] mb-1">{t("stats.noLogs")}</p>
            <p className="text-xs text-[#5C716A]">{t("stats.noLogsHint")}</p>
          </div>
        ) : (
          <>
            {/* Summary Hero Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-brand-dark px-4 py-3.5 shadow-soft shadow-brand/30">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#F1F5F2]/90">
                    {t("stats.overallStatus")}
                  </span>
                  <span className="material-symbols-outlined text-[#F1F5F2]/80">
                    trending_down
                  </span>
                </div>
                <h2 className="text-3xl font-light tracking-tight text-[#F1F5F2] mb-1">
                  {overallPct >= 70
                    ? t("stats.excellent")
                    : overallPct >= 40
                    ? t("stats.good")
                    : t("stats.keepGoing")}
                </h2>
                <p className="text-sm text-[#F1F5F2]/80 mb-3">
                  {t("stats.completionMessage", { period: periodLabel, pct: overallPct })}
                </p>

                {bestHabit && (
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-lg p-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F2]/90 text-brand">
                      <span className="material-symbols-outlined">star</span>
                    </div>
                    <div>
                      <p className="text-xs text-[#F1F5F2]/80">
                        {t("stats.bestResult")}
                      </p>
                      <p className="font-semibold text-[#F1F5F2]">
                        {t(`habits.${bestHabit.ht}`)} (-
                        {bestHabit.completionPct}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section Title */}
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-lg font-semibold text-text-primary">
                {t("stats.habitsAnalysis")}
              </h3>
            </div>

            {/* Per-habit chart cards */}
            {profiles.map((p) => {
              const ht = p.habit_type as HabitType;
              const summary = summaries.find((s) => s.ht === ht)!;
              const color = HABIT_COLORS[ht];

              return (
                <div
                  key={ht}
                  className="flex flex-col overflow-hidden rounded-xl bg-bg-card shadow-card border border-white/[0.06]"
                >
                  <div className="px-4 py-3.5 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: color + "20",
                            color: color,
                          }}
                        >
                          <span className="material-symbols-outlined text-2xl">
                            {HABIT_MATERIAL_ICONS[ht]}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-text-primary">
                            {t(`habits.${ht}`)}
                          </h4>
                          <p className="text-xs text-text-muted">
                            {periodLabel}
                          </p>
                        </div>
                      </div>
                      {/* Trend badge */}
                      {summary.trend === "down" && (
                        <div className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">
                          <span className="material-symbols-outlined text-[16px]">
                            trending_down
                          </span>
                          {t("stats.trendDown")}
                        </div>
                      )}
                      {summary.trend === "up" && (
                        <div className="flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger">
                          <span className="material-symbols-outlined text-[16px]">
                            trending_up
                          </span>
                          {t("stats.trendUp")}
                        </div>
                      )}
                      {summary.trend === "flat" && (
                        <div className="flex items-center gap-1 rounded-full bg-bg-surface px-2.5 py-1 text-xs font-bold text-text-muted">
                          <span className="material-symbols-outlined text-[16px]">
                            remove
                          </span>
                          {t("stats.trendFlat")}
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex items-baseline gap-4">
                      <div>
                        <span className="text-3xl font-light tracking-tight text-text-primary">
                          {summary.total}
                        </span>
                        <span className="block text-xs font-medium tracking-wide uppercase text-text-muted mt-1">
                          {t("stats.totalCount")}
                        </span>
                      </div>
                      <div className="border-l border-white/[0.06] pl-4">
                        <span className="text-2xl font-light tracking-tight text-text-primary">
                          {summary.avg.toFixed(1)}
                        </span>
                        <span className="block text-xs font-medium tracking-wide uppercase text-text-muted mt-1">
                          {t("stats.perDayAvg")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="mt-2 px-2 min-w-0">
                    <WeeklyChart
                      data={data}
                      profiles={[p]}
                      days={days}
                      habitType={ht}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
