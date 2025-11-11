'use server';

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
import {
  SessionLimitError,
  assertCanCreateTag,
  assertCanUpdateTag,
  getSessionId,
  recordTagCreated,
  recordTagUpdated,
} from "@/server/session";
import {
  tagCreateSchema,
  tagDeleteSchema,
  tagUpdateSchema,
  type TagCreateInput,
  type TagUpdateInput,
} from "@/lib/validations/tag";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function invalidateTagViews() {
  revalidatePath("/tasks");
  revalidatePath("/tags");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function createTagAction(
  input: TagCreateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = tagCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const sessionId = await getSessionId();

  try {
    const tag = await prisma.$transaction(async (tx) => {
      await assertCanCreateTag(tx, sessionId);
      const created = await tx.tag.create({
        data: {
          ...parsed.data,
          sessionId,
        },
        select: { id: true },
      });
      await recordTagCreated(tx, sessionId);
      return created;
    });

    invalidateTagViews();

    return { success: true, data: tag };
  } catch (error) {
    if (error instanceof SessionLimitError) {
      return { success: false, error: error.message };
    }
    console.error("[createTagAction]", error);
    return { success: false, error: "Failed to create tag" };
  }
}

export async function updateTagAction(
  input: TagUpdateInput
): Promise<ActionResult> {
  const parsed = tagUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const sessionId = await getSessionId();

  try {
    await prisma.$transaction(async (tx) => {
      await assertCanUpdateTag(tx, sessionId);

      const tag = await tx.tag.findUnique({
        where: { id: parsed.data.id },
        select: { sessionId: true },
      });

      if (!tag || tag.sessionId !== sessionId) {
        throw new Error("Tag not found");
      }

      await tx.tag.update({
        where: { id: parsed.data.id },
        data: {
          name: parsed.data.name,
          color: parsed.data.color,
        },
      });

      await recordTagUpdated(tx, sessionId);
    });

    invalidateTagViews();

    return { success: true };
  } catch (error) {
    if (error instanceof SessionLimitError) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error && error.message === "Tag not found") {
      return { success: false, error: error.message };
    }
    console.error("[updateTagAction]", error);
    return { success: false, error: "Failed to update tag" };
  }
}

export async function deleteTagAction(
  input: { id: string }
): Promise<ActionResult> {
  const parsed = tagDeleteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const sessionId = await getSessionId();

  try {
    const result = await prisma.tag.deleteMany({
      where: { id: parsed.data.id, sessionId },
    });

    if (result.count === 0) {
      return { success: false, error: "Tag not found" };
    }

    invalidateTagViews();

    return { success: true };
  } catch (error) {
    console.error("[deleteTagAction]", error);
    return { success: false, error: "Failed to delete tag" };
  }
}
