import { useState } from "react";
import { useTranslation } from "react-i18next";
import { haptic } from "../lib/telegram";
import { api } from "../lib/api";

interface JoinGroupSheetProps {
  open: boolean;
  onClose: () => void;
  onJoined: (groupId: number) => void;
}

export default function JoinGroupSheet({
  open,
  onClose,
  onJoined,
}: JoinGroupSheetProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleJoin = async () => {
    if (!code.trim()) return;
    setSaving(true);
    setError("");
    haptic("medium");
    try {
      const result = await api.joinGroup(code.trim());
      haptic("heavy");
      onJoined(result.group_id);
      setCode("");
      onClose();
    } catch (err) {
      setError(t("community.invalidCode"));
      haptic("light");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-bg-card rounded-t-2xl px-5 pt-4 pb-8 animate-slide-up border-t border-white/[0.08]">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-white/[0.06]" />
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("community.joinByCode")}
        </h3>

        <div className="mb-4">
          <label className="block text-xs text-text-secondary mb-1.5 font-medium">
            {t("community.enterCode")}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AB12CD34EF"
            className="w-full h-11 bg-bg-surface border border-white/10 rounded-lg px-4 text-text-primary text-center font-mono tracking-widest focus:outline-none focus:border-[#1fc762]/40 transition-colors"
            maxLength={10}
          />
          {error && (
            <p className="text-xs text-danger mt-1.5">{error}</p>
          )}
        </div>

        <button
          onClick={handleJoin}
          disabled={saving || !code.trim()}
          className="w-full min-h-[56px] bg-[#1fc762] text-[#0d1a12] font-semibold text-sm tracking-wide py-4 rounded-xl shadow-[0_0_20px_rgba(31,199,98,0.3)] transition-all duration-150 active:scale-[0.97] active:bg-[#17a34a] disabled:opacity-50"
        >
          {saving ? t("common.saving") : t("community.joinGroup")}
        </button>
      </div>
    </div>
  );
}
