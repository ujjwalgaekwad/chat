import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@chat-platform/shared";
import { messageService } from "../services/message.service";
import { conversationService } from "../services/conversation.service";
import { conversationRepository } from "../repositories/conversation.repository";
import { logger } from "../config/logger";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerConversationHandlers(_io: AppServer, socket: AppSocket) {
  socket.on("conversation:join", async ({ conversationId }) => {
    const isMember = await conversationRepository.isMember(conversationId, socket.data.userId);
    if (!isMember) return;
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("conversation:leave", ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
  });
}

export function registerMessageHandlers(io: AppServer, socket: AppSocket) {
  const userId = socket.data.userId;

  socket.on("message:send", async (data) => {
    try {
      const message = await messageService.send(data.conversationId, userId, {
        text: data.text,
        attachments: data.attachments,
        replyTo: data.replyTo,
      });

      socket.emit("message:ack", { clientTempId: data.clientTempId, message });
      socket.to(`conversation:${data.conversationId}`).emit("message:new", message);

      const room = io.sockets.adapter.rooms.get(`conversation:${data.conversationId}`);
      const viewerCount = room?.size ?? 0;
      if (viewerCount <= 1) {
        io.to(`conversation:${data.conversationId}`).emit("notification:new", {
          conversationId: data.conversationId,
          messageId: message.id,
          preview: message.text ?? "Sent an attachment",
        });
      }
    } catch (err) {
      logger.warn({ event: "message:send:failed", err, userId }, "message send failed");
      socket.emit("message:failed", {
        clientTempId: data.clientTempId,
        reason: err instanceof Error ? err.message : "Failed to send message",
      });
    }
  });

  socket.on("message:edit", async ({ messageId, text }) => {
    try {
      const message = await messageService.edit(messageId, userId, text);
      io.to(`conversation:${message.conversationId}`).emit("message:update", message);
    } catch (err) {
      socket.emit("error", {
        code: "MESSAGE_EDIT_FAILED",
        message: err instanceof Error ? err.message : "Failed to edit message",
      });
    }
  });

  socket.on("message:delete", async ({ messageId }) => {
    try {
      const message = await messageService.remove(messageId, userId);
      io.to(`conversation:${message.conversationId}`).emit("message:delete", {
        messageId: message.id,
        conversationId: message.conversationId,
      });
    } catch (err) {
      socket.emit("error", {
        code: "MESSAGE_DELETE_FAILED",
        message: err instanceof Error ? err.message : "Failed to delete message",
      });
    }
  });

  socket.on("message:react", async ({ messageId, emoji }) => {
    try {
      const message = await messageService.react(messageId, userId, emoji);
      io.to(`conversation:${message.conversationId}`).emit("message:reaction_update", {
        messageId: message.id,
        conversationId: message.conversationId,
        reactions: message.reactions,
      });
    } catch {
      console.error("Reactions are low-stakes; fail silently rather than surfacing a toast");
    }
  });

  socket.on("message:unreact", async ({ messageId, emoji }) => {
    try {
      const message = await messageService.unreact(messageId, userId, emoji);
      io.to(`conversation:${message.conversationId}`).emit("message:reaction_update", {
        messageId: message.id,
        conversationId: message.conversationId,
        reactions: message.reactions,
      });
    } catch {
      console.error("Same as above.");
    }
  });

  socket.on("message:read", async ({ conversationId, messageId }) => {
    try {
      const member = await conversationService.markRead(conversationId, userId);
      if (member) {
        io.to(`conversation:${conversationId}`).emit("conversation:read", {
          conversationId,
          userId,
          lastReadAt: member.lastReadAt ?? new Date().toISOString(),
        });
      }
      void messageId;
    } catch (err) {
      logger.warn({ event: "message:read:failed", err, userId }, "mark-read failed");
    }
  });
}
