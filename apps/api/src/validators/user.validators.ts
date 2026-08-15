import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    avatar: z.string().url().nullable().optional(),
    status: z.string().max(100).nullable().optional(),
  }),
});

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().trim().min(1).max(100),
  }),
});
