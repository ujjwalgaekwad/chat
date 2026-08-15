import { useState } from "react";
import { Check, CheckCheck, Clock, AlertCircle, MoreHorizontal, Reply, SmilePlus, Pencil, Trash2, Download } from "lucide-react";
import type { LocalMessage } from "../types/local";
import { Avatar } from "./Avatar";
import { cn, formatClockTime } from "../lib/utils";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "👀"];

interface Props {
  message: LocalMessage;
  isMine: boolean;
  senderName: string;
  senderAvatar?: string | null;
  showSenderInfo: boolean;
  currentUserId: string;
  replyToMessage?: LocalMessage;
  onReply: (message: LocalMessage) => void;
  onEdit: (messageId: string, text: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string, alreadyReacted: boolean) => void;
  onRetry: (message: LocalMessage) => void;
  onJumpToReply: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isMine,
  senderName,
  senderAvatar,
  showSenderInfo,
  currentUserId,
  replyToMessage,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRetry,
  onJumpToReply,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.text ?? "");
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  if (message.deletedAt) {
    return (
      <div className={cn("group flex gap-2.5 px-4 py-1", isMine && "flex-row-reverse")}>
        <div className="w-8" />
        <p className="italic text-sm text-ink-400">This message was deleted</p>
      </div>
    );
  }

  const submitEdit = () => {
    if (draft.trim() && draft.trim() !== message.text) {
      onEdit(message.id, draft.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className={cn("group relative flex gap-2.5 px-4 py-1 hover:bg-ink-50/70 dark:hover:bg-ink-800/40", isMine && "flex-row-reverse")}>
      <div className="w-8 shrink-0">
        {showSenderInfo && !isMine && <Avatar name={senderName} src={senderAvatar} size="sm" />}
      </div>

      <div className={cn("max-w-[70%] min-w-0", isMine && "items-end")}>
        {showSenderInfo && !isMine && (
          <p className="mb-0.5 text-xs font-medium text-ink-500 dark:text-ink-400">{senderName}</p>
        )}

        {replyToMessage && (
          <button
            onClick={() => onJumpToReply(replyToMessage.id)}
            className={cn(
              "mb-1 block max-w-full truncate rounded-md border-l-2 border-pine-400 bg-ink-100/80 px-2 py-1 text-left text-xs text-ink-500 dark:bg-ink-800/80 dark:text-ink-400",
            )}
          >
            {replyToMessage.text ?? "Attachment"}
          </button>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              autoFocus
              className="input text-sm"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitEdit();
                }
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <div className="flex gap-2">
              <button onClick={submitEdit} className="btn-primary px-2 py-1 text-xs">
                Save
              </button>
              <button onClick={() => setIsEditing(false)} className="btn-secondary px-2 py-1 text-xs">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-3 py-2 text-sm leading-relaxed",
              isMine
                ? "bg-pine-500 text-white rounded-tr-sm"
                : "bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-ink-100 rounded-tl-sm"
            )}
          >
            {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

            {message.attachments.map((att) => (
              <AttachmentPreview key={att.url} attachment={att} isMine={isMine} />
            ))}
          </div>
        )}

        <div className={cn("mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400", isMine && "flex-row-reverse")}>
          <span>{formatClockTime(message.createdAt)}</span>
          {message.editedAt && <span>(edited)</span>}
          {isMine && <DeliveryIndicator message={message} onRetry={() => onRetry(message)} />}
        </div>

        {message.reactions.length > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", isMine && "justify-end")}>
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(message.id, r.emoji, r.reactedByMe)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
                  r.reactedByMe
                    ? "border-pine-400 bg-pine-500/10 text-pine-700 dark:text-pine-300"
                    : "border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
                )}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          "absolute top-0 z-10 hidden items-center gap-0.5 rounded-lg border border-ink-200 bg-white p-0.5 shadow-panel group-hover:flex dark:border-ink-700 dark:bg-ink-900",
          isMine ? "right-10" : "left-10"
        )}
      >
        <div className="relative">
          <IconButton label="React" onClick={() => setShowReactionPicker((v) => !v)}>
            <SmilePlus size={14} />
          </IconButton>
          {showReactionPicker && (
            <div className="absolute top-full z-20 mt-1 flex gap-1 rounded-lg border border-ink-200 bg-white p-1 shadow-panel dark:border-ink-700 dark:bg-ink-900">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    const already = message.reactions.find((r) => r.emoji === emoji)?.reactedByMe ?? false;
                    onReact(message.id, emoji, already);
                    setShowReactionPicker(false);
                  }}
                  className="rounded p-1 text-base hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <IconButton label="Reply" onClick={() => onReply(message)}>
          <Reply size={14} />
        </IconButton>
        {isMine && (
          <>
            <IconButton label="Edit" onClick={() => setIsEditing(true)}>
              <Pencil size={14} />
            </IconButton>
            <IconButton label="Delete" onClick={() => onDelete(message.id)}>
              <Trash2 size={14} />
            </IconButton>
          </>
        )}
        <IconButton label="More">
          <MoreHorizontal size={14} />
        </IconButton>
      </div>
      {void currentUserId}
    </div>
  );
}

function IconButton({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
    >
      {children}
    </button>
  );
}

function DeliveryIndicator({ message, onRetry }: { message: LocalMessage; onRetry: () => void }) {
  switch (message.deliveryState) {
    case "SENDING":
      return <Clock size={12} aria-label="Sending" />;
    case "FAILED":
      return (
        <button onClick={onRetry} className="flex items-center gap-1 text-red-500 hover:underline">
          <AlertCircle size={12} /> Failed — retry
        </button>
      );
    case "READ":
      return <CheckCheck size={13} className="text-pine-400" aria-label="Read" />;
    case "DELIVERED":
      return <CheckCheck size={13} aria-label="Delivered" />;
    case "SENT":
    default:
      return <Check size={13} aria-label="Sent" />;
  }
}

function AttachmentPreview({ attachment, isMine }: { attachment: LocalMessage["attachments"][number]; isMine: boolean }) {
  const isImage = attachment.mimeType.startsWith("image/");
  const isVideo = attachment.mimeType.startsWith("video/");
  const isAudio = attachment.mimeType.startsWith("audio/");

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-1.5 block overflow-hidden rounded-lg">
        <img src={attachment.url} alt={attachment.fileName} className="max-h-64 w-full object-cover" />
      </a>
    );
  }
  if (isVideo) {
    return (
      <video controls className="mt-1.5 max-h-64 w-full rounded-lg">
        <source src={attachment.url} type={attachment.mimeType} />
      </video>
    );
  }
  if (isAudio) {
    return (
      <audio controls className="mt-1.5 w-full">
        <source src={attachment.url} type={attachment.mimeType} />
      </audio>
    );
  }
  return (
    <a
      href={attachment.url}
      download={attachment.fileName}
      className={cn(
        "mt-1.5 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
        isMine ? "border-white/30 bg-white/10" : "border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900"
      )}
    >
      <Download size={14} />
      <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
      <span className="shrink-0 opacity-70">{Math.round(attachment.size / 1024)} KB</span>
    </a>
  );
}
