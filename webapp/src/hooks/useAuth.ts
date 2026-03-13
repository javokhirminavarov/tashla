import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { tg } from "../lib/telegram";
import type { User, HabitProfile } from "../lib/types";

interface AuthState {
  user: User | null;
  profiles: HabitProfile[];
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const { i18n } = useTranslation();
  const [state, setState] = useState<AuthState>({
    user: null,
    profiles: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function init() {
      try {
        if (window._dbg) window._dbg('auth: starting ping...');
        // Pre-check: can we reach the API at all?
        const reachable = await api.ping();
        if (window._dbg) window._dbg('auth: ping result=' + reachable);
        if (!reachable) {
          setState((s) => ({
            ...s,
            loading: false,
            error: "Serverga ulanib bo'lmadi (API unreachable)",
          }));
          return;
        }

        if (window._dbg) window._dbg('auth: calling api.auth()...');
        const data = await api.auth();
        if (window._dbg) window._dbg('auth: success, user=' + (data.user?.first_name || 'null'));
        setState({
          user: data.user,
          profiles: data.profiles,
          loading: false,
          error: null,
        });

        // Set language: prefer saved user language, else detect from Telegram
        const userLang = data.user.language;
        if (userLang && userLang !== i18n.language) {
          i18n.changeLanguage(userLang);
          localStorage.setItem("tashla_language", userLang);
        } else if (!userLang || userLang === "uz") {
          const tgLang = tg.initDataUnsafe.user?.language_code;
          if (tgLang === "ru" && i18n.language !== "ru") {
            i18n.changeLanguage("ru");
            localStorage.setItem("tashla_language", "ru");
            api.updateLanguage("ru").catch(console.error);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Noma'lum xatolik (unknown error)";
        setState((s) => ({
          ...s,
          loading: false,
          error: message,
        }));
      }
    }
    init();
  }, []);

  const refreshProfiles = useCallback(async () => {
    try {
      const profiles = await api.getProfiles();
      setState((s) => ({ ...s, profiles }));
    } catch (err) {
      console.error("Failed to refresh profiles:", err);
    }
  }, []);

  const setProfiles = useCallback((profiles: HabitProfile[]) => {
    setState((s) => ({ ...s, profiles }));
  }, []);

  return { ...state, refreshProfiles, setProfiles };
}
