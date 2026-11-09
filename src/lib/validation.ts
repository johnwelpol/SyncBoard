import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(64);

export const nameSchema = z.string().trim().min(1).max(100);

export const slugSchema = z
  .string()
  .min(3)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");
