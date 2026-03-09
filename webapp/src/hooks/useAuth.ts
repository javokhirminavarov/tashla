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
    api
      .auth()
      .then((data) => {
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
          // Auto-detect from Telegram if user hasn't explicitly set a language
          const tgLang = tg.initDataUnsafe.user?.language_code;
          if (tgLang === "ru" && i18n.language !== "ru") {
            i18n.changeLanguage("ru");
            localStorage.setItem("tashla_language", "ru");
            api.updateLanguage("ru").catch(console.error);
          }
        }
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: err.message,
        }));
      });
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
