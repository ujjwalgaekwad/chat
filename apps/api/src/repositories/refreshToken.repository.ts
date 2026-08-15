import crypto from "crypto";
import { RefreshToken } from "../models/RefreshToken";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const refreshTokenRepository = {
  hashToken,

  create(data: {
    userId: string;
    jti: string;
    rawToken: string;
    expiresAt: Date;
    userAgent?: string | null;
  }) {
    return RefreshToken.create({
      userId: data.userId,
      jti: data.jti,
      tokenHash: hashToken(data.rawToken),
      expiresAt: data.expiresAt,
      userAgent: data.userAgent ?? null,
    });
  },

  findActiveByJti(jti: string) {
    return RefreshToken.findOne({ jti, revokedAt: null });
  },

  async revoke(jti: string, replacedByJti?: string) {
    await RefreshToken.updateOne(
      { jti },
      { $set: { revokedAt: new Date(), replacedByJti: replacedByJti ?? null } }
    );
  },

  async revokeAllForUser(userId: string) {
    await RefreshToken.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  },
};
