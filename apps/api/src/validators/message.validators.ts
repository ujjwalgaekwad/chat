import { z } from "zod";

const attachmentSchema = z.object({
  url: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().nonnegative(),
  thumbnailUrl: z.string().nullable().optional(),
});

export const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().max(8000).optional(),
    attachments: z.array(attachmentSchema).max(10).optional(),
    replyTo: z.string().nullable().optional(),
  }),
});

export const editMessageSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(8000),
  }),
});

export const listMessagesQuerySchema = z.object({
  query: z.object({
    before: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const reactionSchema = z.object({
  body: z.object({
    emoji: z.string().min(1).max(8),
  }),
});
