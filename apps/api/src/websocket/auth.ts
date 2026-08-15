import type { Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { userRepository } from "../repositories/user.repository";

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("UNAUTHORIZED: missing token"));
    }

    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      return next(new Error("UNAUTHORIZED: user not found"));
    }

    socket.data.userId = user._id.toString();
    next();
  } catch {
    next(new Error("UNAUTHORIZED: invalid or expired token"));
  }
}
