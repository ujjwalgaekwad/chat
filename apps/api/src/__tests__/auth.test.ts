import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

describe("Auth", () => {
  const validUser = {
    name: "Test User",
    email: "test@example.com",
    password: "SuperSecret123!",
    confirmPassword: "SuperSecret123!",
  };

  it("registers a new user and returns an access token + refresh cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.headers["set-cookie"]?.[0]).toContain("refresh_token=");
  });

  it("rejects registering the same email twice", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects registration when passwords don't match", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, confirmPassword: "somethingElse123!" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it("rejects login with an invalid password", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects /me without an access token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user when authenticated", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const accessToken = registerRes.body.data.accessToken;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it("refreshes the access token using the refresh cookie and rotates it", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const cookie = registerRes.headers["set-cookie"][0];

    const refreshRes = await request(app).post("/api/auth/refresh").set("Cookie", cookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshRes.body.data.accessToken).not.toBe(registerRes.body.data.accessToken);
    
    const reuseRes = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(reuseRes.status).toBe(401);
  });

  it("logs out and revokes the refresh token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const cookie = registerRes.headers["set-cookie"][0];

    const logoutRes = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(refreshRes.status).toBe(401);
  });
});
