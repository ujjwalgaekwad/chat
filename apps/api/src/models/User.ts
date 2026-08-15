import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String, default: null },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    status: { type: String, default: null, maxlength: 100 },
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ name: "text", email: "text" });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };
export const User: Model<UserDocument> = model<UserDocument>("User", userSchema);
