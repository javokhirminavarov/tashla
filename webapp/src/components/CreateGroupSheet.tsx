import { useState } from "react";
import { useTranslation } from "react-i18next";
import { haptic } from "../lib/telegram";
import { api } from "../lib/api";
import type { Group } from "../lib/types";

interface CreateGroupSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (group: Group) => void;
}

export default function CreateGroupSheet({
  open,
  onClose,
  onCreated,
}: CreateGroupSheetProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    haptic("medium");
    try {
      const group = await api.createGroup(name.trim());
      setCreated(group);
      onCreated(group);
    } catch (err) {
      console.error("Create group failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.invite_code).catch(() => {});
    setCopied(true);
    haptic("light");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName("");
    setCreated(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-bg-card rounded-t-2xl px-5 pt-4 pb-8 animate-slide-up border-t border-white/[0.08]">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-white/[0.06]" />
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("community.createGroup")}
        </h3>

        {!created ? (
          <>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary mb-1.5 font-medium">
                {t("community.groupName")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="..."
                className="w-full h-11 bg-bg-surface border border-white/10 rounded-lg px-4 text-text-primary focus:outline-none focus:border-[#1fc762]/40 transition-colors"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="w-full min-h-[56px] bg-[#1fc762] text-[#0d1a12] font-semibold text-sm tracking-wide py-4 rounded-xl shadow-[0_0_20px_rgba(31,199,98,0.3)] transition-all duration-150 active:scale-[0.97] active:bg-[#17a34a] disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("community.create")}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-2">{t("community.inviteCode")}</p>
            <p className="text-3xl font-light tracking-widest text-brand mb-4">{created.invite_code}</p>
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 h-11 bg-brand/20 text-brand rounded-full font-semibold text-sm transition-all active:scale-[0.97]"
              >
                {copied ? t("community.copied") : t("community.copyCode")}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 h-11 bg-bg-surface rounded-full text-text-secondary font-medium text-sm active:scale-[0.97] transition-transform duration-100"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
