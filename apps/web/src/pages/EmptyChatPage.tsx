import { MessageSquare } from "lucide-react";

export function EmptyChatPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-500/10 text-pine-500">
        <MessageSquare size={26} />
      </span>
      <div>
        <p className="font-display text-lg text-ink-900 dark:text-ink-50">Pick up a conversation</p>
        <p className="mt-1 max-w-xs text-sm text-ink-500 dark:text-ink-400">
          Choose someone from the sidebar, or start a new chat to get going.
        </p>
      </div>
    </div>
  );
}
