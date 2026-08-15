import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const conversationSchema = new Schema(
  {
    type: { type: String, enum: ["DIRECT", "GROUP"], required: true },
    name: { type: String, default: null, maxlength: 100 },
    description: { type: String, default: null, maxlength: 500 },
    avatar: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: {
      messageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
      text: { type: String, default: null },
      type: { type: String, default: null },
      senderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    lastMessageAt: { type: Date, default: null, index: true },
    directKey: { type: String, default: null },
  },
  { timestamps: true }
);

conversationSchema.index(
  { directKey: 1 },
  { unique: true, partialFilterExpression: { directKey: { $type: "string" } } }
);
conversationSchema.index({ lastMessageAt: -1 });

export type ConversationDocument = InferSchemaType<typeof conversationSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Conversation: Model<ConversationDocument> = model<ConversationDocument>(
  "Conversation",
  conversationSchema
);
