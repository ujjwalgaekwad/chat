import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";
import uploadRoutes from "./routes/upload.routes";
import searchRoutes from "./routes/search.routes";

export function createApp(): Express {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers["x-request-id"] as string) || randomUUID(),
      autoLogging: { ignore: (req) => req.url === "/health" },
    })
  );

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_SECRET));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.use("/uploads", express.static(env.UPLOAD_DIR));
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/search", searchRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
