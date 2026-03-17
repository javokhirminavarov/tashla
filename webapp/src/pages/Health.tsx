import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import HealthTimeline from "../components/HealthTimeline";
import { api } from "../lib/api";
import type { HabitProfile, HealthData, HabitType } from "../lib/types";
import { HABIT_ICONS, HABIT_COLORS } from "../lib/types";

interface HealthProps {
  profiles: HabitProfile[];
}

export default function Health({ profiles }: HealthProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<HabitType>(
    profiles[0]?.habit_type ?? "sigaret"
  );
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getHealth(activeTab)
      .then(setHealthData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  const formatTimeSince = (hours: number): { value: number; unit: string }[] => {
    if (hours < 1) {
      return [{ value: Math.round(hours * 60), unit: t("health.minute") }];
    }
    if (hours < 24) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      const parts = [{ value: h, unit: t("health.hour") }];
      if (m > 0) parts.push({ value: m, unit: t("health.minute") });
      return parts;
    }
    const days = Math.floor(hours / 24);
    const remainHours = Math.round(hours % 24);
    const parts = [{ value: days, unit: t("health.dayUnit") }];
    if (remainHours > 0) parts.push({ value: remainHours, unit: t("health.hour") });
    return parts;
  };

  const timeParts = healthData
    ? formatTimeSince(healthData.hours_since)
    : [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-bg/90 backdrop-blur-md">
        <div className="w-10" />
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">
          {t("health.title")}
        </h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-5 py-4 w-full max-w-md mx-auto">
        {/* Habit tabs */}
        {profiles.length > 1 && (
          <div className="flex gap-3 mb-4">
            {profiles.map((p) => {
              const ht = p.habit_type;
              const active = ht === activeTab;
              return (
                <button
                  key={ht}
                  onClick={() => setActiveTab(ht)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.97] transition-transform duration-100 ${
                    active
                      ? "text-[#F1F5F2] shadow-card"
                      : "bg-bg-surface text-text-secondary"
                  }`}
                  style={
                    active ? { backgroundColor: HABIT_COLORS[ht] } : undefined
                  }
                >
                  <span>{HABIT_ICONS[ht]}</span>
                  <span>{t(`habits.${ht}`)}</span>
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-40 bg-white/5 rounded-xl" />
            <div className="h-6 bg-white/5 rounded-lg w-1/3" />
            <div className="h-32 bg-white/5 rounded-xl" />
            <div className="h-32 bg-white/5 rounded-xl" />
            <div className="h-32 bg-white/5 rounded-xl" />
          </div>
        ) : healthData ? (
          <>
            {/* Summary Card */}
            <div className="mb-4 bg-gradient-to-br from-brand to-brand-dark rounded-xl p-5 shadow-lg shadow-brand/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <p className="text-sm font-medium mb-1 text-[#F1F5F2]/90">
                  {t("health.timeSince", { habit: t(`habits.${activeTab}`) })}
                </p>
                {healthData.last_log_at ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      {timeParts.map((part, i) => (
                        <span key={i} className="flex items-baseline gap-1">
                          <span className="text-3xl font-light tracking-tight text-[#F1F5F2]">
                            {part.value}
                          </span>
                          <span className="text-sm font-medium text-[#F1F5F2]/80">
                            {part.unit}
                          </span>
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm text-[#F1F5F2]">
                      <span className="material-symbols-outlined text-[16px]">
                        trending_up
                      </span>
                      {t("health.greatResult")}
                    </div>
                  </>
                ) : (
                  <p className="text-xl font-semibold mt-2 text-[#F1F5F2]">
                    {t("health.notRecorded")}
                  </p>
                )}
              </div>
            </div>

            {/* Milestone counter */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">
                {t("health.milestones")}
              </h2>
              <span className="text-sm font-medium text-text-secondary">
                <span className="text-brand font-bold">
                  {healthData.milestones.filter((m) => m.unlocked).length}
                </span>
                /{healthData.milestones.length} {t("health.unlocked")}
              </span>
            </div>

            {/* Milestones timeline */}
            <HealthTimeline
              milestones={healthData.milestones}
              hoursSince={healthData.hours_since}
            />
          </>
        ) : (
          <div className="text-center text-text-muted py-20">
            <span className="material-symbols-outlined text-4xl mb-2 block">
              info
            </span>
            {t("health.noData")}
          </div>
        )}
      </main>
    </div>
  );
}
