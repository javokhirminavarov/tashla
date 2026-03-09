import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { tg } from "./lib/telegram";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { t } = useTranslation();
  const { user, profiles, loading, error } = useAuth();

  useEffect(() => {
    tg.ready();
    tg.expand();
    if (tg.isVersionAtLeast("6.1")) {
      tg.setHeaderColor("#1a2c22");
      tg.setBackgroundColor("#122017");
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#122017",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#5C716A", fontSize: "14px" }}>
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#122017",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "48px", marginBottom: "12px" }}>⚠️</p>
          <p style={{ color: "#EF4444", fontWeight: 600, marginBottom: "8px" }}>
            {t("common.error")}
          </p>
          <p style={{ color: "#94A3A1", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#1fc762",
              color: "#0d1a12",
              border: "none",
              borderRadius: "9999px",
              padding: "10px 24px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  // DEBUG: temporary screen to diagnose blank screen issue
  const debugInfo = {
    hasUser: !!user,
    userId: user?.id,
    userName: user?.first_name,
    profileCount: profiles?.length ?? "null",
    profileTypes: profiles?.map((p) => p.habit_type).join(", ") || "none",
    apiUrl: import.meta.env.VITE_API_URL || "NOT SET",
    initData: tg.initData ? tg.initData.substring(0, 30) + "..." : "empty",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#122017",
        color: "#F1F5F2",
        padding: "40px 20px",
        fontFamily: "monospace",
        fontSize: "13px",
      }}
    >
      <h1 style={{ color: "#1fc762", fontSize: "20px", marginBottom: "16px" }}>
        TASHLA Debug
      </h1>
      <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <p style={{ color: "#94A3A1", marginTop: "16px", fontSize: "12px" }}>
        If you see this, auth succeeded and React works fine.
      </p>
    </div>
  );
}
