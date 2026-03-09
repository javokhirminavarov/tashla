import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg font-display">
      <div className="pb-28">
        <Outlet />
      </div>
      <Navigation />
    </div>
  );
}
