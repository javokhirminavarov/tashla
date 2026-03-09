import { useEffect, useCallback, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tg } from "./lib/telegram";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";
import Health from "./pages/Health";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import GroupDetail from "./pages/GroupDetail";
import type { HabitProfile } from "./lib/types";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 20,
          color: "#EF4444",
          fontFamily: "sans-serif",
          background: "#122017",
          minHeight: "100vh",
        }}>
          <h3 style={{ color: "#F1F5F2", marginBottom: 8 }}>TASHLA Error</h3>
          <p>{this.state.error?.message || "Unknown error"}</p>
          <p style={{ fontSize: 12, color: "#5C716A", marginTop: 8 }}>
            {this.state.error?.stack?.split("\n").slice(0, 3).join("\n")}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: "12px 24px",
              background: "#1fc762",
              color: "#0d1a12",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Qayta urinish
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { t } = useTranslation();
  const { user, profiles, loading, error, refreshProfiles, setProfiles } = useAuth();

  useEffect(() => {
    tg.ready();
    tg.expand();
    if (tg.isVersionAtLeast("6.1")) {
      tg.setHeaderColor("#1a2c22");
      tg.setBackgroundColor("#122017");
    }
  }, []);

  const handleOnboardingComplete = useCallback(
    (newProfiles: HabitProfile[]) => {
      setProfiles(newProfiles);
    },
    [setProfiles]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#122017] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-64">
          <div className="h-4 bg-white/5 rounded-lg w-3/4 mx-auto" />
          <div className="h-10 bg-white/5 rounded-xl w-1/2 mx-auto" />
          <div className="h-3 bg-white/5 rounded-lg w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#122017] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mb-4 bg-white/5 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px] text-[#EF4444]">
              error
            </span>
          </div>
          <p className="text-[#EF4444] font-semibold text-base mb-2">
            {t("common.error")}
          </p>
          <p className="text-[#94A3A1] text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="min-h-[48px] px-6 rounded-2xl bg-[#1fc762] text-[#0d1a12] font-semibold text-sm tracking-wide active:scale-[0.97] active:bg-[#17a34a] transition-all duration-150"
          >
            {t("common.retry", "Qayta urinish")}
          </button>
        </div>
      </div>
    );
  }

  const needsOnboarding = !profiles || profiles.length === 0;

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          {needsOnboarding ? (
            <Route
              path="*"
              element={<Onboarding onComplete={handleOnboardingComplete} />}
            />
          ) : (
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard profiles={profiles} />} />
              <Route path="/stats" element={<Stats profiles={profiles} />} />
              <Route path="/health" element={<Health profiles={profiles} />} />
              <Route path="/community" element={<Community />} />
              <Route path="/group/:id" element={<GroupDetail />} />
              <Route
                path="/profile"
                element={
                  <Profile
                    user={user!}
                    profiles={profiles}
                    refreshProfiles={refreshProfiles}
                  />
                }
              />
            </Route>
          )}
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
