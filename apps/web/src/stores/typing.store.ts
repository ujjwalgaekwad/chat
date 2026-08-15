import { create } from "zustand";

interface TypingState {
  byConversation: Record<string, Set<string>>;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  clearConversation: (conversationId: string) => void;
}

export const useTypingStore = create<TypingState>((set) => ({
  byConversation: {},
  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.byConversation[conversationId] ?? []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return { byConversation: { ...state.byConversation, [conversationId]: current } };
    }),
  clearConversation: (conversationId) =>
    set((state) => ({ byConversation: { ...state.byConversation, [conversationId]: new Set() } })),
}));
