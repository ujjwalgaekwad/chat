import { describe, it, expect } from "vitest";
import { conversationService } from "../services/conversation.service";
import { messageService } from "../services/message.service";
import { userRepository } from "../repositories/user.repository";
import { hashPassword } from "../utils/password";
import { ApiError } from "../utils/ApiError";

async function makeUser(email: string, name = "User") {
  const passwordHash = await hashPassword("Password123!");
  const user = await userRepository.create({ name, email, passwordHash });
  return user._id.toString();
}

describe("conversationService", () => {
  it("creates a direct conversation between two users", async () => {
    const a = await makeUser("a@example.com", "Alice");
    const b = await makeUser("b@example.com", "Bob");

    const convo = await conversationService.openDirect(a, b);
    expect(convo.type).toBe("DIRECT");
    expect(convo.members.map((m) => m.userId).sort()).toEqual([a, b].sort());
  });

  it("never creates duplicate direct conversations between the same two users", async () => {
    const a = await makeUser("a2@example.com", "Alice");
    const b = await makeUser("b2@example.com", "Bob");

    const first = await conversationService.openDirect(a, b);
    const second = await conversationService.openDirect(b, a);

    expect(second.id).toBe(first.id);
  });

  it("rejects opening a direct conversation with yourself", async () => {
    const a = await makeUser("solo@example.com", "Solo");
    await expect(conversationService.openDirect(a, a)).rejects.toThrow(ApiError);
  });

  it("creates a group with the creator as OWNER", async () => {
    const owner = await makeUser("owner@example.com", "Owner");
    const member = await makeUser("member@example.com", "Member");

    const group = await conversationService.createGroup(owner, {
      name: "Engineering",
      memberIds: [member],
    });

    expect(group.type).toBe("GROUP");
    const ownerMembership = group.members.find((m) => m.userId === owner);
    expect(ownerMembership?.role).toBe("OWNER");
    expect(group.members).toHaveLength(2);
  });

  it("allows an admin to add a member, but not a plain member", async () => {
    const owner = await makeUser("owner2@example.com", "Owner");
    const admin = await makeUser("admin2@example.com", "Admin");
    const plainMember = await makeUser("plain2@example.com", "Plain");
    const newcomer = await makeUser("newcomer2@example.com", "New");

    const group = await conversationService.createGroup(owner, {
      name: "Ops",
      memberIds: [admin, plainMember],
    });

    const { conversationRepository } = await import("../repositories/conversation.repository");
    await conversationRepository.setMemberRole(group.id, admin, "ADMIN");

    const afterAdminAdd = await conversationService.addMember(group.id, admin, newcomer);
    expect(afterAdminAdd.members.some((m) => m.userId === newcomer)).toBe(true);

    await expect(
      conversationService.addMember(group.id, plainMember, "someone-else")
    ).rejects.toThrow(ApiError);
  });

  it("rejects access to a conversation for a non-member", async () => {
    const a = await makeUser("a3@example.com", "Alice");
    const b = await makeUser("b3@example.com", "Bob");
    const stranger = await makeUser("stranger3@example.com", "Stranger");

    const convo = await conversationService.openDirect(a, b);
    await expect(conversationService.getById(convo.id, stranger)).rejects.toThrow(ApiError);
  });
});

describe("messageService", () => {
  it("sends a message and updates the conversation's lastMessage", async () => {
    const a = await makeUser("m1@example.com", "Alice");
    const b = await makeUser("m2@example.com", "Bob");
    const convo = await conversationService.openDirect(a, b);

    const message = await messageService.send(convo.id, a, { text: "Hello everyone" });
    expect(message.text).toBe("Hello everyone");
    expect(message.senderId).toBe(a);

    const refreshed = await conversationService.getById(convo.id, a);
    expect(refreshed.lastMessage?.text).toBe("Hello everyone");
  });

  it("rejects sending an empty message with no attachments", async () => {
    const a = await makeUser("m3@example.com", "Alice");
    const b = await makeUser("m4@example.com", "Bob");
    const convo = await conversationService.openDirect(a, b);

    await expect(messageService.send(convo.id, a, {})).rejects.toThrow(ApiError);
  });

  it("rejects sending from a user who is not a conversation member", async () => {
    const a = await makeUser("m5@example.com", "Alice");
    const b = await makeUser("m6@example.com", "Bob");
    const stranger = await makeUser("m7@example.com", "Stranger");
    const convo = await conversationService.openDirect(a, b);

    await expect(
      messageService.send(convo.id, stranger, { text: "sneaky" })
    ).rejects.toThrow(ApiError);
  });

  it("paginates messages with a stable cursor", async () => {
    const a = await makeUser("p1@example.com", "Alice");
    const b = await makeUser("p2@example.com", "Bob");
    const convo = await conversationService.openDirect(a, b);

    for (let i = 0; i < 5; i++) {
      await messageService.send(convo.id, a, { text: `message ${i}` });
    }

    const firstPage = await messageService.getPage(convo.id, a, undefined, 2);
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await messageService.getPage(convo.id, a, firstPage.nextCursor!, 2);
    expect(secondPage.items).toHaveLength(2);

    const firstIds = new Set(firstPage.items.map((m) => m.id));
    for (const item of secondPage.items) {
      expect(firstIds.has(item.id)).toBe(false);
    }
  });

  it("only allows the sender to edit their own message", async () => {
    const a = await makeUser("e1@example.com", "Alice");
    const b = await makeUser("e2@example.com", "Bob");
    const convo = await conversationService.openDirect(a, b);
    const message = await messageService.send(convo.id, a, { text: "original" });

    await expect(messageService.edit(message.id, b, "hacked")).rejects.toThrow(ApiError);

    const edited = await messageService.edit(message.id, a, "edited text");
    expect(edited.text).toBe("edited text");
    expect(edited.editedAt).toBeTruthy();
  });

  it("soft-deletes a message and clears its content", async () => {
    const a = await makeUser("d1@example.com", "Alice");
    const b = await makeUser("d2@example.com", "Bob");
    const convo = await conversationService.openDirect(a, b);
    const message = await messageService.send(convo.id, a, { text: "to be deleted" });

    const deleted = await messageService.remove(message.id, a);
    expect(deleted.deletedAt).toBeTruthy();
    expect(deleted.text).toBeNull();
  });
});
