import { useState } from "react";
import { useTranslation } from "react-i18next";
import { haptic } from "../lib/telegram";
import { api } from "../lib/api";
import { HABIT_COLORS, HABIT_ICONS } from "../lib/types";
import type { HabitProfile, HabitType, QuitPlan } from "../lib/types";

interface QuitPlanSheetProps {
  open: boolean;
  onClose: () => void;
  profiles: HabitProfile[];
  onCreated: (plan: QuitPlan) => void;
}

const SPEED_OPTIONS = [
  { key: "slow", reductionPercent: 10, durationDays: 10 },
  { key: "medium", reductionPercent: 15, durationDays: 7 },
  { key: "fast", reductionPercent: 25, durationDays: 5 },
];

export default function QuitPlanSheet({
  open,
  onClose,
  profiles,
  onCreated,
}: QuitPlanSheetProps) {
  const { t } = useTranslation();
  const [selectedHabit, setSelectedHabit] = useState<HabitType>(
    profiles[0]?.habit_type ?? "sigaret"
  );
  const [targetLimit, setTargetLimit] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1); // default medium
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const profile = profiles.find((p) => p.habit_type === selectedHabit);
  const startLimit = profile?.daily_limit ?? profile?.daily_baseline ?? 10;
  const speed = SPEED_OPTIONS[speedIdx];

  // Estimate weeks
  let limit = startLimit;
  let weeks = 0;
  while (limit > targetLimit && weeks < 52) {
    limit = Math.max(targetLimit, Math.floor(limit * (1 - speed.reductionPercent / 100)));
    if (limit === startLimit) break;
    weeks++;
  }

  const handleCreate = async () => {
    setSaving(true);
    haptic("medium");
    try {
      const plan = await api.createQuitPlan({
        habit_type: selectedHabit,
        start_limit: startLimit,
        target_limit: targetLimit,
        reduction_percent: speed.reductionPercent,
        step_duration_days: speed.durationDays,
      });
      onCreated(plan);
      onClose();
    } catch (err) {
      console.error("Failed to create quit plan:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-bg-card rounded-t-3xl p-5 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto border-t border-white/[0.08]">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-white/[0.06]" />
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("quitPlan.title")}
        </h3>

        {/* Habit selector */}
        {profiles.length > 1 && (
          <div className="flex gap-2 mb-4">
            {profiles.map((p) => {
              const ht = p.habit_type;
              const active = ht === selectedHabit;
              return (
                <button
                  key={ht}
                  onClick={() => {
                    setSelectedHabit(ht);
                    haptic("light");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.97] transition-transform duration-100 ${
                    active
                      ? "text-[#F1F5F2]"
                      : "bg-bg-surface text-text-secondary"
                  }`}
                  style={active ? { backgroundColor: HABIT_COLORS[ht] } : undefined}
                >
                  {HABIT_ICONS[ht]} {t(`habits.${ht}`)}
                </button>
              );
            })}
          </div>
        )}

        {/* Current limit display */}
        <div className="bg-bg-surface rounded-xl p-3.5 mb-4">
          <p className="text-xs text-text-muted mb-1">{t("quitPlan.currentLimit")}</p>
          <p className="text-2xl font-light tracking-tight text-text-primary">{startLimit} {t("common.piecesPerDay")}</p>
        </div>

        {/* Target limit */}
        <div className="bg-bg-surface rounded-xl p-3.5 mb-4">
          <p className="text-xs text-text-muted mb-2">{t("quitPlan.targetLimit")}</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => { setTargetLimit(Math.max(0, targetLimit - 1)); haptic("light"); }}
              className="w-10 h-10 rounded-full bg-bg-card flex items-center justify-center active:scale-[0.97] transition-transform duration-100"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="text-3xl font-light tracking-tight text-brand w-16 text-center">{targetLimit}</span>
            <button
              onClick={() => { setTargetLimit(Math.min(startLimit - 1, targetLimit + 1)); haptic("light"); }}
              className="w-10 h-10 rounded-full bg-bg-card flex items-center justify-center active:scale-[0.97] transition-transform duration-100"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        {/* Speed selector */}
        <div className="mb-4">
          <p className="text-xs text-text-muted mb-2">{t("quitPlan.speed")}</p>
          <div className="flex gap-2">
            {SPEED_OPTIONS.map((opt, i) => (
              <button
                key={opt.key}
                onClick={() => { setSpeedIdx(i); haptic("light"); }}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] transition-transform duration-100 ${
                  speedIdx === i
                    ? "bg-brand/20 text-brand border-2 border-brand"
                    : "bg-bg-surface text-text-secondary border border-transparent"
                }`}
              >
                {t(`quitPlan.${opt.key}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-brand/10 rounded-xl p-3.5 mb-6 text-center">
          <p className="text-sm text-brand font-medium">
            {t("quitPlan.preview", { weeks })}
          </p>
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full min-h-[56px] bg-[#1fc762] hover:bg-[#17a34a] text-[#0d1a12] font-semibold text-sm tracking-wide py-4 rounded-2xl shadow-[0_0_20px_rgba(31,199,98,0.3)] transition-all duration-150 active:scale-[0.97] active:bg-[#17a34a] disabled:opacity-50"
        >
          {saving ? t("common.saving") : t("quitPlan.startPlan")}
        </button>
      </div>
    </div>
  );
}
