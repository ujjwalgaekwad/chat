import { useConnectionStore } from "../stores/connection.store";
import { cn } from "../lib/utils";

export function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);

  if (status === "connected") return null;

  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-2 py-1 text-xs font-medium text-white",
        status === "connecting" ? "bg-amber-500" : "bg-red-500"
      )}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      {status === "connecting" ? "Reconnecting…" : "You're offline — messages will send once reconnected"}
    </div>
  );
}
