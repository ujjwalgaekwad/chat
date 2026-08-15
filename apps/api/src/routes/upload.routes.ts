import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { storageProvider, categoryForMime, ALLOWED_MIME_TYPES } from "../utils/storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

const router = Router();

router.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) throw ApiError.badRequest("NO_FILE", "No file was uploaded");

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw ApiError.badRequest("UNSUPPORTED_FILE_TYPE", `File type ${file.mimetype} is not allowed`);
    }

    const stored = await storageProvider.save({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      category: categoryForMime(file.mimetype),
    });

    res.status(201).json({ success: true, data: stored });
  })
);

export default router;
