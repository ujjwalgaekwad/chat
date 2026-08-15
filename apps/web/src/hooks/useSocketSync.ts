import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ConversationDTO } from "@chat-platform/shared";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";
import { useAuthStore } from "../stores/auth.store";
import { usePresenceStore } from "../stores/presence.store";
import { useTypingStore } from "../stores/typing.store";
import { useConnectionStore } from "../stores/connection.store";
import { useToastStore } from "../stores/toast.store";
import { messagesQueryKey } from "./useMessages";
import type { LocalMessage } from "../types/local";

export function useSocketSync() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();
    connectSocket();

    const setStatus = useConnectionStore.getState().setStatus;
    setStatus("connecting");

    function upsertMessage(message: LocalMessage) {
      queryClient.setQueryData(messagesQueryKey(message.conversationId), (old: any) => {
        if (!old) return old;
        let found = false;
        const pages = old.pages.map((page: any) => {
          const items = page.items.map((m: LocalMessage) => {
            if (m.id === message.id || (m.clientTempId && m.clientTempId === message.clientTempId)) {
              found = true;
              return message;
            }
            return m;
          });
          return { ...page, items };
        });
        if (!found) {
          const [first, ...rest] = pages;
          return { ...old, pages: [{ ...first, items: [message, ...first.items] }, ...rest] };
        }
        return { ...old, pages };
      });
    }

    function bumpConversationPreview(conversationId: string, message: LocalMessage) {
      queryClient.setQueryData(["conversations"], (old?: ConversationDTO[]) => {
        if (!old) return old;
        const currentUserId = useAuthStore.getState().user?.id;
        const isMine = message.senderId === currentUserId;
        return old
          .map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessage: {
                    id: message.id,
                    text: message.text,
                    type: message.type,
                    senderId: message.senderId,
                    createdAt: message.createdAt,
                  },
                  lastMessageAt: message.createdAt,
                  unreadCount: isMine ? c.unreadCount : c.unreadCount + 1,
                }
              : c
          )
          .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
      });
    }

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.io.on("reconnect_attempt", () => setStatus("connecting"));

    socket.on("message:ack", ({ clientTempId, message }) => {
      upsertMessage({ ...message, deliveryState: "SENT" });
      bumpConversationPreview(message.conversationId, message);
      void clientTempId;
    });

    socket.on("message:failed", ({ clientTempId }) => {
      queryClient.getQueryCache().findAll({ queryKey: ["messages"] }).forEach((q) => {
        queryClient.setQueryData(q.queryKey, (old: any) => {
          if (!old) return old;
          const pages = old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((m: LocalMessage) =>
              m.clientTempId === clientTempId ? { ...m, deliveryState: "FAILED" } : m
            ),
          }));
          return { ...old, pages };
        });
      });
    });

    socket.on("message:new", (message) => {
      upsertMessage({ ...message, deliveryState: "DELIVERED" });
      bumpConversationPreview(message.conversationId, message);
    });

    socket.on("message:update", (message) => {
      upsertMessage(message);
    });

    socket.on("message:delete", ({ messageId, conversationId }) => {
      queryClient.setQueryData(messagesQueryKey(conversationId), (old: any) => {
        if (!old) return old;
        const pages = old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((m: LocalMessage) =>
            m.id === messageId
              ? { ...m, deletedAt: new Date().toISOString(), text: null, attachments: [] }
              : m
          ),
        }));
        return { ...old, pages };
      });
    });

    socket.on("message:reaction_update", ({ messageId, conversationId, reactions }) => {
      queryClient.setQueryData(messagesQueryKey(conversationId), (old: any) => {
        if (!old) return old;
        const pages = old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((m: LocalMessage) => (m.id === messageId ? { ...m, reactions } : m)),
        }));
        return { ...old, pages };
      });
    });

    socket.on("presence:update", ({ userId, isOnline, lastSeenAt }) => {
      usePresenceStore.getState().setPresence(userId, { isOnline, lastSeenAt });
    });

    socket.on("typing:update", ({ conversationId, userId, isTyping }) => {
      useTypingStore.getState().setTyping(conversationId, userId, isTyping);
    });

    socket.on("conversation:created", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
    socket.on("conversation:member_added", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
    socket.on("conversation:member_removed", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("notification:new", ({ preview }) => {
      useToastStore.getState().push({
        title: "New message",
        description: preview || "Sent an attachment",
      });
    });

    return () => {
      socket.off();
      disconnectSocket();
    };
  }, [accessToken, queryClient]);
}
