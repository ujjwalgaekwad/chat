import type { Response } from "express";
import ms from "ms";
import { env, isProduction } from "../config/env";

export const REFRESH_COOKIE_NAME = "refresh_token";

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: ms(env.JWT_REFRESH_TTL),
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
}
