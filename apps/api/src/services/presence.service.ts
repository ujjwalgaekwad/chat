import { redis } from "../config/redis";
import { userRepository } from "../repositories/user.repository";

const CONNECTIONS_KEY = (userId: string) => `presence:connections:${userId}`;
const HEARTBEAT_TTL_SECONDS = 60;

export const presenceService = {
  async addConnection(userId: string, socketId: string): Promise<boolean> {
    const key = CONNECTIONS_KEY(userId);
    const countBefore = await redis.scard(key);
    await redis.sadd(key, socketId);
    await redis.expire(key, HEARTBEAT_TTL_SECONDS);
    return countBefore === 0; 
  },

  async removeConnection(userId: string, socketId: string): Promise<boolean> {
    const key = CONNECTIONS_KEY(userId);
    await redis.srem(key, socketId);
    const countAfter = await redis.scard(key);
    if (countAfter === 0) {
      await redis.del(key);
      return true; 
    }
    await redis.expire(key, HEARTBEAT_TTL_SECONDS);
    return false;
  },

  async isOnline(userId: string): Promise<boolean> {
    const key = CONNECTIONS_KEY(userId);
    const count = await redis.scard(key);
    return count > 0;
  },

  async heartbeat(userId: string): Promise<void> {
    await redis.expire(CONNECTIONS_KEY(userId), HEARTBEAT_TTL_SECONDS);
  },

  async syncMongoStatus(userId: string, isOnline: boolean): Promise<void> {
    await userRepository.setOnlineStatus(userId, isOnline);
  },
};
