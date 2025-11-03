'use server';

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
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

  try {
    const tag = await prisma.tag.create({
      data: parsed.data,
      select: { id: true },
    });

    invalidateTagViews();

    return { success: true, data: tag };
  } catch (error) {
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

  try {
    await prisma.tag.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
      },
    });

    invalidateTagViews();

    return { success: true };
  } catch (error) {
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

  try {
    await prisma.tag.delete({
      where: { id: parsed.data.id },
    });

    invalidateTagViews();

    return { success: true };
  } catch (error) {
    console.error("[deleteTagAction]", error);
    return { success: false, error: "Failed to delete tag" };
  }
}
