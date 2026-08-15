import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
}

export function Dialog({ title, onClose, children, widthClassName = "max-w-md" }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${widthClassName} rounded-2xl border border-ink-200 bg-white shadow-panel dark:border-ink-800 dark:bg-ink-900`}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4 dark:border-ink-800">
          <h2 className="font-display text-lg text-ink-900 dark:text-ink-50">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="rounded p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
