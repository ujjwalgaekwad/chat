import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

async function registerUser(email: string) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: email.split("@")[0], email, password: "SuperSecret123!", confirmPassword: "SuperSecret123!" });
  return { userId: res.body.data.user.id as string, accessToken: res.body.data.accessToken as string };
}

describe("Conversations", () => {
  let alice: { userId: string; accessToken: string };
  let bob: { userId: string; accessToken: string };
  let carol: { userId: string; accessToken: string };

  beforeEach(async () => {
    alice = await registerUser("alice@example.com");
    bob = await registerUser("bob@example.com");
    carol = await registerUser("carol@example.com");
  });

  it("creates a direct conversation between two users", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ userId: bob.userId });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe("DIRECT");
    expect(res.body.data.members).toHaveLength(2);
  });

  it("does not create a duplicate direct conversation for the same pair", async () => {
    const first = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ userId: bob.userId });

    const second = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${bob.accessToken}`)
      .send({ userId: alice.userId });

    expect(first.body.data.id).toBe(second.body.data.id);

    const list = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`);
    expect(list.body.data).toHaveLength(1);
  });

  it("creates a group conversation with the creator as OWNER", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ name: "Engineering", memberIds: [bob.userId, carol.userId] });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe("GROUP");
    expect(res.body.data.members).toHaveLength(3);

    const owner = res.body.data.members.find((m: any) => m.userId === alice.userId);
    expect(owner.role).toBe("OWNER");
  });

  it("lets an admin add a member, but rejects a plain member from doing so", async () => {
    const group = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ name: "Engineering", memberIds: [bob.userId] });

    const conversationId = group.body.data.id;
    const dave = await registerUser("dave@example.com");

   
    const forbidden = await request(app)
      .post(`/api/conversations/${conversationId}/members`)
      .set("Authorization", `Bearer ${bob.accessToken}`)
      .send({ userId: dave.userId });
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .post(`/api/conversations/${conversationId}/members`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ userId: dave.userId });
    expect(allowed.status).toBe(201);
    expect(allowed.body.data.members).toHaveLength(3);
  });

  it("removes a member from a group", async () => {
    const group = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ name: "Engineering", memberIds: [bob.userId] });

    const conversationId = group.body.data.id;

    const res = await request(app)
      .delete(`/api/conversations/${conversationId}/members/${bob.userId}`)
      .set("Authorization", `Bearer ${alice.accessToken}`);

    expect(res.status).toBe(200);

    const membersRes = await request(app)
      .get(`/api/conversations/${conversationId}/members`)
      .set("Authorization", `Bearer ${alice.accessToken}`);
    expect(membersRes.body.data).toHaveLength(1);
  });

  it("rejects a non-member from viewing a conversation", async () => {
    const direct = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ userId: bob.userId });

    const res = await request(app)
      .get(`/api/conversations/${direct.body.data.id}`)
      .set("Authorization", `Bearer ${carol.accessToken}`);

    expect(res.status).toBe(403);
  });
});
