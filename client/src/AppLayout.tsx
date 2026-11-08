import { Outlet } from "react-router-dom";
import Sidebar from "./desktop/Sidebar";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#F7FAFC]">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
