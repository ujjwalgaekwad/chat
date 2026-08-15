import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@chat-platform/shared";
import { presenceService } from "../services/presence.service";
import { conversationRepository } from "../repositories/conversation.repository";
import { logger } from "../config/logger";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

async function broadcastPresence(io: AppServer, userId: string, isOnline: boolean) {
  const { conversations } = await conversationRepository.findForUser(userId);
  const lastSeenAt = isOnline ? null : new Date().toISOString();
  for (const conversation of conversations) {
    io.to(`conversation:${conversation._id.toString()}`).emit("presence:update", {
      userId,
      isOnline,
      lastSeenAt,
    });
  }
}

export async function handleConnect(io: AppServer, socket: AppSocket) {
  const userId = socket.data.userId;
  const justCameOnline = await presenceService.addConnection(userId, socket.id);
  
  const { conversations } = await conversationRepository.findForUser(userId);
  for (const conversation of conversations) {
    socket.join(`conversation:${conversation._id.toString()}`);
  }

  if (justCameOnline) {
    await presenceService.syncMongoStatus(userId, true);
    await broadcastPresence(io, userId, true);
  }

  logger.debug({ event: "socket:connect", userId, socketId: socket.id }, "socket connected");
}

export async function handleDisconnect(io: AppServer, socket: AppSocket) {
  const userId = socket.data.userId;
  const wentOffline = await presenceService.removeConnection(userId, socket.id);

  if (wentOffline) {
    await presenceService.syncMongoStatus(userId, false);
    await broadcastPresence(io, userId, false);
  }

  logger.debug({ event: "socket:disconnect", userId, socketId: socket.id }, "socket disconnected");
}
