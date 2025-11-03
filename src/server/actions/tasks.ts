'use server';

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
import {
  taskCreateSchema,
  taskDeleteSchema,
  taskStatusSchema,
  taskUpdateSchema,
  type TaskCreateInput,
  type TaskUpdateInput,
} from "@/lib/validations/task";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function toDate(value: TaskCreateInput["dueDate"]) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function normalizeTagIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean))).map((id) => ({ id }));
}

function invalidateTaskViews() {
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/reports");
}

export async function createTaskAction(
  input: TaskCreateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = taskCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    const result = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        dueDate: toDate(parsed.data.dueDate),
        priority: parsed.data.priority,
        status: parsed.data.status,
        tags: {
          connect: normalizeTagIds(parsed.data.tagIds),
        },
      },
      select: { id: true },
    });

    invalidateTaskViews();

    return { success: true, data: result };
  } catch (error) {
    console.error("[createTaskAction]", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTaskAction(
  input: TaskUpdateInput
): Promise<ActionResult> {
  const parsed = taskUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    await prisma.task.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        dueDate: toDate(parsed.data.dueDate),
        priority: parsed.data.priority,
        status: parsed.data.status,
        tags: {
          set: normalizeTagIds(parsed.data.tagIds),
        },
      },
    });

    invalidateTaskViews();

    return { success: true };
  } catch (error) {
    console.error("[updateTaskAction]", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function updateTaskStatusAction(
  input: { id: string; status: TaskUpdateInput["status"] }
): Promise<ActionResult> {
  const parsed = taskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    await prisma.task.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    invalidateTaskViews();

    return { success: true };
  } catch (error) {
    console.error("[updateTaskStatusAction]", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteTaskAction(
  input: { id: string }
): Promise<ActionResult> {
  const parsed = taskDeleteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    await prisma.task.delete({
      where: { id: parsed.data.id },
    });

    invalidateTaskViews();

    return { success: true };
  } catch (error) {
    console.error("[deleteTaskAction]", error);
    return { success: false, error: "Failed to delete task" };
  }
}
