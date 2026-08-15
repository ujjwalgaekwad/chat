import { X } from "lucide-react";
import { useToastStore } from "../stores/toast.store";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex items-start gap-3 rounded-lg border border-ink-200 bg-white p-3 shadow-panel dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded p-0.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
