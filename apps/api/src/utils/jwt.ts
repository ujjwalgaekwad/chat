import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string; 
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string; 
  jti: string;
  type: "refresh";
}

export function signAccessToken(userId: string): string {
  const payload: AccessTokenPayload = { sub: userId, type: "access" };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function signRefreshToken(userId: string, jti: string): string {
  const payload: RefreshTokenPayload = { sub: userId, jti, type: "refresh" };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== "access") throw new Error("Invalid token type");
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== "refresh") throw new Error("Invalid token type");
  return decoded;
}
