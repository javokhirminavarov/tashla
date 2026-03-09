import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { haptic, tg } from "../lib/telegram";
import { HABIT_COLORS } from "../lib/types";
import type { User, HabitProfile, HabitType, QuitPlan } from "../lib/types";
import { api } from "../lib/api";
import QuitPlanSheet from "../components/QuitPlanSheet";

interface ProfileProps {
  user: User;
  profiles: HabitProfile[];
  refreshProfiles: () => Promise<void>;
}

const HABIT_MATERIAL_ICONS: Record<HabitType, string> = {
  sigaret: "smoking_rooms",
  nos: "science",
  alkogol: "local_bar",
};

export default function Profile({
  user,
  profiles,
  refreshProfiles,
}: ProfileProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<HabitType | null>(null);
  const [baseline, setBaseline] = useState("");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTime, setNotifTime] = useState("21:00");
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [quitPlans, setQuitPlans] = useState<QuitPlan[]>([]);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);

  useEffect(() => {
    api.getQuitPlans().then(setQuitPlans).catch(console.error);
  }, []);

  // Telegram BackButton integration
  useEffect(() => {
    const handleBack = () => navigate(-1);
    tg.BackButton.show();
    tg.BackButton.onClick(handleBack);
    return () => {
      tg.BackButton.hide();
      tg.BackButton.offClick(handleBack);
    };
  }, [navigate]);

  const startEdit = (profile: HabitProfile) => {
    haptic("light");
    setEditing(profile.habit_type);
    setBaseline(String(profile.daily_baseline));
    setCost(String(profile.cost_per_unit));
  };

  const saveEdit = async () => {
    if (!editing) return;
    const b = parseInt(baseline, 10);
    if (!b || b <= 0) return;

    setSaving(true);
    haptic("medium");
    try {
      await api.createProfile({
        habit_type: editing,
        daily_baseline: b,
        daily_limit: b,
        cost_per_unit: parseInt(cost, 10) || 0,
      });
      await refreshProfiles();
      setEditing(null);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ht: HabitType) => {
    haptic("heavy");
    try {
      await api.deleteProfile(ht);
      await refreshProfiles();
    } catch (err) {
      console.error("Failed to delete profile:", err);
    }
  };

  const switchLanguage = (lang: string) => {
    haptic("light");
    i18n.changeLanguage(lang);
    localStorage.setItem("tashla_language", lang);
    api.updateLanguage(lang).catch(console.error);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-bg/90 backdrop-blur-md">
        <div className="w-10" />
        <h1 className="text-lg font-semibold text-text-primary">{t("profile.title")}</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-5 py-4 space-y-6">
        {/* User info card */}
        <div className="bg-bg-card rounded-2xl p-5 shadow-card border border-white/[0.06] flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center text-brand">
            <span className="material-symbols-outlined text-[28px]">
              person
            </span>
          </div>
          <div>
            <p className="font-semibold text-text-primary text-lg">
              {user.first_name}
            </p>
            {user.username && (
              <p className="text-sm text-text-secondary">@{user.username}</p>
            )}
          </div>
        </div>

        {/* Language selector */}
        <div>
          <h2 className="font-semibold text-text-secondary text-sm mb-3 px-1">
            {t("profile.language")}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => switchLanguage("uz")}
              className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.97] transition-transform duration-100 ${
                i18n.language === "uz"
                  ? "bg-brand/20 text-brand border-2 border-brand"
                  : "bg-bg-card text-text-secondary border border-white/[0.06]"
              }`}
            >
              O'zbekcha
            </button>
            <button
              onClick={() => switchLanguage("ru")}
              className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.97] transition-transform duration-100 ${
                i18n.language === "ru"
                  ? "bg-brand/20 text-brand border-2 border-brand"
                  : "bg-bg-card text-text-secondary border border-white/[0.06]"
              }`}
            >
              Русский
            </button>
          </div>
        </div>

        {/* Notification settings */}
        <div>
          <h2 className="font-semibold text-text-secondary text-sm mb-3 px-1">
            {t("profile.notifications")}
          </h2>
          <div className="bg-bg-card rounded-2xl p-5 shadow-card border border-white/[0.06] space-y-4">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <span className="text-text-primary text-sm font-medium">
                {t("profile.notificationsEnabled")}
              </span>
              <button
                onClick={() => {
                  const next = !notifEnabled;
                  setNotifEnabled(next);
                  haptic("light");
                  api.updateNotifications({ notifications_enabled: next }).catch(console.error);
                }}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  notifEnabled ? "bg-brand" : "bg-bg-surface"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-[#F1F5F2] shadow transition-transform ${
                    notifEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {/* Time picker */}
            {notifEnabled && (
              <>
                <div>
                  <p className="text-xs text-text-secondary mb-2 font-medium">
                    {t("profile.notificationTime")}
                  </p>
                  <div className="flex gap-2">
                    {["09:00", "12:00", "18:00", "21:00"].map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          setNotifTime(time);
                          haptic("light");
                          api.updateNotifications({ notification_time: time }).catch(console.error);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.97] transition-transform duration-100 ${
                          notifTime === time
                            ? "bg-brand/20 text-brand border border-brand"
                            : "bg-bg-surface text-text-secondary border border-transparent"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Weekly summary toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-text-primary text-sm font-medium">
                    {t("profile.weeklySummary")}
                  </span>
                  <button
                    onClick={() => {
                      const next = !weeklySummary;
                      setWeeklySummary(next);
                      haptic("light");
                      api.updateNotifications({ weekly_summary: next }).catch(console.error);
                    }}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      weeklySummary ? "bg-brand" : "bg-bg-surface"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-[#F1F5F2] shadow transition-transform ${
                        weeklySummary ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quit Plan section */}
        <div>
          <h2 className="font-semibold text-text-secondary text-sm mb-3 px-1">
            {t("profile.quitPlan")}
          </h2>
          {quitPlans.length > 0 ? (
            <div className="space-y-3">
              {quitPlans.map((plan) => {
                const activeStep = plan.steps.find((s) => s.status === "active");
                return (
                  <div key={plan.id} className="bg-bg-card rounded-2xl p-4 shadow-card border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-text-primary">
                        {t(`habits.${plan.habit_type}`)}
                      </span>
                      <span className="text-xs text-brand font-bold">
                        {t("quitPlan.step")} {plan.current_step}/{plan.steps.length}
                      </span>
                    </div>
                    {activeStep && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{ width: `${(plan.current_step / plan.steps.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted">
                          {activeStep.daily_limit} {t("common.piecesPerDay")}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        haptic("heavy");
                        await api.deleteQuitPlan(plan.habit_type);
                        setQuitPlans((prev) => prev.filter((p) => p.id !== plan.id));
                      }}
                      className="text-xs text-danger font-medium active:scale-[0.97] transition-transform duration-100"
                    >
                      {t("quitPlan.stopPlan")}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => { setPlanSheetOpen(true); haptic("light"); }}
              className="w-full bg-bg-card rounded-2xl p-4 shadow-card border border-white/[0.06] text-center text-brand font-semibold text-sm active:scale-[0.97] transition-transform duration-100"
            >
              + {t("quitPlan.startPlan")}
            </button>
          )}
        </div>

        {/* Habits section */}
        <div>
          <h2 className="font-semibold text-text-secondary text-sm mb-3 px-1">
            {t("profile.activeHabits")}
          </h2>
          <div className="space-y-3">
            {profiles.map((p) => {
              const ht = p.habit_type;
              const color = HABIT_COLORS[ht];
              const isEditing = editing === ht;

              if (isEditing) {
                return (
                  <div
                    key={ht}
                    className="bg-bg-card rounded-2xl p-5 space-y-4 shadow-card border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: color + "20",
                          color: color,
                        }}
                      >
                        <span className="material-symbols-outlined">
                          {HABIT_MATERIAL_ICONS[ht]}
                        </span>
                      </div>
                      <span className="font-semibold text-text-primary">
                        {t(`habits.${ht}`)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1.5 font-medium">
                        {t("profile.dailyAmount")}
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={baseline}
                        onChange={(e) => setBaseline(e.target.value)}
                        className="w-full h-11 bg-bg-surface border border-white/10 rounded-xl px-4 text-text-primary focus:outline-none focus:border-[#1fc762]/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1.5 font-medium">
                        {t("profile.unitCost")}
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full h-11 bg-bg-surface border border-white/10 rounded-xl px-4 text-text-primary focus:outline-none focus:border-[#1fc762]/40 transition-colors"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex-1 h-11 bg-brand text-[#0d1a12] rounded-full font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.97]"
                      >
                        {saving ? "..." : t("common.save")}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="h-11 px-5 bg-bg-surface rounded-full text-sm text-text-secondary font-medium active:scale-[0.97] transition-transform duration-100"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={ht}
                  className="bg-bg-card rounded-2xl p-4 shadow-card border border-white/[0.06] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: color + "20",
                        color: color,
                      }}
                    >
                      <span className="material-symbols-outlined">
                        {HABIT_MATERIAL_ICONS[ht]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">
                        {t(`habits.${ht}`)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {p.daily_baseline} {t("common.piecesPerDay")}
                        {p.cost_per_unit > 0 &&
                          ` · ${p.cost_per_unit.toLocaleString()} ${t("common.som")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors active:scale-[0.97] transition-transform duration-100"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(ht)}
                      className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger hover:bg-danger/20 transition-colors active:scale-[0.97] transition-transform duration-100"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* App version */}
        <div className="text-center text-xs text-text-muted pt-4 pb-2">
          TASHLA v1.0.0
        </div>
      </main>

      <QuitPlanSheet
        open={planSheetOpen}
        onClose={() => setPlanSheetOpen(false)}
        profiles={profiles}
        onCreated={(plan) => setQuitPlans((prev) => [...prev, plan])}
      />
    </div>
  );
}
