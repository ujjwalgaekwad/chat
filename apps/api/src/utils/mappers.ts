import type { MessageDTO, ConversationDTO, ConversationMemberDTO } from "@chat-platform/shared";

export function toMessageDTO(
  doc: any,
  currentUserId?: string
): MessageDTO {
  const reactionMap = new Map<
    string,
    { emoji: string; count: number; reactedByMe: boolean; userIds: string[] }
  >();

  for (const r of doc.reactions ?? []) {
    const key = r.emoji;
    const userId = r.userId.toString();
    const existing = reactionMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.userIds.push(userId);
      if (userId === currentUserId) existing.reactedByMe = true;
    } else {
      reactionMap.set(key, {
        emoji: key,
        count: 1,
        reactedByMe: userId === currentUserId,
        userIds: [userId],
      });
    }
  }

  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId.toString(),
    senderId: doc.senderId.toString(),
    type: doc.type,
    text: doc.text ?? null,
    attachments: doc.attachments ?? [],
    replyTo: doc.replyTo ? doc.replyTo.toString() : null,
    reactions: Array.from(reactionMap.values()),
    editedAt: doc.editedAt ? doc.editedAt.toISOString() : null,
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toConversationDTO(
  doc: any,
  members: ConversationMemberDTO[],
  unreadCount: number
): ConversationDTO {
  return {
    id: doc._id.toString(),
    type: doc.type,
    name: doc.name ?? null,
    description: doc.description ?? null,
    avatar: doc.avatar ?? null,
    createdBy: doc.createdBy.toString(),
    lastMessage: doc.lastMessage?.messageId
      ? {
          id: doc.lastMessage.messageId.toString(),
          text: doc.lastMessage.text ?? null,
          type: doc.lastMessage.type,
          senderId: doc.lastMessage.senderId.toString(),
          createdAt: doc.lastMessageAt ? doc.lastMessageAt.toISOString() : doc.createdAt.toISOString(),
        }
      : null,
    lastMessageAt: doc.lastMessageAt ? doc.lastMessageAt.toISOString() : null,
    members,
    unreadCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toMemberDTO(doc: any): ConversationMemberDTO {
  return {
    conversationId: doc.conversationId.toString(),
    userId: doc.userId.toString(),
    role: doc.role,
    joinedAt: doc.joinedAt.toISOString(),
    lastReadAt: doc.lastReadAt ? doc.lastReadAt.toISOString() : null,
    muted: doc.muted,
    archived: doc.archived,
  };
}
