import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@chat-platform/shared";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const TYPING_AUTO_STOP_MS = 5000;
const typingTimers = new Map<string, NodeJS.Timeout>();

function timerKey(conversationId: string, userId: string) {
  return `${conversationId}:${userId}`;
}

export function registerTypingHandlers(io: AppServer, socket: AppSocket) {
  const userId = socket.data.userId;

  socket.on("typing:start", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("typing:update", {
      conversationId,
      userId,
      isTyping: true,
    });

    const key = timerKey(conversationId, userId);
    const existing = typingTimers.get(key);
    if (existing) clearTimeout(existing);
    typingTimers.set(
      key,
      setTimeout(() => {
        socket.to(`conversation:${conversationId}`).emit("typing:update", {
          conversationId,
          userId,
          isTyping: false,
        });
        typingTimers.delete(key);
      }, TYPING_AUTO_STOP_MS)
    );
  });

  socket.on("typing:stop", ({ conversationId }) => {
    const key = timerKey(conversationId, userId);
    const existing = typingTimers.get(key);
    if (existing) {
      clearTimeout(existing);
      typingTimers.delete(key);
    }
    socket.to(`conversation:${conversationId}`).emit("typing:update", {
      conversationId,
      userId,
      isTyping: false,
    });
  });
}
