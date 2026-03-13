if (window._dbg) window._dbg('main.tsx executing');

import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import App from "./App";
import "./index.css";

if (window._dbg) window._dbg('imports done');

const rootEl = document.getElementById("root");
if (rootEl) {
  if (window._dbg) window._dbg('mounting React...');
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    if (window._dbg) window._dbg('React.render() called');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (window._dbg) window._dbg('MOUNT ERROR: ' + msg);
  }
} else {
  if (window._dbg) window._dbg('ERROR: #root not found');
}
