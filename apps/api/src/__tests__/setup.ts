import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET = "test_access_secret_please_ignore_me";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret_please_ignore_me";
  process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
