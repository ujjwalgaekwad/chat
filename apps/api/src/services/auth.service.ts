import { v4 as uuid } from "uuid";
import ms from "ms";
import { userRepository } from "../repositories/user.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import type { RegisterInput, LoginInput } from "../validators/auth.validators";
import type { UserDocument } from "../models/User";

function toPublicUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    isOnline: user.isOnline,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function issueTokenPair(userId: string, userAgent?: string) {
  const jti = uuid();
  const refreshToken = signRefreshToken(userId, jti);
  const accessToken = signAccessToken(userId);

  await refreshTokenRepository.create({
    userId,
    jti,
    rawToken: refreshToken,
    expiresAt: new Date(Date.now() + ms(env.JWT_REFRESH_TTL)),
    userAgent,
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict("An account with this email already exists", "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const tokens = await issueTokenPair(user._id.toString());
    return { user: toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput, userAgent?: string) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized("Invalid email", "INVALID_CREDENTIALS");
    }

    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      throw ApiError.unauthorized("Invalid password", "INVALID_CREDENTIALS");
    }

    const tokens = await issueTokenPair(user._id.toString(), userAgent);
    return { user: toPublicUser(user), ...tokens };
  },

  async refresh(rawRefreshToken: string, userAgent?: string) {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token", "REFRESH_TOKEN_INVALID");
    }

    const stored = await refreshTokenRepository.findActiveByJti(payload.jti);
    if (!stored) {
      await refreshTokenRepository.revokeAllForUser(payload.sub);
      throw ApiError.unauthorized("Refresh token has been revoked", "REFRESH_TOKEN_REVOKED");
    }

    const providedHash = refreshTokenRepository.hashToken(rawRefreshToken);
    if (providedHash !== stored.tokenHash) {
      await refreshTokenRepository.revokeAllForUser(payload.sub);
      throw ApiError.unauthorized("Refresh token mismatch", "REFRESH_TOKEN_REVOKED");
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw ApiError.unauthorized("User no longer exists", "USER_NOT_FOUND");
    }

    const tokens = await issueTokenPair(user._id.toString(), userAgent);
    await refreshTokenRepository.revoke(payload.jti);

    return { user: toPublicUser(user), ...tokens };
  },

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      await refreshTokenRepository.revoke(payload.jti);
    } catch {
      console.log("Already invalid/expired — nothing to revoke, logout still ");
    }
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return toPublicUser(user);
  },

  toPublicUser,
};
