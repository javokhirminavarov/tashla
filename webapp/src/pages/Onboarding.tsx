import { useState } from "react";
import { useTranslation } from "react-i18next";
import { haptic } from "../lib/telegram";
import { HABIT_ICONS, HABIT_COLORS } from "../lib/types";
import type { HabitType, HabitProfile } from "../lib/types";
import { api } from "../lib/api";

interface OnboardingProps {
  onComplete: (profiles: HabitProfile[]) => void;
}

interface HabitConfig {
  habit_type: HabitType;
  daily_baseline: number;
  cost_per_unit: number;
}

const ALL_HABITS: HabitType[] = ["sigaret", "nos", "alkogol"];

function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            i <= current ? "w-8 bg-brand" : "w-2.5 bg-bg-surface"
          }`}
        />
      ))}
    </div>
  );
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<HabitType[]>([]);
  const [configs, setConfigs] = useState<HabitConfig[]>([]);
  const [configIdx, setConfigIdx] = useState(0);
  const [baseline, setBaseline] = useState(10);
  const [cost, setCost] = useState(1000);
  const [saving, setSaving] = useState(false);

  const toggleHabit = (ht: HabitType) => {
    haptic("light");
    setSelected((prev) =>
      prev.includes(ht) ? prev.filter((h) => h !== ht) : [...prev, ht]
    );
  };

  const nextFromSelect = () => {
    if (selected.length === 0) return;
    haptic("medium");
    setConfigs(
      selected.map((ht) => ({
        habit_type: ht,
        daily_baseline: 0,
        cost_per_unit: 0,
      }))
    );
    setConfigIdx(0);
    setBaseline(10);
    setCost(1000);
    setStep(2);
  };

  const adjustBaseline = (delta: number) => {
    haptic("light");
    setBaseline((prev) => Math.max(1, prev + delta));
  };

  const adjustCost = (delta: number) => {
    haptic("light");
    setCost((prev) => Math.max(0, prev + delta));
  };

  const nextConfig = () => {
    if (baseline <= 0) return;
    haptic("light");

    const updated = [...configs];
    updated[configIdx] = {
      ...updated[configIdx],
      daily_baseline: baseline,
      cost_per_unit: cost,
    };
    setConfigs(updated);

    if (configIdx < configs.length - 1) {
      setConfigIdx(configIdx + 1);
      setBaseline(10);
      setCost(1000);
    } else {
      setStep(3);
    }
  };

  const finish = async () => {
    setSaving(true);
    haptic("heavy");
    try {
      const profiles: HabitProfile[] = [];
      for (const cfg of configs) {
        const profile = await api.createProfile({
          habit_type: cfg.habit_type,
          daily_baseline: cfg.daily_baseline,
          daily_limit: cfg.daily_baseline,
          cost_per_unit: cfg.cost_per_unit,
        });
        profiles.push(profile);
      }
      onComplete(profiles);
    } catch (err) {
      console.error("Onboarding save failed:", err);
      setSaving(false);
    }
  };

  const yearlyCost = baseline * cost * 365;

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="min-h-screen bg-bg font-display flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-6 animate-bounce">🚫</div>
        <h1 className="text-4xl font-semibold text-text-primary tracking-tight mb-3">
          TASHLA
        </h1>
        <p className="text-text-secondary text-lg mb-10 max-w-xs leading-relaxed">
          {t("onboarding.subtitle")}
        </p>
        <button
          onClick={() => {
            haptic("medium");
            setStep(1);
          }}
          className="w-full max-w-xs min-h-[56px] bg-[#1fc762] hover:bg-[#17a34a] text-[#0d1a12] font-semibold text-lg py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(31,199,98,0.3)] flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] active:bg-[#17a34a]"
        >
          {t("onboarding.start")}
          <span className="material-symbols-outlined text-2xl">
            arrow_forward
          </span>
        </button>
      </div>
    );
  }

  // Step 1: Select habits
  if (step === 1) {
    return (
      <div className="min-h-screen bg-bg font-display flex flex-col">
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 pb-32">
          <ProgressDots total={3} current={0} />

          <div className="mb-8 text-center animate-fade-in-up">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-3">
              {t("onboarding.selectTitle")}
            </h1>
            <p className="text-text-secondary text-base leading-relaxed">
              {t("onboarding.selectSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            {ALL_HABITS.map((ht) => {
              const active = selected.includes(ht);
              return (
                <button
                  key={ht}
                  onClick={() => toggleHabit(ht)}
                  className="group relative w-full text-left transition-all duration-300 transform active:scale-[0.97]"
                >
                  {/* Background container */}
                  <div
                    className={`absolute inset-0 rounded-xl transition-all ${
                      active
                        ? "bg-brand/10 border-2 border-brand"
                        : "bg-bg-card border border-white/[0.06]"
                    }`}
                  >
                    {!active && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                        style={{ backgroundColor: HABIT_COLORS[ht] }}
                      />
                    )}
                  </div>
                  {/* Content */}
                  <div
                    className={`relative flex items-center px-4 py-3.5 gap-5 z-10 ${
                      active ? "" : "pl-7"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full text-3xl ${
                        active ? "bg-bg-card" : "bg-bg-surface"
                      }`}
                    >
                      {HABIT_ICONS[ht]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {t(`habits.${ht}`)}
                      </h3>
                      <p
                        className={`text-sm font-medium truncate ${
                          active ? "text-brand" : "text-text-secondary"
                        }`}
                      >
                        {t(`habits.${ht}_subtitle`)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {active ? (
                        <span className="material-symbols-outlined text-3xl text-brand material-symbols-filled">
                          check_circle
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-text-muted">
                          radio_button_unchecked
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-bg via-bg to-transparent pt-12 z-50">
          <div className="max-w-md mx-auto w-full">
            <button
              onClick={nextFromSelect}
              disabled={selected.length === 0}
              className={`w-full min-h-[56px] font-semibold text-lg py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] ${
                selected.length > 0
                  ? "bg-[#1fc762] text-[#0d1a12] shadow-[0_0_20px_rgba(31,199,98,0.3)]"
                  : "bg-bg-surface text-text-muted"
              }`}
            >
              {t("onboarding.continue")}
              <span className="material-symbols-outlined text-2xl">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Configure each habit
  if (step === 2) {
    const current = configs[configIdx];
    const ht = current.habit_type;
    return (
      <div className="min-h-screen bg-bg font-display flex flex-col">
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 pb-32">
          <ProgressDots total={3} current={1} />

          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: HABIT_COLORS[ht] + "20" }}
            >
              {HABIT_ICONS[ht]}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {t(`habits.${ht}`)}
              </h2>
              <p className="text-text-secondary text-sm">
                {configIdx + 1} / {configs.length}
              </p>
            </div>
          </div>

          <div className="space-y-3 flex-1 mt-6">
            {/* Baseline stepper */}
            <div className="bg-bg-card rounded-xl px-4 py-3.5">
              <label className="block text-sm text-text-secondary mb-4 font-medium">
                {t("onboarding.baselineLabel")}
              </label>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => adjustBaseline(-1)}
                  className="w-14 h-14 rounded-full bg-bg-surface text-text-primary text-2xl active:scale-[0.97] transition-transform duration-100 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span
                  className="text-5xl font-light tracking-tight w-24 text-center"
                  style={{ color: HABIT_COLORS[ht] }}
                >
                  {baseline}
                </span>
                <button
                  onClick={() => adjustBaseline(1)}
                  className="w-14 h-14 rounded-full bg-bg-surface text-text-primary text-2xl active:scale-[0.97] transition-transform duration-100 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <p className="text-xs text-text-muted text-center mt-2 uppercase tracking-wide font-medium">
                {t("common.piecesPerDay")}
              </p>
            </div>

            {/* Cost stepper */}
            <div className="bg-bg-card rounded-xl px-4 py-3.5">
              <label className="block text-sm text-text-secondary mb-4 font-medium">
                {t("onboarding.costLabel")}
              </label>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => adjustCost(-500)}
                  className="w-14 h-14 rounded-full bg-bg-surface text-text-primary text-xl active:scale-[0.97] transition-transform duration-100 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="text-3xl font-light tracking-tight w-32 text-center text-text-primary">
                  {cost.toLocaleString()}
                </span>
                <button
                  onClick={() => adjustCost(500)}
                  className="w-14 h-14 rounded-full bg-bg-surface text-text-primary text-xl active:scale-[0.97] transition-transform duration-100 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <p className="text-xs text-text-muted text-center mt-2 uppercase tracking-wide font-medium">{t("common.som")}</p>
            </div>

            {/* Yearly cost highlight */}
            {cost > 0 && (
              <div className="bg-danger/10 rounded-xl px-4 py-3.5 text-center border border-danger/20">
                <p className="text-sm text-text-secondary mb-1">
                  {t("onboarding.yearlyCost")}
                </p>
                <p className="text-2xl font-light tracking-tight text-danger">
                  {yearlyCost.toLocaleString()} {t("common.som")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-bg via-bg to-transparent pt-12 z-50">
          <div className="max-w-md mx-auto w-full">
            <button
              onClick={nextConfig}
              disabled={baseline <= 0}
              className="w-full min-h-[56px] font-semibold text-lg py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] text-[#F1F5F2] shadow-lg"
              style={{
                backgroundColor:
                  baseline > 0 ? HABIT_COLORS[ht] : undefined,
                boxShadow:
                  baseline > 0
                    ? `0 0 20px ${HABIT_COLORS[ht]}40`
                    : undefined,
              }}
            >
              {configIdx < configs.length - 1 ? t("onboarding.next") : t("onboarding.continue")}
              <span className="material-symbols-outlined text-2xl">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirm
  return (
    <div className="min-h-screen bg-bg font-display flex flex-col items-center justify-center p-6 text-center">
      <ProgressDots total={3} current={2} />

      <div className="text-7xl mb-6">💪</div>
      <h2 className="text-3xl font-semibold text-text-primary tracking-tight mb-3">
        {t("onboarding.ready")}
      </h2>
      <p className="text-text-secondary text-base mb-8 max-w-xs leading-relaxed">
        {t("onboarding.readyDescription", { count: configs.length })}
      </p>

      <div className="w-full max-w-xs space-y-2.5 mb-10">
        {configs.map((cfg) => (
          <div
            key={cfg.habit_type}
            className="flex items-center justify-between bg-bg-card rounded-xl p-3.5 shadow-card border border-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{
                  backgroundColor: HABIT_COLORS[cfg.habit_type] + "20",
                }}
              >
                {HABIT_ICONS[cfg.habit_type]}
              </div>
              <span className="text-text-primary font-semibold">
                {t(`habits.${cfg.habit_type}`)}
              </span>
            </div>
            <span className="text-text-secondary text-sm">
              {cfg.daily_baseline} {t("common.piecesPerDay")}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={finish}
        disabled={saving}
        className="w-full max-w-xs min-h-[56px] bg-[#1fc762] hover:bg-[#17a34a] text-[#0d1a12] font-semibold text-lg py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(31,199,98,0.3)] flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] active:bg-[#17a34a] disabled:opacity-50"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-[#F1F5F2]/30 border-t-[#F1F5F2] rounded-full animate-pulse-soft" />
            {t("common.saving")}
          </>
        ) : (
          <>
            {t("onboarding.startButton")}
            <span className="material-symbols-outlined text-2xl">
              rocket_launch
            </span>
          </>
        )}
      </button>
    </div>
  );
}
