import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

function retryStrategy(attempt: number): number {
  return Math.min(attempt * 500, 5000);
}

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy,
  lazyConnect: false,
});

export const redisPubClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy,
});

export const redisSubClient = redisPubClient.duplicate({ enableReadyCheck: false });

for (const [name, client] of [
  ["main", redis],
  ["pub", redisPubClient],
  ["sub", redisSubClient],
] as const) {
  client.on("error", (err) => logger.error({ event: "redis:error", client: name, err }, "Redis error"));
  client.on("connect", () => logger.info({ event: "redis:connected", client: name }, "Redis connected"));
}
