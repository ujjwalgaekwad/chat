import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be set and reasonably long"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be set and reasonably long"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  CLOUDINARY_NAME: z.string().min(1, "Cloudinary name is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "Cloudinary API key is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "Cloudinary API secret is required"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  COOKIE_SECRET: z.string().default("dev-cookie-secret"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
