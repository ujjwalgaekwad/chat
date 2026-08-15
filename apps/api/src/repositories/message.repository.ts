import { Types } from "mongoose";
import { Message } from "../models/Message";

export const messageRepository = {
  create(data: {
    conversationId: string;
    senderId: string;
    type: string;
    text?: string | null;
    attachments?: unknown[];
    replyTo?: string | null;
  }) {
    return Message.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      type: data.type,
      text: data.text ?? null,
      attachments: data.attachments ?? [],
      replyTo: data.replyTo ?? null,
    });
  },

  findById(id: string) {
    return Message.findById(id);
  },

  async findPage(conversationId: string, opts: { before?: string; limit: number }) {
    const query: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
    };
    if (opts.before) {
      query._id = { $lt: new Types.ObjectId(opts.before) };
    }

    const items = await Message.find(query)
      .sort({ _id: -1 })
      .limit(opts.limit + 1)
      .lean();

    const hasMore = items.length > opts.limit;
    const page = hasMore ? items.slice(0, opts.limit) : items;
    const lastItem = page[page.length - 1];
    const nextCursor = hasMore && lastItem ? lastItem._id.toString() : null;

    return { items: page, nextCursor, hasMore };
  },

  editText(id: string, text: string) {
    return Message.findByIdAndUpdate(
      id,
      { $set: { text, editedAt: new Date() } },
      { new: true }
    );
  },

  softDelete(id: string) {
    return Message.findByIdAndUpdate(
      id,
      { $set: { deletedAt: new Date(), text: null, attachments: [] } },
      { new: true }
    );
  },

  addReaction(id: string, userId: string, emoji: string) {
    return Message.findOneAndUpdate(
      { _id: id, "reactions.userId": { $ne: userId } },
      { $push: { reactions: { emoji, userId, createdAt: new Date() } } },
      { new: true }
    );
  },

  removeReaction(id: string, userId: string, emoji: string) {
    return Message.findByIdAndUpdate(
      id,
      { $pull: { reactions: { userId, emoji } } },
      { new: true }
    );
  },

  searchInConversations(conversationIds: string[], query: string, limit = 30) {
    return Message.find({
      conversationId: { $in: conversationIds },
      deletedAt: null,
      $text: { $search: query },
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();
  },
};
