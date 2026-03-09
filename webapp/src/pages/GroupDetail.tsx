import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { haptic, tg } from "../lib/telegram";
import { api } from "../lib/api";
import { HABIT_ICONS } from "../lib/types";
import { getZoneColor } from "../lib/colors";
import type { GroupDetail as GroupDetailType } from "../lib/types";

export default function GroupDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleBack = () => navigate("/community");
    tg.BackButton.show();
    tg.BackButton.onClick(handleBack);
    return () => {
      tg.BackButton.hide();
      tg.BackButton.offClick(handleBack);
    };
  }, [navigate]);

  useEffect(() => {
    if (!id) return;
    api.getGroup(parseInt(id, 10))
      .then(setGroup)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code).catch(() => {});
    setCopied(true);
    haptic("light");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    if (!group) return;
    haptic("heavy");
    api.leaveGroup(group.id).then(() => navigate("/community")).catch(console.error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg px-5 pt-16">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-white/5 rounded-2xl" />
          <div className="h-6 bg-white/5 rounded-lg w-1/3" />
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-muted">{t("health.noData")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-bg/90 backdrop-blur-md">
        <div className="w-10" />
        <h1 className="text-lg font-semibold text-text-primary truncate max-w-[200px]">
          {group.name}
        </h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-5 py-4 space-y-4">
        {/* Invite code card */}
        <div className="bg-bg-card rounded-2xl p-4 shadow-card border border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted mb-0.5">{t("community.inviteCode")}</p>
            <p className="text-lg font-semibold text-brand tracking-widest">{group.invite_code}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="h-10 px-4 bg-brand/20 text-brand rounded-full text-sm font-semibold transition-all active:scale-[0.97] transition-transform duration-100"
          >
            {copied ? t("community.copied") : t("community.copyCode")}
          </button>
        </div>

        {/* Members list */}
        <h2 className="font-semibold text-text-secondary text-sm px-1">
          {group.members.length} {t("community.members")}
        </h2>

        <div className="space-y-3">
          {group.members.map((member) => {
            const habits = Object.keys(member.limits);
            return (
              <div
                key={member.user_id}
                className="bg-bg-card rounded-2xl p-4 shadow-card border border-white/[0.06]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <span className="font-semibold text-text-primary text-sm">
                      {member.first_name}
                      {member.is_self && (
                        <span className="text-xs text-text-muted ml-1">(you)</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {habits.map((ht) => {
                    const count = member.today[ht] ?? 0;
                    const limit = member.limits[ht];
                    const countColor = getZoneColor(count, limit);

                    return (
                      <div
                        key={ht}
                        className="flex items-center gap-1.5 bg-bg-surface rounded-xl px-3 py-2"
                      >
                        <span className="text-sm">{HABIT_ICONS[ht as keyof typeof HABIT_ICONS]}</span>
                        <span className="text-sm font-bold" style={{ color: countColor }}>
                          {count}
                        </span>
                        <span className="text-xs text-text-muted">/ {limit}</span>
                      </div>
                    );
                  })}
                  {!!member.hide_alkogol && !member.is_self && !member.today["alkogol"] && member.limits["alkogol"] === undefined && (
                    <div className="flex items-center gap-1 bg-bg-surface rounded-xl px-3 py-2">
                      <span className="text-sm">🍺</span>
                      <span className="text-xs text-text-muted">{t("community.hidden")}</span>
                    </div>
                  )}
                </div>

                {/* Privacy toggle for self */}
                {member.is_self && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      {member.hide_alkogol ? t("community.showAlkogol") : t("community.hideAlkogol")}
                    </span>
                    <button
                      onClick={() => {
                        haptic("light");
                        const newHide = !member.hide_alkogol;
                        api.toggleAlkogolPrivacy(group.id, newHide).catch(console.error);
                        setGroup((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            members: prev.members.map((m) =>
                              m.is_self ? { ...m, hide_alkogol: newHide ? 1 : 0 } : m
                            ),
                          };
                        });
                      }}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        member.hide_alkogol ? "bg-brand" : "bg-bg-surface"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#F1F5F2] shadow transition-transform ${
                          member.hide_alkogol ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leave button */}
        <button
          onClick={handleLeave}
          className="w-full mt-4 py-3 rounded-2xl bg-danger/10 text-danger font-semibold text-sm transition-all active:scale-[0.97] transition-transform duration-100"
        >
          {t("community.leaveGroup")}
        </button>
      </main>
    </div>
  );
}
