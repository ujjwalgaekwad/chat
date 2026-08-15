import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { Loader2 } from "lucide-react";

export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  if (isHydrating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-pine-500" size={24} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function RedirectIfAuthed() {
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  if (isHydrating) return null;
  if (user) return <Navigate to="/app" replace />;

  return <Outlet />;
}
