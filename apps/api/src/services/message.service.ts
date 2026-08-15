import { conversationRepository } from "../repositories/conversation.repository";
import { messageRepository } from "../repositories/message.repository";
import { ApiError } from "../utils/ApiError";
import { toMessageDTO } from "../utils/mappers";
import type { AttachmentDTO } from "@chat-platform/shared";

async function assertMembership(conversationId: string, userId: string) {
  const isMember = await conversationRepository.isMember(conversationId, userId);
  if (!isMember) {
    throw ApiError.forbidden("You are not a member of this conversation", "NOT_A_MEMBER");
  }
}

function inferMessageType(attachments: AttachmentDTO[] = []): string {
  if (attachments.length === 0) return "TEXT";
  const mime = attachments[0]?.mimeType ?? "";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  return "FILE";
}

export const messageService = {
  async send(
    conversationId: string,
    senderId: string,
    data: { text?: string; attachments?: AttachmentDTO[]; replyTo?: string | null }
  ) {
    await assertMembership(conversationId, senderId);

    if (!data.text?.trim() && (!data.attachments || data.attachments.length === 0)) {
      throw ApiError.badRequest("EMPTY_MESSAGE", "Message must have text or an attachment");
    }

    const type = inferMessageType(data.attachments);
    const message = await messageRepository.create({
      conversationId,
      senderId,
      type,
      text: data.text?.trim() || null,
      attachments: data.attachments ?? [],
      replyTo: data.replyTo ?? null,
    });

    await conversationRepository.updateLastMessage(conversationId, {
      messageId: message._id as unknown as import("mongoose").Types.ObjectId,
      text: message.text ?? null,
      type: message.type,
      senderId: message.senderId as unknown as import("mongoose").Types.ObjectId,
    });

    return toMessageDTO(message, senderId);
  },

  async getPage(conversationId: string, userId: string, before: string | undefined, limit: number) {
    await assertMembership(conversationId, userId);
    const page = await messageRepository.findPage(conversationId, { before, limit });
    return {
      items: page.items.map((m) => toMessageDTO(m, userId)),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  },

  async edit(messageId: string, userId: string, text: string) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw ApiError.notFound("Message not found");
    if (message.senderId.toString() !== userId) {
      throw ApiError.forbidden("You can only edit your own messages");
    }
    const updated = await messageRepository.editText(messageId, text.trim());
    return toMessageDTO(updated, userId);
  },

  async remove(messageId: string, userId: string) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw ApiError.notFound("Message not found");

    const member = await conversationRepository.getMember(
      message.conversationId.toString(),
      userId
    );
    const isOwnerOfMessage = message.senderId.toString() === userId;
    const isModerator = member && (member.role === "OWNER" || member.role === "ADMIN");
    if (!isOwnerOfMessage && !isModerator) {
      throw ApiError.forbidden("You cannot delete this message");
    }

    const deleted = await messageRepository.softDelete(messageId);
    return toMessageDTO(deleted, userId);
  },

  async react(messageId: string, userId: string, emoji: string) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw ApiError.notFound("Message not found");
    await assertMembership(message.conversationId.toString(), userId);
    const updated = await messageRepository.addReaction(messageId, userId, emoji);
    return toMessageDTO(updated ?? message, userId);
  },

  async unreact(messageId: string, userId: string, emoji: string) {
    const message = await messageRepository.findById(messageId);
    if (!message) throw ApiError.notFound("Message not found");
    const updated = await messageRepository.removeReaction(messageId, userId, emoji);
    return toMessageDTO(updated ?? message, userId);
  },
};
