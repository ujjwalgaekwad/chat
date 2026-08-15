import { useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { CursorPage, AttachmentDTO } from "@chat-platform/shared";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../stores/auth.store";
import type { LocalMessage } from "../types/local";

type MessagesPage = CursorPage<LocalMessage>;

function messagesQueryKey(conversationId: string) {
  return ["messages", conversationId] as const;
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: messagesQueryKey(conversationId ?? "none"),
    queryFn: async ({ pageParam }) => {
      const res = await api.get(`/conversations/${conversationId}/messages`, {
        params: { before: pageParam, limit: 50 },
      });
      return res.data.data as MessagesPage;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
    enabled: !!conversationId,
    staleTime: Infinity,
  });

  const messages: LocalMessage[] = (query.data?.pages ?? [])
    .slice()
    .reverse()
    .flatMap((page) => page.items.slice().reverse());

  const sendMessage = useCallback(
    (input: { text?: string; attachments?: AttachmentDTO[]; replyTo?: string | null }) => {
      if (!conversationId) return;
      const me = useAuthStore.getState().user;
      if (!me) return;

      const clientTempId = crypto.randomUUID();
      const optimistic: LocalMessage = {
        id: `temp-${clientTempId}`,
        conversationId,
        senderId: me.id,
        type: input.attachments?.length ? "FILE" : "TEXT",
        text: input.text?.trim() || null,
        attachments: input.attachments ?? [],
        replyTo: input.replyTo ?? null,
        reactions: [],
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientTempId,
        deliveryState: "SENDING",
      };

      queryClient.setQueryData(messagesQueryKey(conversationId), (old: any) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [{ ...first, items: [optimistic, ...first.items] }, ...rest],
        };
      });

      getSocket().emit("message:send", {
        conversationId,
        text: input.text,
        attachments: input.attachments,
        replyTo: input.replyTo ?? null,
        clientTempId,
      });
    },
    [conversationId, queryClient]
  );

  const editMessage = useCallback(
    (messageId: string, text: string) => {
      getSocket().emit("message:edit", { messageId, text });
    },
    []
  );

  const deleteMessage = useCallback((messageId: string) => {
    getSocket().emit("message:delete", { messageId });
  }, []);

  const react = useCallback((messageId: string, emoji: string, alreadyReacted: boolean) => {
    if (alreadyReacted) {
      getSocket().emit("message:unreact", { messageId, emoji });
    } else {
      getSocket().emit("message:react", { messageId, emoji });
    }
  }, []);

  const retrySend = useCallback(
    (message: LocalMessage) => {
      if (!message.clientTempId) return;
      queryClient.setQueryData(messagesQueryKey(conversationId ?? "none"), (old: any) => {
        if (!old) return old;
        const pages = old.pages.map((page: MessagesPage) => ({
          ...page,
          items: page.items.map((m) =>
            m.id === message.id ? { ...m, deliveryState: "SENDING" } : m
          ),
        }));
        return { ...old, pages };
      });
      getSocket().emit("message:send", {
        conversationId: message.conversationId,
        text: message.text ?? undefined,
        attachments: message.attachments,
        replyTo: message.replyTo,
        clientTempId: message.clientTempId,
      });
    },
    [conversationId, queryClient]
  );

  return {
    messages,
    isLoading: query.isLoading,
    hasMore: query.hasNextPage,
    loadOlder: query.fetchNextPage,
    isLoadingOlder: query.isFetchingNextPage,
    sendMessage,
    editMessage,
    deleteMessage,
    react,
    retrySend,
  };
}

export { messagesQueryKey };
