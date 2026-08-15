import { useMemo, useState } from "react";
import { Plus, Search, Moon, Sun, LogOut, Settings, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "../hooks/useConversations";
import { ConversationListItem, conversationDisplayName } from "./ConversationListItem";
import { useUiStore } from "../stores/ui.store";
import { useAuthStore } from "../stores/auth.store";
import { useLogout } from "../hooks/useAuth";
import { Avatar } from "./Avatar";
import { NewChatDialog } from "./NewChatDialog";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { cn } from "../lib/utils";

export function Sidebar() {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const activeConversationId = useUiStore((s) => s.activeConversationId);
  const setActiveConversationId = useUiStore((s) => s.setActiveConversationId);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const currentUserId = user?.id;

  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const filtered = useMemo(() => {
    if (!conversations) return [];
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => conversationDisplayName(c, currentUserId).toLowerCase().includes(q));
  }, [conversations, search, currentUserId]);

  const groups = filtered.filter((c) => c.type === "GROUP");
  const directs = filtered.filter((c) => c.type === "DIRECT");

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3 dark:border-ink-800">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pine-500 font-display text-sm text-white">
            C
          </span>
          <span className="font-display text-base text-ink-900 dark:text-ink-50">Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            aria-label="Create group"
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            <Users size={16} />
          </button>
          <button
            onClick={() => setShowNewChat(true)}
            aria-label="New chat"
            className="rounded-lg bg-pine-500 p-1.5 text-white hover:bg-pine-600"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="border-b border-ink-200 p-3 dark:border-ink-800">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={15} />
          <input
            className="input py-1.5 pl-8 text-sm"
            placeholder="Search messages and people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {isLoading && <p className="px-2 py-4 text-sm text-ink-400">Loading conversations…</p>}

        {!isLoading && conversations?.length === 0 && (
          <div className="px-3 py-10 text-center">
            <p className="text-sm font-medium text-ink-700 dark:text-ink-300">No conversations yet</p>
            <p className="mt-1 text-xs text-ink-400">Start a new conversation to get going.</p>
          </div>
        )}

        {groups.length > 0 && (
          <SectionLabel>Groups</SectionLabel>
        )}
        <div className="space-y-0.5">
          {groups.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              active={c.id === activeConversationId}
              onClick={() => {
                setActiveConversationId(c.id);
                navigate(`/app/chat/${c.id}`);
              }}
            />
          ))}
        </div>

        {directs.length > 0 && <SectionLabel className="mt-3">Direct messages</SectionLabel>}
        <div className="space-y-0.5">
          {directs.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              active={c.id === activeConversationId}
              onClick={() => {
                setActiveConversationId(c.id);
                navigate(`/app/chat/${c.id}`);
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-ink-200 p-3 dark:border-ink-800">
        <Avatar name={user?.name ?? ""} src={user?.avatar} presence="online" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-100">{user?.name}</p>
          <p className="truncate text-xs text-ink-400">{user?.status ?? "Active"}</p>
        </div>
        <button
          onClick={() => navigate("/app/settings")}
          aria-label="Settings"
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => logout.mutate()}
          aria-label="Log out"
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
        >
          <LogOut size={16} />
        </button>
      </div>

      {showNewChat && <NewChatDialog onClose={() => setShowNewChat(false)} />}
      {showCreateGroup && <CreateGroupDialog onClose={() => setShowCreateGroup(false)} />}
    </div>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400", className)}>
      {children}
    </p>
  );
}
