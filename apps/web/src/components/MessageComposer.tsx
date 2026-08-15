import { useRef, useState } from "react";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import type { AttachmentDTO } from "@chat-platform/shared";
import type { LocalMessage } from "../types/local";
import { useFileUpload } from "../hooks/useFileUpload";
import { useTypingEmitter } from "../hooks/useTypingEmitter";
import { cn } from "../lib/utils";

interface Props {
  conversationId: string;
  replyTo: LocalMessage | null;
  onCancelReply: () => void;
  onSend: (input: { text?: string; attachments?: AttachmentDTO[]; replyTo?: string | null }) => void;
}

export function MessageComposer({ conversationId, replyTo, onCancelReply, onSend }: Props) {
  const [text, setText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<AttachmentDTO | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress } = useFileUpload();
  const { notifyTyping, stopTyping } = useTypingEmitter(conversationId);

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    const attachment = await upload(file);
    if (attachment) setPendingAttachment(attachment);
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingAttachment) return;
    onSend({
      text: trimmed || undefined,
      attachments: pendingAttachment ? [pendingAttachment] : undefined,
      replyTo: replyTo?.id ?? null,
    });
    setText("");
    setPendingAttachment(null);
    onCancelReply();
    stopTyping();
  };

  return (
    <div
      className={cn("border-t border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900", isDragging && "bg-pine-50 dark:bg-pine-900/20")}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      }}
      onPaste={(e) => {
        const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
        const file = item?.getAsFile();
        if (file) handleFiles([file]);
      }}
    >
      {isDragging && (
        <div className="mb-2 rounded-lg border-2 border-dashed border-pine-400 bg-pine-50 py-3 text-center text-sm text-pine-700 dark:bg-pine-900/30 dark:text-pine-300">
          Drop files to upload
        </div>
      )}

      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-ink-100 px-3 py-1.5 text-xs dark:bg-ink-800">
          <span className="truncate text-ink-500 dark:text-ink-400">
            Replying to <span className="font-medium text-ink-700 dark:text-ink-300">{replyTo.text ?? "attachment"}</span>
          </span>
          <button onClick={onCancelReply} aria-label="Cancel reply">
            <X size={14} />
          </button>
        </div>
      )}

      {(isUploading || pendingAttachment) && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-1.5 text-xs dark:border-ink-700">
          {isUploading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Uploading… {progress}%
            </>
          ) : (
            <>
              <span className="flex-1 truncate">{pendingAttachment?.fileName}</span>
              <button onClick={() => setPendingAttachment(null)} aria-label="Remove attachment">
                <X size={14} />
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <textarea
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim()) notifyTyping();
            else stopTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message… (Shift+Enter for a new line)"
          className="input max-h-32 flex-1 resize-none py-2"
        />

        <button
          onClick={submit}
          disabled={!text.trim() && !pendingAttachment}
          aria-label="Send message"
          className="btn-primary rounded-lg p-2 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
