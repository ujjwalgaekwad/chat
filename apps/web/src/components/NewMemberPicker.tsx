import { useState } from "react";
import { Dialog } from "./Dialog";
import { Avatar } from "./Avatar";
import { useAllUsers, useSearchUsers } from "../hooks/useAuth";
import { useAddMember } from "../hooks/useConversations";

export function NewMemberPicker({
  conversationId,
  existingMemberIds,
  onClose,
}: {
  conversationId: string;
  existingMemberIds: string[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const { data: allUsers } = useAllUsers();
  const { data: searchResults } = useSearchUsers(query);
  const addMember = useAddMember(conversationId);

  const candidates = (query.trim() ? searchResults ?? [] : allUsers ?? []).filter(
    (u) => !existingMemberIds.includes(u.id)
  );

  return (
    <Dialog title="Add members" onClose={onClose}>
      <input
        autoFocus
        className="input"
        placeholder="Search people"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="mt-3 max-h-64 space-y-0.5 overflow-y-auto scrollbar-thin">
        {candidates.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => addMember.mutate(u.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <Avatar name={u.name} src={u.avatar} size="sm" />
              <span className="text-sm text-ink-900 dark:text-ink-100">{u.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
