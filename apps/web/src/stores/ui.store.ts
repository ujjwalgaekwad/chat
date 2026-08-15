import { create } from "zustand";

type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  toggleTheme: () => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  detailsPanelOpen: boolean;
  setDetailsPanelOpen: (open: boolean) => void;
}

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem("chat-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem("chat-theme", theme);
}

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useUiStore = create<UiState>((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id, mobileSidebarOpen: false }),
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  detailsPanelOpen: false,
  setDetailsPanelOpen: (open) => set({ detailsPanelOpen: open }),
}));
