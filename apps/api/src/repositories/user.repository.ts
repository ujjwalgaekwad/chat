import { User, type UserDocument } from "../models/User";
import type { Types } from "mongoose";

export const userRepository = {
  findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  },

  findById(id: string | Types.ObjectId) {
    return User.findById(id);
  },

  findByIds(ids: Array<string | Types.ObjectId>) {
    return User.find({ _id: { $in: ids } });
  },

  async create(data: { name: string; email: string; passwordHash: string }) {
    return User.create({ ...data, email: data.email.toLowerCase() });
  },

  listAll(excludeUserId: string, limit = 50) {
    return User.find({ _id: { $ne: excludeUserId } })
      .sort({ name: 1 })
      .limit(limit)
      .lean();
  },

  search(query: string, excludeUserId: string, limit = 20) {
    return User.find({
      _id: { $ne: excludeUserId },
      $text: { $search: query },
    })
      .limit(limit)
      .lean();
  },

  updateProfile(id: string, data: Partial<Pick<UserDocument, "name" | "avatar" | "status">>) {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true });
  },

  setOnlineStatus(id: string | Types.ObjectId, isOnline: boolean) {
    return User.findByIdAndUpdate(id, {
      $set: { isOnline, lastSeenAt: new Date() },
    });
  },
};
