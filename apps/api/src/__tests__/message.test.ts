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

describe("Messages", () => {
  let alice: { userId: string; accessToken: string };
  let bob: { userId: string; accessToken: string };
  let outsider: { userId: string; accessToken: string };
  let conversationId: string;

  beforeEach(async () => {
    alice = await registerUser("alice@example.com");
    bob = await registerUser("bob@example.com");
    outsider = await registerUser("outsider@example.com");

    const convo = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ userId: bob.userId });
    conversationId = convo.body.data.id;
  });

  it("sends a message as the authenticated sender, ignoring any client-supplied senderId", async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ text: "Hello Bob", senderId: bob.userId });

    expect(res.status).toBe(201);
    expect(res.body.data.senderId).toBe(alice.userId); 
    expect(res.body.data.text).toBe("Hello Bob");
  });

  it("rejects sending a message to a conversation the user isn't a member of", async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .send({ text: "sneaky" });

    expect(res.status).toBe(403);
  });

  it("edits a message only when the requester is the sender", async () => {
    const sendRes = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ text: "orignal typo" });
    const messageId = sendRes.body.data.id;

    const forbidden = await request(app)
      .patch(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${bob.accessToken}`)
      .send({ text: "hijacked edit" });
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .patch(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ text: "original fixed" });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.text).toBe("original fixed");
    expect(allowed.body.data.editedAt).not.toBeNull();
  });

  it("soft-deletes a message", async () => {
    const sendRes = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ text: "oops" });
    const messageId = sendRes.body.data.id;

    const res = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${alice.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deletedAt).not.toBeNull();
    expect(res.body.data.text).toBeNull();
  });

  it("paginates messages with a stable cursor, newest first", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set("Authorization", `Bearer ${alice.accessToken}`)
        .send({ text: `message ${i}` });
    }

    const firstPage = await request(app)
      .get(`/api/conversations/${conversationId}/messages?limit=2`)
      .set("Authorization", `Bearer ${alice.accessToken}`);

    expect(firstPage.body.data.items).toHaveLength(2);
    expect(firstPage.body.data.hasMore).toBe(true);
    expect(firstPage.body.data.items[0].text).toBe("message 4"); // newest first

    const secondPage = await request(app)
      .get(
        `/api/conversations/${conversationId}/messages?limit=2&before=${firstPage.body.data.nextCursor}`
      )
      .set("Authorization", `Bearer ${alice.accessToken}`);

    expect(secondPage.body.data.items).toHaveLength(2);
    expect(secondPage.body.data.items[0].text).toBe("message 2");

    const firstIds = firstPage.body.data.items.map((m: any) => m.id);
    const secondIds = secondPage.body.data.items.map((m: any) => m.id);
    expect(firstIds.some((id: string) => secondIds.includes(id))).toBe(false);
  });

  it("adds and removes a reaction", async () => {
    const sendRes = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ text: "react to this" });
    const messageId = sendRes.body.data.id;

    const reactRes = await request(app)
      .post(`/api/messages/${messageId}/reactions`)
      .set("Authorization", `Bearer ${bob.accessToken}`)
      .send({ emoji: "👍" });
    expect(reactRes.body.data.reactions).toEqual([
      expect.objectContaining({ emoji: "👍", count: 1 }),
    ]);

    const unreactRes = await request(app)
      .delete(`/api/messages/${messageId}/reactions/${encodeURIComponent("👍")}`)
      .set("Authorization", `Bearer ${bob.accessToken}`);
    expect(unreactRes.body.data.reactions).toHaveLength(0);
  });
});
