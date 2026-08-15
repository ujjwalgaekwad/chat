import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog } from "./Dialog";
import { Avatar } from "./Avatar";
import { useAllUsers, useSearchUsers } from "../hooks/useAuth";
import { useOpenDirectConversation } from "../hooks/useConversations";
import { useUiStore } from "../stores/ui.store";

export function NewChatDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { data: allUsers } = useAllUsers();
  const { data: searchResults } = useSearchUsers(query);
  const openDirect = useOpenDirectConversation();
  const setActiveConversationId = useUiStore((s) => s.setActiveConversationId);

  const users = query.trim() ? searchResults ?? [] : allUsers ?? [];

  const handleSelect = async (userId: string) => {
    const conversation = await openDirect.mutateAsync(userId);
    setActiveConversationId(conversation.id);
    onClose();
  };

  return (
    <Dialog title="New chat" onClose={onClose}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
        <input
          autoFocus
          className="input pl-9"
          placeholder="Search people"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ul className="mt-3 max-h-72 space-y-0.5 overflow-y-auto scrollbar-thin">
        {users.length === 0 && <li className="px-2 py-6 text-center text-sm text-ink-400">No one found</li>}
        {users.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => handleSelect(u.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <Avatar name={u.name} src={u.avatar} presence={u.isOnline ? "online" : "offline"} />
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{u.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{u.email}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
