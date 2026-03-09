import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import App from "./App";
import "./index.css";

// Debug helper — visible on screen since Telegram WebView has no console
function debugLog(msg: string) {
  const el = document.getElementById("debug-log");
  if (el) {
    el.textContent += msg + "\n";
    el.style.display = "block";
  }
  console.log("[TASHLA]", msg);
}

try {
  debugLog("main.tsx: modules imported OK");

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    debugLog("ERROR: #root element not found!");
  } else {
    debugLog("main.tsx: mounting React...");
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    debugLog("main.tsx: React.render() called");
  }
} catch (err) {
  const msg = err instanceof Error ? err.message + "\n" + err.stack : String(err);
  debugLog("FATAL: " + msg);
  // Also show on screen in case debug-log element doesn't exist
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML =
      '<div style="padding:20px;color:#EF4444;font-family:monospace;font-size:12px;background:#0d1a12;min-height:100vh;white-space:pre-wrap;">' +
      "FATAL ERROR:\n" + msg + "</div>";
  }
}
