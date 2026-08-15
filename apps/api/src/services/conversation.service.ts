import { conversationRepository } from "../repositories/conversation.repository";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import { toConversationDTO, toMemberDTO } from "../utils/mappers";

async function buildConversationDTO(conversationDoc: any, currentUserId: string) {
  const memberDocs = await conversationRepository.getMembers(conversationDoc._id.toString());
  const userIds = memberDocs.map((m) => m.userId);
  const users = await userRepository.findByIds(userIds);
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const members = memberDocs.map((m) => {
    const dto = toMemberDTO(m);
    const user = userMap.get(dto.userId);
    if (user) {
      (dto as any).user = {
        id: user._id.toString(),
        name: user.name,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
      };
    }
    return dto;
  });

  const myMembership = memberDocs.find((m) => m.userId.toString() === currentUserId);
  
  const { Message } = await import("../models/Message");
  const unreadCount = myMembership
    ? await Message.countDocuments({
        conversationId: conversationDoc._id,
        deletedAt: null,
        senderId: { $ne: currentUserId },
        createdAt: { $gt: myMembership.lastReadAt ?? new Date(0) },
      })
    : 0;

  return toConversationDTO(conversationDoc, members, unreadCount);
}

export const conversationService = {
  async listForUser(userId: string) {
    const { conversations } = await conversationRepository.findForUser(userId);
    return Promise.all(conversations.map((c) => buildConversationDTO(c, userId)));
  },

  async getById(conversationId: string, userId: string) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found", "CONVERSATION_NOT_FOUND");

    const isMember = await conversationRepository.isMember(conversationId, userId);
    if (!isMember) throw ApiError.forbidden("You are not a member of this conversation");

    return buildConversationDTO(conversation, userId);
  },

  async openDirect(currentUserId: string, otherUserId: string) {
    if (currentUserId === otherUserId) {
      throw ApiError.badRequest("INVALID_TARGET", "Cannot start a direct conversation with yourself");
    }
    const otherUser = await userRepository.findById(otherUserId);
    if (!otherUser) throw ApiError.notFound("User not found");

    const { conversation } = await conversationRepository.findOrCreateDirect(
      currentUserId,
      otherUserId,
      currentUserId
    );
    return buildConversationDTO(conversation, currentUserId);
  },

  async createGroup(
    currentUserId: string,
    data: { name: string; description?: string; avatar?: string; memberIds: string[] }
  ) {
    if (!data.name?.trim()) {
      throw ApiError.badRequest("VALIDATION_ERROR", "Group name is required");
    }
    const conversation = await conversationRepository.createGroup({
      ...data,
      createdBy: currentUserId,
    });
    return buildConversationDTO(conversation, currentUserId);
  },

  async addMember(conversationId: string, actingUserId: string, targetUserId: string) {
    await assertCanManageMembers(conversationId, actingUserId);
    await conversationRepository.addMember(conversationId, targetUserId);
    const conversation = await conversationRepository.findById(conversationId);
    return buildConversationDTO(conversation, actingUserId);
  },

  async removeMember(conversationId: string, actingUserId: string, targetUserId: string) {
    await assertCanManageMembers(conversationId, actingUserId);
    await conversationRepository.removeMember(conversationId, targetUserId);
  },

  async leaveConversation(conversationId: string, userId: string) {
    await conversationRepository.removeMember(conversationId, userId);
  },

  async markRead(conversationId: string, userId: string) {
    const isMember = await conversationRepository.isMember(conversationId, userId);
    if (!isMember) throw ApiError.forbidden("You are not a member of this conversation");
    const member = await conversationRepository.markRead(conversationId, userId);
    return member ? toMemberDTO(member) : null;
  },

  buildConversationDTO,
};

async function assertCanManageMembers(conversationId: string, userId: string) {
  const member = await conversationRepository.getMember(conversationId, userId);
  if (!member) throw ApiError.forbidden("You are not a member of this conversation");
  if (member.role !== "OWNER" && member.role !== "ADMIN") {
    throw ApiError.forbidden("Only owners and admins can manage members", "INSUFFICIENT_ROLE");
  }
}
