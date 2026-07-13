import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase().transform((v) => v.trim()),
  password: z.string().min(12).max(128),
  nickname: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().transform((v) => v.trim()),
  password: z.string().max(128),
  csrfToken: z.string().max(255),
});

export const childProfileSchema = z.object({
  nickname: z.string().min(1).max(50).trim(),
  age: z.coerce.number().int().min(0).max(17),
  avatar: z.string().max(255).optional(),
});
