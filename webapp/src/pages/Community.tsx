import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { haptic } from "../lib/telegram";
import { api } from "../lib/api";
import type { Group } from "../lib/types";
import CreateGroupSheet from "../components/CreateGroupSheet";
import JoinGroupSheet from "../components/JoinGroupSheet";

export default function Community() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const fetchGroups = () => {
    api.getGroups()
      .then(setGroups)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-bg/90 backdrop-blur-md">
        <div className="w-10" />
        <h1 className="text-lg font-semibold text-text-primary">{t("community.title")}</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-5 py-4">
        {/* Action buttons */}
        <div className="flex gap-2.5 mb-3">
          <button
            onClick={() => { setCreateOpen(true); haptic("light"); }}
            className="flex-1 bg-[#1fc762] text-[#0d1a12] font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.97] shadow-glow"
          >
            {t("community.createGroup")}
          </button>
          <button
            onClick={() => { setJoinOpen(true); haptic("light"); }}
            className="flex-1 bg-bg-card text-text-primary font-semibold py-3 rounded-xl text-sm border border-white/[0.06] transition-all active:scale-[0.97]"
          >
            {t("community.joinByCode")}
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-white/5 rounded-xl" />
            <div className="h-20 bg-white/5 rounded-xl" />
            <div className="h-20 bg-white/5 rounded-xl" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full mb-4 bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] text-[#5C716A]">
                group
              </span>
            </div>
            <p className="text-sm text-[#94A3A1] mb-1">
              {t("community.emptyState")}
            </p>
            <p className="text-xs text-[#5C716A]">
              {t("community.emptyStateHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => { navigate(`/group/${group.id}`); haptic("light"); }}
                className="w-full bg-bg-card rounded-xl p-3.5 shadow-card border border-white/[0.06] flex items-center justify-between text-left transition-transform duration-100 active:scale-[0.97]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                    <span className="material-symbols-outlined text-[24px]">group</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{group.name}</p>
                    <p className="text-xs text-text-muted">
                      {group.member_count} {t("community.members")}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-muted">
                  chevron_right
                </span>
              </button>
            ))}

            {groups.length < 3 && (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="material-symbols-outlined text-[28px] text-[#5C716A] mb-2">
                  diversity_3
                </span>
                <p className="text-sm text-[#94A3A1]">{t("community.motivation")}</p>
              </div>
            )}
          </div>
        )}
      </main>

      <CreateGroupSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => setGroups((prev) => [group, ...prev])}
      />

      <JoinGroupSheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoined={() => fetchGroups()}
      />
    </div>
  );
}
