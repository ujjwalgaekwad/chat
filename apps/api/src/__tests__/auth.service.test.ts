import { describe, it, expect } from "vitest";
import { authService } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";

describe("authService", () => {
  it("registers a new user and issues a token pair", async () => {
    const result = await authService.register({
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    expect(result.user.email).toBe("test@example.com");
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("rejects registration with a duplicate email", async () => {
    await authService.register({
      name: "First",
      email: "dupe@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    await expect(
      authService.register({
        name: "Second",
        email: "dupe@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      })
    ).rejects.toThrow(ApiError);
  });

  it("logs in with correct credentials", async () => {
    await authService.register({
      name: "Login User",
      email: "login@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    const result = await authService.login({
      email: "login@example.com",
      password: "Password123!",
    });

    expect(result.user.email).toBe("login@example.com");
    expect(result.accessToken).toBeTruthy();
  });

  it("rejects login with an invalid password", async () => {
    await authService.register({
      name: "Login User 2",
      email: "login2@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    await expect(
      authService.login({ email: "login2@example.com", password: "WrongPassword!" })
    ).rejects.toThrow(ApiError);
  });

  it("rejects login for a nonexistent email", async () => {
    await expect(
      authService.login({ email: "nobody@example.com", password: "Password123!" })
    ).rejects.toThrow(ApiError);
  });

  it("rotates refresh tokens and rejects reuse of a consumed token", async () => {
    const registered = await authService.register({
      name: "Refresh User",
      email: "refresh@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    const refreshed = await authService.refresh(registered.refreshToken);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).not.toBe(registered.refreshToken);

    await expect(authService.refresh(registered.refreshToken)).rejects.toThrow(ApiError);
    await expect(authService.refresh(refreshed.refreshToken)).rejects.toThrow(ApiError);
  });

  it("rejects a garbage refresh token", async () => {
    await expect(authService.refresh("not-a-real-token")).rejects.toThrow(ApiError);
  });
});
