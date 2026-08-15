import { Info, Menu, Phone } from "lucide-react";
import type { ConversationDTO } from "@chat-platform/shared";
import { Avatar } from "./Avatar";
import { conversationDisplayName } from "./ConversationListItem";
import { useAuthStore } from "../stores/auth.store";
import { usePresenceStore } from "../stores/presence.store";
import { useUiStore } from "../stores/ui.store";
import { formatRelativeTime } from "../lib/utils";

export function ChatHeader({ conversation }: { conversation: ConversationDTO }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const presenceByUserId = usePresenceStore((s) => s.byUserId);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const detailsPanelOpen = useUiStore((s) => s.detailsPanelOpen);
  const setDetailsPanelOpen = useUiStore((s) => s.setDetailsPanelOpen);

  const name = conversationDisplayName(conversation, currentUserId);
  const other = conversation.members.find((m) => m.userId !== currentUserId);
  const presence = other ? presenceByUserId[other.userId] : undefined;

  let subtitle: string;
  if (conversation.type === "GROUP") {
    subtitle = `${conversation.members.length} members`;
  } else {
    const isOnline = presence?.isOnline ?? other?.user?.isOnline ?? false;
    const lastSeenAt = presence?.lastSeenAt ?? other?.user?.lastSeenAt ?? null;
    subtitle = isOnline ? "Online" : lastSeenAt ? `Last seen ${formatRelativeTime(lastSeenAt)}` : "Offline";
  }

  return (
    <div className="flex items-center gap-3 border-b border-ink-200 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900">
      <button
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open conversation list"
        className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 md:hidden"
      >
        <Menu size={18} />
      </button>

      <Avatar
        name={name}
        src={conversation.type === "GROUP" ? conversation.avatar : other?.user?.avatar}
        presence={conversation.type === "DIRECT" ? (subtitle === "Online" ? "online" : "offline") : "none"}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{name}</p>
        <p className="truncate text-xs text-ink-500 dark:text-ink-400">{subtitle}</p>
      </div>

      <button aria-label="Call (UI only)" className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800">
        <Phone size={17} />
      </button>
      <button
        onClick={() => setDetailsPanelOpen(!detailsPanelOpen)}
        aria-label="Conversation details"
        aria-pressed={detailsPanelOpen}
        className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
      >
        <Info size={17} />
      </button>
    </div>
  );
}
