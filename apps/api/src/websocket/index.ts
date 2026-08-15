import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@chat-platform/shared";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { redisPubClient, redisSubClient } from "../config/redis";
import { socketAuthMiddleware } from "./auth";
import { handleConnect, handleDisconnect } from "./presence";
import { registerTypingHandlers } from "./typing";
import { registerConversationHandlers, registerMessageHandlers } from "./message";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    pingInterval: 20000,
    pingTimeout: 20000,
  });

  io.adapter(createAdapter(redisPubClient, redisSubClient));

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    handleConnect(io, socket).catch((err) =>
      logger.error({ event: "socket:connect:error", err }, "failed to handle connect")
    );

    registerConversationHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);

    socket.on("disconnect", () => {
      handleDisconnect(io, socket).catch((err) =>
        logger.error({ event: "socket:disconnect:error", err }, "failed to handle disconnect")
      );
    });
  });

  return io;
}
