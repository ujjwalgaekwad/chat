import { describe, it, expect, beforeEach, afterEach } from "vitest";
import http from "http";
import type { AddressInfo } from "net";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import request from "supertest";
import { createApp } from "../app";
import { createSocketServer } from "../websocket";

async function registerUser(app: ReturnType<typeof createApp>, email: string) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: email.split("@")[0], email, password: "SuperSecret123!", confirmPassword: "SuperSecret123!" });
  return { userId: res.body.data.user.id as string, accessToken: res.body.data.accessToken as string };
}

function connectClient(port: number, token: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

describe("WebSocket", () => {
  let server: http.Server;
  let port: number;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    app = createApp();
    server = http.createServer(app);
    createSocketServer(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("rejects a connection without a valid access token", async () => {
    await expect(
      new Promise((resolve, reject) => {
        const socket = ioClient(`http://127.0.0.1:${port}`, {
          transports: ["websocket"],
          reconnection: false,
        });
        socket.on("connect", () => reject(new Error("should not connect")));
        socket.on("connect_error", resolve);
      })
    ).resolves.toBeTruthy();
  });

  it("accepts a connection with a valid access token", async () => {
    const alice = await registerUser(app, "alice@example.com");
    const socket = await connectClient(port, alice.accessToken);
    expect(socket.connected).toBe(true);
    socket.disconnect();
  });

  it("broadcasts typing:update to other members of the conversation", async () => {
    const alice = await registerUser(app, "alice@example.com");
    const bob = await registerUser(app, "bob@example.com");

    const convo = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ userId: bob.userId });
    const conversationId = convo.body.data.id;

    const aliceSocket = await connectClient(port, alice.accessToken);
    const bobSocket = await connectClient(port, bob.accessToken);

    const typingUpdate = new Promise((resolve) => {
      bobSocket.on("typing:update", resolve);
    });

    aliceSocket.emit("typing:start", { conversationId });

    const update: any = await typingUpdate;
    expect(update.userId).toBe(alice.userId);
    expect(update.isTyping).toBe(true);

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });

  it("broadcasts a new message in real time and acknowledges the sender", async () => {
    const alice = await registerUser(app, "alice@example.com");
    const bob = await registerUser(app, "bob@example.com");

    const convo = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ userId: bob.userId });
    const conversationId = convo.body.data.id;

    const aliceSocket = await connectClient(port, alice.accessToken);
    const bobSocket = await connectClient(port, bob.accessToken);

    const received = new Promise((resolve) => bobSocket.on("message:new", resolve));
    const acked = new Promise((resolve) => aliceSocket.on("message:ack", resolve));

    aliceSocket.emit("message:send", {
      conversationId,
      text: "Hello over sockets",
      clientTempId: "temp-1",
    });

    const [newMessage, ack]: any = await Promise.all([received, acked]);
    expect(newMessage.text).toBe("Hello over sockets");
    expect(newMessage.senderId).toBe(alice.userId);
    expect(ack.clientTempId).toBe("temp-1");
    expect(ack.message.id).toBe(newMessage.id);

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });

  it("marks a user online then offline as sockets connect/disconnect", async () => {
    const alice = await registerUser(app, "alice@example.com");
    const bob = await registerUser(app, "bob@example.com");
    await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${bob.accessToken}`)
      .send({ userId: alice.userId });

    const bobSocket = await connectClient(port, bob.accessToken);
    const onlineUpdate = new Promise((resolve) => bobSocket.on("presence:update", resolve));

    const aliceSocket = await connectClient(port, alice.accessToken);
    const online: any = await onlineUpdate;
    expect(online.userId).toBe(alice.userId);
    expect(online.isOnline).toBe(true);

    const offlineUpdate = new Promise((resolve) => bobSocket.on("presence:update", resolve));
    aliceSocket.disconnect();
    const offline: any = await offlineUpdate;
    expect(offline.userId).toBe(alice.userId);
    expect(offline.isOnline).toBe(false);

    bobSocket.disconnect();
  });
});
