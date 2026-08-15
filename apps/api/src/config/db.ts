import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

export async function connectMongo(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    logger.info({ event: "mongo:connected" }, "MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error({ event: "mongo:error", err }, "MongoDB connection error");
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn({ event: "mongo:disconnected" }, "MongoDB disconnected");
  });

  return mongoose.connect(env.MONGODB_URI);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
