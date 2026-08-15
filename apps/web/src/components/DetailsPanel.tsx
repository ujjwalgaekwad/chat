import { UserPlus, LogOut, X } from "lucide-react";
import { useState } from "react";
import type { ConversationDTO } from "@chat-platform/shared";
import { Avatar } from "./Avatar";
import { NewMemberPicker } from "./NewMemberPicker";
import { useAuthStore } from "../stores/auth.store";
import { useLeaveConversation, useRemoveMember } from "../hooks/useConversations";
import { useUiStore } from "../stores/ui.store";
import { useNavigate } from "react-router-dom";

export function DetailsPanel({ conversation }: { conversation: ConversationDTO }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [showAddMember, setShowAddMember] = useState(false);
  const removeMember = useRemoveMember(conversation.id);
  const leaveConversation = useLeaveConversation();
  const setDetailsPanelOpen = useUiStore((s) => s.setDetailsPanelOpen);
  const setActiveConversationId = useUiStore((s) => s.setActiveConversationId);
  const navigate = useNavigate();

  const myMembership = conversation.members.find((m) => m.userId === currentUserId);
  const canManage = myMembership?.role === "OWNER" || myMembership?.role === "ADMIN";

  const handleLeave = async () => {
    await leaveConversation.mutateAsync(conversation.id);
    setActiveConversationId(null);
    navigate("/app");
  };

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3 dark:border-ink-800">
        <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
          {conversation.type === "GROUP" ? "Group info" : "Details"}
        </h2>
        <button onClick={() => setDetailsPanelOpen(false)} aria-label="Close details" className="rounded p-1 hover:bg-ink-100 dark:hover:bg-ink-800">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {conversation.type === "GROUP" && (
          <div className="mb-6 flex flex-col items-center text-center">
            <Avatar name={conversation.name ?? "Group"} src={conversation.avatar} size="xl" />
            <p className="mt-3 font-display text-lg text-ink-900 dark:text-ink-50">{conversation.name}</p>
            {conversation.description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{conversation.description}</p>}
            <p className="mt-1 text-xs text-ink-400">{conversation.members.length} members</p>
          </div>
        )}

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Members</h3>
          {conversation.type === "GROUP" && canManage && (
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1 text-xs font-medium text-pine-600 hover:underline dark:text-pine-400"
            >
              <UserPlus size={13} /> Add
            </button>
          )}
        </div>

        <ul className="space-y-1">
          {conversation.members.map((m) => (
            <li key={m.userId} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
              <Avatar name={m.user?.name ?? "Member"} src={m.user?.avatar} size="sm" presence={m.user?.isOnline ? "online" : "offline"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-900 dark:text-ink-100">{m.user?.name}</p>
                <p className="text-[11px] uppercase tracking-wide text-ink-400">{m.role}</p>
              </div>
              {canManage && m.userId !== currentUserId && m.role !== "OWNER" && (
                <button
                  onClick={() => removeMember.mutate(m.userId)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {conversation.type === "GROUP" && (
          <button
            onClick={handleLeave}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            <LogOut size={15} /> Leave group
          </button>
        )}
      </div>

      {showAddMember && (
        <NewMemberPicker conversationId={conversation.id} existingMemberIds={conversation.members.map((m) => m.userId)} onClose={() => setShowAddMember(false)} />
      )}
    </div>
  );
}
