import { z } from "zod";

import { Priority, Status } from "@/generated/prisma/enums";

const statusEnum = z.nativeEnum(Status);
const priorityEnum = z.nativeEnum(Priority);

export const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Keep it under 200 characters"),
  description: z.string().max(2000, "Keep descriptions under 2,000 characters"),
  dueDate: z.date().nullable(),
  priority: priorityEnum,
  status: statusEnum,
  tagIds: z.array(z.string()),
});

export const taskCreateSchema = taskFormSchema;

export const taskUpdateSchema = taskFormSchema.extend({
  id: z.string().cuid(),
});

export const taskStatusSchema = z.object({
  id: z.string().cuid(),
  status: statusEnum,
});

export const taskDeleteSchema = z.object({
  id: z.string().cuid(),
});

export const taskFiltersSchema = z.object({
  status: statusEnum.optional(),
  tag: z.string().cuid().optional(),
  q: z
    .string()
    .max(120, "Query is too long")
    .optional()
    .transform((value) => value?.trim() ?? undefined),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
