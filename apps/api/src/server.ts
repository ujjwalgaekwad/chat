import http from "http";
import { createApp } from "./app";
import { createSocketServer } from "./websocket";
import { connectMongo, disconnectMongo } from "./config/db";
import { env } from "./config/env";
import { logger } from "./config/logger";

async function main() {
  await connectMongo();

  const app = createApp();
  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info({ event: "server:listening", port: env.PORT }, `API listening on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ event: "server:shutdown", signal }, "Shutting down gracefully...");
    httpServer.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ event: "server:fatal", err }, "Failed to start server");
  process.exit(1);
});
