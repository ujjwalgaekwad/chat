import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const conversationMemberSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["OWNER", "ADMIN", "MEMBER"], default: "MEMBER" },
    joinedAt: { type: Date, default: () => new Date() },
    lastReadAt: { type: Date, default: null },
    muted: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
conversationMemberSchema.index({ userId: 1, conversationId: 1 });

export type ConversationMemberDocument = InferSchemaType<typeof conversationMemberSchema> & {
  _id: Schema.Types.ObjectId;
};
export const ConversationMember: Model<ConversationMemberDocument> =
  model<ConversationMemberDocument>("ConversationMember", conversationMemberSchema);
