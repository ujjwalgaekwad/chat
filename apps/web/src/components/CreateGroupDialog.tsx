import { useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "./Dialog";
import { Avatar } from "./Avatar";
import { useAllUsers, useSearchUsers } from "../hooks/useAuth";
import { useCreateGroup } from "../hooks/useConversations";
import { useUiStore } from "../stores/ui.store";
import type { UserDTO } from "@chat-platform/shared";

export function CreateGroupDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: allUsers } = useAllUsers();
  const { data: searchResults } = useSearchUsers(query);
  const createGroup = useCreateGroup();
  const setActiveConversationId = useUiStore((s) => s.setActiveConversationId);

  const candidates = (query.trim() ? searchResults ?? [] : allUsers ?? []).filter(
    (u) => !selected.some((s) => s.id === u.id)
  );

  const toggleUser = (user: UserDTO) => {
    setSelected((prev) => (prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Give the group a name");
      return;
    }
    if (selected.length === 0) {
      setError("Add at least one member");
      return;
    }
    try {
      const conversation = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selected.map((u) => u.id),
      });
      setActiveConversationId(conversation.id);
      onClose();
    } catch {
      setError("Couldn't create the group. Try again.");
    }
  };

  return (
    <Dialog title="Create group" onClose={onClose}>
      <div className="space-y-3">
        <input className="input" placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="input"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((u) => (
              <span
                key={u.id}
                className="flex items-center gap-1 rounded-full bg-pine-500/10 py-1 pl-1 pr-2 text-xs font-medium text-pine-700 dark:text-pine-300"
              >
                <Avatar name={u.name} src={u.avatar} size="sm" />
                {u.name}
                <button onClick={() => toggleUser(u)} aria-label={`Remove ${u.name}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          className="input"
          placeholder="Add members"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <ul className="max-h-48 space-y-0.5 overflow-y-auto scrollbar-thin">
          {candidates.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => toggleUser(u)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <Avatar name={u.name} src={u.avatar} size="sm" />
                <span className="text-sm text-ink-900 dark:text-ink-100">{u.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={createGroup.isPending}
          className="btn-primary w-full"
        >
          Create group
        </button>
      </div>
    </Dialog>
  );
}
