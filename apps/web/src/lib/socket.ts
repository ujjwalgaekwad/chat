import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@chat-platform/shared";
import { useAuthStore } from "../stores/auth.store";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (socket) return socket;

  socket = io("/", {
    autoConnect: false,
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket() {
  socket?.disconnect();
}
