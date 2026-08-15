import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ConversationDTO } from "@chat-platform/shared";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await api.get("/conversations");
      return res.data.data as ConversationDTO[];
    },
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ["conversations", id],
    queryFn: async () => {
      const res = await api.get(`/conversations/${id}`);
      return res.data.data as ConversationDTO;
    },
    enabled: !!id,
  });
}

export function useOpenDirectConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post("/conversations", { userId });
      return res.data.data as ConversationDTO;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; memberIds: string[] }) => {
      const res = await api.post("/conversations", input);
      return res.data.data as ConversationDTO;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useAddMember(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/conversations/${conversationId}/members`, { userId });
      return res.data.data as ConversationDTO;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversations", conversationId] });
    },
  });
}

export function useRemoveMember(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/conversations/${conversationId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversations", conversationId] });
    },
  });
}

export function useLeaveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.delete(`/conversations/${conversationId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.post(`/conversations/${conversationId}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
