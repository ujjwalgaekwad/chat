import { z } from "zod";

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(200),
      password: z.string().min(8).max(128),
      confirmPassword: z.string().min(8).max(128),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
