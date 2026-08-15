import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useConversation, useMarkConversationRead } from "../hooks/useConversations";
import { useMessages } from "../hooks/useMessages";
import { ChatHeader } from "../components/ChatHeader";
import { MessageBubble } from "../components/MessageBubble";
import { MessageComposer } from "../components/MessageComposer";
import { DetailsPanel } from "../components/DetailsPanel";
import { TypingDots } from "../components/TypingDots";
import { useAuthStore } from "../stores/auth.store";
import { useTypingStore } from "../stores/typing.store";
import { useUiStore } from "../stores/ui.store";
import type { LocalMessage } from "../types/local";
import { getSocket } from "../lib/socket";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversation } = useConversation(conversationId ?? null);
  const {
    messages,
    isLoading,
    hasMore,
    loadOlder,
    isLoadingOlder,
    sendMessage,
    editMessage,
    deleteMessage,
    react,
    retrySend,
  } = useMessages(conversationId ?? null);
  const markRead = useMarkConversationRead();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const typingUserIds = useTypingStore((s) => (conversationId ? s.byConversation[conversationId] : undefined));
  const detailsPanelOpen = useUiStore((s) => s.detailsPanelOpen);

  const [replyTo, setReplyTo] = useState<LocalMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!conversationId) return;
    getSocket().emit("conversation:join", { conversationId });
    return () => {
      getSocket().emit("conversation:leave", { conversationId });
    };
  }, [conversationId]);

  useEffect(() => {
    if (!isLoading) {
      bottomAnchorRef.current?.scrollIntoView({ block: "end" });
    }
  }, [conversationId, isLoading]);

  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && scrollRef.current) {
      const diff = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
      scrollRef.current.scrollTop += diff;
      prevScrollHeightRef.current = null;
    }
  }, [messages.length]);

  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markRead.mutate(conversationId);
    }
  }, [conversationId, messages.length]);

  const handleScroll = () => {
    if (!scrollRef.current || !hasMore || isLoadingOlder) return;
    if (scrollRef.current.scrollTop < 80) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight;
      loadOlder();
    }
  };

  const jumpToReply = (messageId: string) => {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (!conversation || !currentUserId) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-400">Loading…</div>;
  }

  const typingNames = Array.from(typingUserIds ?? [])
    .filter((id) => id !== currentUserId)
    .map((id) => conversation.members.find((m) => m.userId === id)?.user?.name ?? "Someone");

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <ChatHeader conversation={conversation} />

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scrollbar-thin py-3">
          {isLoadingOlder && <p className="py-2 text-center text-xs text-ink-400">Loading older messages…</p>}

          {messages.length === 0 && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-ink-400">
              <p className="font-medium text-ink-600 dark:text-ink-300">No messages yet</p>
              <p className="mt-1">Say hello 👋</p>
            </div>
          )}

          {messages.map((message, idx) => {
            const prev = messages[idx - 1];
            const showSenderInfo = !prev || prev.senderId !== message.senderId;
            const sender = conversation.members.find((m) => m.userId === message.senderId);
            const replyToMessage = message.replyTo
              ? messages.find((m) => m.id === message.replyTo)
              : undefined;

            return (
              <div key={message.id} ref={(el) => (messageRefs.current[message.id] = el)}>
                <MessageBubble
                  message={message}
                  isMine={message.senderId === currentUserId}
                  senderName={sender?.user?.name ?? "Member"}
                  senderAvatar={sender?.user?.avatar}
                  showSenderInfo={showSenderInfo}
                  currentUserId={currentUserId}
                  replyToMessage={replyToMessage}
                  onReply={setReplyTo}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReact={react}
                  onRetry={retrySend}
                  onJumpToReply={jumpToReply}
                />
              </div>
            );
          })}

          {typingNames.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-1 text-xs text-ink-400">
              <TypingDots />
              <span>
                {typingNames.length === 1
                  ? `${typingNames[0]} is typing…`
                  : `${typingNames.join(" and ")} are typing…`}
              </span>
            </div>
          )}

          <div ref={bottomAnchorRef} />
        </div>

        <MessageComposer
          conversationId={conversation.id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSend={sendMessage}
        />
      </div>

      {detailsPanelOpen && (
        <div className="hidden w-80 shrink-0 border-l border-ink-200 dark:border-ink-800 lg:block">
          <DetailsPanel conversation={conversation} />
        </div>
      )}
    </div>
  );
}
