import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jti: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    revokedAt: { type: Date, default: null },
    replacedByJti: { type: String, default: null },
    userAgent: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDocument = InferSchemaType<typeof refreshTokenSchema> & {
  _id: Schema.Types.ObjectId;
};
export const RefreshToken: Model<RefreshTokenDocument> = model<RefreshTokenDocument>(
  "RefreshToken",
  refreshTokenSchema
);
