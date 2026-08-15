import { z } from "zod";

export const openDirectSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
  }),
});

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    avatar: z.string().url().optional(),
    memberIds: z.array(z.string().min(1)).min(1, "Add at least one member"),
  }),
});

export const updateConversationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    avatar: z.string().url().optional(),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
  }),
});

export const setMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(["ADMIN", "MEMBER"]),
  }),
});
