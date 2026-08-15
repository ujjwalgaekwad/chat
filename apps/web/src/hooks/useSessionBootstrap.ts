import { useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

export function useSessionBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const res = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
        if (!cancelled) {
          setSession(res.data.data.user, res.data.data.accessToken);
        }
      } catch {
        if (!cancelled) clearSession();
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);
}
