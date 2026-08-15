import { Types } from "mongoose";
import { Conversation, type ConversationDocument } from "../models/Conversation";
import { ConversationMember } from "../models/ConversationMember";

function directKeyFor(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(":");
}

export const conversationRepository = {
  async findOrCreateDirect(userIdA: string, userIdB: string, createdBy: string) {
    const directKey = directKeyFor(userIdA, userIdB);
    const existing = await Conversation.findOne({ directKey });
    if (existing) return { conversation: existing, created: false };

    try {
      const conversation = await Conversation.create({
        type: "DIRECT",
        directKey,
        createdBy,
      });
      await ConversationMember.insertMany([
        { conversationId: conversation._id, userId: userIdA, role: "MEMBER" },
        { conversationId: conversation._id, userId: userIdB, role: "MEMBER" },
      ]);
      return { conversation, created: true };
    } catch (err: unknown) {
      const isDuplicateKey =
        typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
      if (isDuplicateKey) {
        const conversation = await Conversation.findOne({ directKey });
        if (conversation) return { conversation, created: false };
      }
      throw err;
    }
  },

  async createGroup(data: {
    name: string;
    description?: string;
    avatar?: string;
    createdBy: string;
    memberIds: string[];
  }) {
    const conversation = await Conversation.create({
      type: "GROUP",
      name: data.name,
      description: data.description ?? null,
      avatar: data.avatar ?? null,
      createdBy: data.createdBy,
    });

    const uniqueMemberIds = Array.from(new Set([data.createdBy, ...data.memberIds]));
    await ConversationMember.insertMany(
      uniqueMemberIds.map((userId) => ({
        conversationId: conversation._id,
        userId,
        role: userId === data.createdBy ? "OWNER" : "MEMBER",
      }))
    );

    return conversation;
  },

  findById(id: string) {
    return Conversation.findById(id);
  },

  async findForUser(userId: string) {
    const memberships = await ConversationMember.find({ userId, archived: false }).lean();
    const conversationIds = memberships.map((m) => m.conversationId);
    const conversations = await Conversation.find({ _id: { $in: conversationIds } })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();
    return { conversations, memberships };
  },

  isMember(conversationId: string, userId: string) {
    return ConversationMember.exists({ conversationId, userId });
  },

  getMember(conversationId: string, userId: string) {
    return ConversationMember.findOne({ conversationId, userId });
  },

  getMembers(conversationId: string) {
    return ConversationMember.find({ conversationId }).lean();
  },

  addMember(conversationId: string, userId: string, role: "ADMIN" | "MEMBER" = "MEMBER") {
    return ConversationMember.findOneAndUpdate(
      { conversationId, userId },
      { $setOnInsert: { conversationId, userId, role, joinedAt: new Date() } },
      { upsert: true, new: true }
    );
  },

  removeMember(conversationId: string, userId: string) {
    return ConversationMember.deleteOne({ conversationId, userId });
  },

  setMemberRole(conversationId: string, userId: string, role: "ADMIN" | "MEMBER" | "OWNER") {
    return ConversationMember.findOneAndUpdate(
      { conversationId, userId },
      { $set: { role } },
      { new: true }
    );
  },

  markRead(conversationId: string, userId: string, at: Date = new Date()) {
    return ConversationMember.findOneAndUpdate(
      { conversationId, userId },
      { $set: { lastReadAt: at } },
      { new: true }
    );
  },

  updateLastMessage(
    conversationId: string | Types.ObjectId,
    lastMessage: {
      messageId: Types.ObjectId;
      text: string | null;
      type: string;
      senderId: Types.ObjectId;
    }
  ) {
    return Conversation.findByIdAndUpdate(conversationId, {
      $set: { lastMessage, lastMessageAt: new Date() },
    });
  },

  updateInfo(
    id: string,
    data: Partial<Pick<ConversationDocument, "name" | "description" | "avatar">>
  ) {
    return Conversation.findByIdAndUpdate(id, { $set: data }, { new: true });
  },
};
