'use server';

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  assertCanCreateTask,
  assertCanUpdateTask,
  getSessionId,
  recordTaskCreated,
  recordTaskUpdated,
  SessionLimitError,
} from "@/server/session";
import {
  taskCreateSchema,
  taskDeleteSchema,
  taskPrioritySchema,
  taskStatusSchema,
  taskUpdateSchema,
  type TaskCreateInput,
  type TaskUpdateInput,
} from "@/lib/validations/task";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type DbClient = Prisma.TransactionClient | typeof prisma;

function toDate(value: TaskCreateInput["dueDate"]) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function normalizeTagIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
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

  const sessionId = await getSessionId();

  try {
    const result = await prisma.$transaction(async (tx) => {
      await assertCanCreateTask(tx, sessionId);
      const tagConnections = await ensureSessionTags(tx, sessionId, parsed.data.tagIds);

      const created = await tx.task.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          dueDate: toDate(parsed.data.dueDate),
          priority: parsed.data.priority,
          status: parsed.data.status,
          sessionId,
          tags: {
            connect: tagConnections,
          },
        },
        select: { id: true },
      });

      await recordTaskCreated(tx, sessionId);
      return created;
    });

    invalidateTaskViews();

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof SessionLimitError) {
      return { success: false, error: error.message };
    }
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

  const sessionId = await getSessionId();

  try {
    await prisma.$transaction(async (tx) => {
      await assertCanUpdateTask(tx, sessionId);
      const tagConnections = await ensureSessionTags(tx, sessionId, parsed.data.tagIds);

      const task = await tx.task.findUnique({
        where: { id: parsed.data.id },
        select: { sessionId: true },
      });

      if (!task || task.sessionId !== sessionId) {
        throw new Error("Task not found for this session");
      }

      await tx.task.update({
        where: { id: parsed.data.id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          dueDate: toDate(parsed.data.dueDate),
          priority: parsed.data.priority,
          status: parsed.data.status,
          tags: {
            set: tagConnections,
          },
        },
      });

      await recordTaskUpdated(tx, sessionId);
    });

    invalidateTaskViews();

    return { success: true };
  } catch (error) {
    if (error instanceof SessionLimitError) {
      return { success: false, error: error.message };
    }
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

  const sessionId = await getSessionId();

  try {
    await prisma.$transaction(async (tx) => {
      await assertCanUpdateTask(tx, sessionId);
      const result = await tx.task.updateMany({
        where: { id: parsed.data.id, sessionId },
        data: { status: parsed.data.status },
      });

      if (result.count === 0) {
        throw new Error("Task not found for this session");
      }

      await recordTaskUpdated(tx, sessionId);
    });

    invalidateTaskViews();

    return { success: true };
  } catch (error) {
    if (error instanceof SessionLimitError) {
      return { success: false, error: error.message };
    }
    console.error("[updateTaskStatusAction]", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function updateTaskPriorityAction(
  input: { id: string; priority: TaskUpdateInput["priority"] }
): Promise<ActionResult> {
  const parsed = taskPrioritySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const sessionId = await getSessionId();

  try {
    await prisma.$transaction(async (tx) => {
      await assertCanUpdateTask(tx, sessionId);
      const result = await tx.task.updateMany({
        where: { id: parsed.data.id, sessionId },
        data: { priority: parsed.data.priority },
      });

      if (result.count === 0) {
        throw new Error("Task not found for this session");
      }

      await recordTaskUpdated(tx, sessionId);
    });

    invalidateTaskViews();

    return { success: true };
  } catch (error) {
    if (error instanceof SessionLimitError) {
      return { success: false, error: error.message };
    }
    console.error("[updateTaskPriorityAction]", error);
    return { success: false, error: "Failed to update priority" };
  }
}

export async function deleteTaskAction(
  input: { id: string }
): Promise<ActionResult> {
  const parsed = taskDeleteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const sessionId = await getSessionId();

  try {
    const result = await prisma.task.deleteMany({
      where: { id: parsed.data.id, sessionId },
    });

    if (result.count === 0) {
      return { success: false, error: "Task not found" };
    }

    invalidateTaskViews();

    return { success: true };
  } catch (error) {
    console.error("[deleteTaskAction]", error);
    return { success: false, error: "Failed to delete task" };
  }
}

async function ensureSessionTags(
  client: DbClient,
  sessionId: string,
  tagIds: string[]
) {
  const ids = normalizeTagIds(tagIds);
  if (ids.length === 0) {
    return [];
  }

  const tags = await client.tag.findMany({
    where: { id: { in: ids }, sessionId },
    select: { id: true },
  });

  if (tags.length !== ids.length) {
    throw new Error("One or more tags are invalid for this session");
  }

  return tags.map((tag) => ({ id: tag.id }));
}
