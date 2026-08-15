import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    thumbnailUrl: { type: String, default: null },
  },
  { _id: false }
);

const reactionSchema = new Schema(
  {
    emoji: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["TEXT", "IMAGE", "VIDEO", "AUDIO", "FILE", "SYSTEM"],
      default: "TEXT",
    },
    text: { type: String, default: null, maxlength: 8000 },
    attachments: { type: [attachmentSchema], default: [] },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    reactions: { type: [reactionSchema], default: [] },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ text: "text" });

export type MessageDocument = InferSchemaType<typeof messageSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Message: Model<MessageDocument> = model<MessageDocument>("Message", messageSchema);
