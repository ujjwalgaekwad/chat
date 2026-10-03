import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { env } from "../config/env";
import { uploadToCloudinary } from "../services/cloudinary.service";

export interface StoredFile {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  thumbnailUrl: string | null;
}

export interface StorageProvider {
  save(file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    category: "images" | "videos" | "documents" | "audio";
  }): Promise<StoredFile>;
}

function categoryDir(category: string): string {
  return path.join(env.UPLOAD_DIR, category);
}

export class LocalDiskStorageProvider implements StorageProvider {
  async save(file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    category: "images" | "videos" | "documents" | "audio";
  }): Promise<StoredFile> {
    const result = await uploadToCloudinary(file.buffer, {
      folder: `chat-platform/${file.category}`,
    })
    const dir = categoryDir(file.category);
    fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(file.originalName) || "";
    const safeName = `${randomUUID()}${ext}`;
    const fullPath = path.join(dir, safeName);
    fs.writeFileSync(fullPath, file.buffer);

    return {
      url: (result as { secure_url: string }).secure_url,
      fileName: file.originalName,
      mimeType: file.mimeType,
      size: file.buffer.length,
      thumbnailUrl: null,
    };
  }
}

export const storageProvider: StorageProvider = new LocalDiskStorageProvider();

export function categoryForMime(mime: string): "images" | "videos" | "documents" | "audio" {
  if (mime.startsWith("image/")) return "images";
  if (mime.startsWith("video/")) return "videos";
  if (mime.startsWith("audio/")) return "audio";
  return "documents";
}

export const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/plain",
]);
