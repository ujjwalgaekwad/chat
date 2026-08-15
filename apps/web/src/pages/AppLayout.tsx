import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ToastContainer } from "../components/ToastContainer";
import { useUiStore } from "../stores/ui.store";
import { useSocketSync } from "../hooks/useSocketSync";
import { cn } from "../lib/utils";

export function AppLayout() {
  useSocketSync();

  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ConnectionBanner />
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-72 shrink-0 border-r border-ink-200 dark:border-ink-800 md:block">
          <Sidebar />
        </div>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-ink-950/40" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative h-full w-72 bg-white shadow-panel dark:bg-ink-900">
              <Sidebar />
            </div>
          </div>
        )}
        <main className={cn("min-w-0 flex-1")}>
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
