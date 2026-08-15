import type { ConversationDTO } from "@chat-platform/shared";
import { Avatar } from "./Avatar";
import { usePresenceStore } from "../stores/presence.store";
import { useAuthStore } from "../stores/auth.store";
import { cn, formatRelativeTime } from "../lib/utils";

interface Props {
  conversation: ConversationDTO;
  active: boolean;
  onClick: () => void;
}

export function conversationDisplayName(conversation: ConversationDTO, currentUserId?: string): string {
  if (conversation.type === "GROUP") return conversation.name ?? "Unnamed group";
  const other = conversation.members.find((m) => m.userId !== currentUserId);
  return other?.user?.name ?? "Direct message";
}

export function ConversationListItem({ conversation, active, onClick }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const presenceByUserId = usePresenceStore((s) => s.byUserId);

  const name = conversationDisplayName(conversation, currentUserId);
  const other = conversation.members.find((m) => m.userId !== currentUserId);
  const presence = other ? presenceByUserId[other.userId] : undefined;
  const isOnline = conversation.type === "DIRECT" && (presence?.isOnline ?? other?.user?.isOnline ?? false);

  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.type === "IMAGE" || conversation.lastMessage.type === "VIDEO"
      ? "Sent an attachment"
      : conversation.lastMessage.text ?? "Sent an attachment"
    : "No messages yet";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
        active ? "bg-pine-500/10" : "hover:bg-ink-100 dark:hover:bg-ink-800/60"
      )}
    >
      <Avatar
        name={name}
        src={conversation.type === "GROUP" ? conversation.avatar : other?.user?.avatar}
        presence={conversation.type === "DIRECT" ? (isOnline ? "online" : "offline") : "none"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm", conversation.unreadCount > 0 ? "font-semibold text-ink-900 dark:text-ink-50" : "font-medium text-ink-700 dark:text-ink-300")}>
            {name}
          </span>
          {conversation.lastMessageAt && (
            <span className="shrink-0 text-[11px] text-ink-400">{formatRelativeTime(conversation.lastMessageAt)}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-ink-500 dark:text-ink-400">{lastMessagePreview}</span>
          {conversation.unreadCount > 0 && (
            <span className="flex h-4.5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold text-ink-900">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
