import { z } from "zod";

const hexColorRegex = /^#([0-9a-fA-F]{6})$/;

export const tagFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(32, "Keep tag names under 32 characters")
    .transform((value) => value.trim()),
  color: z
    .string()
    .regex(hexColorRegex, "Choose a valid HEX color"),
});

export const tagCreateSchema = tagFormSchema;

export const tagUpdateSchema = tagFormSchema.extend({
  id: z.string().cuid(),
});

export const tagDeleteSchema = z.object({
  id: z.string().cuid(),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;
export type TagCreateInput = z.infer<typeof tagCreateSchema>;
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;
