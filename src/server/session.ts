import { cookies, headers } from "next/headers";
import { cache } from "react";
import { addDays } from "date-fns";

import { prisma } from "@/server/db";
import type { Prisma, Session, Tag } from "@/generated/prisma/client";
import { Priority, Status } from "@/generated/prisma/enums";
import { SESSION_COOKIE_NAME, SESSION_HEADER_NAME } from "@/lib/session-cookie";

export const TASK_CAPACITY_LIMIT = 10;
export const TASK_CREATE_LIMIT = 10;
export const TASK_UPDATE_LIMIT = 50;
export const TAG_CAPACITY_LIMIT = 5;
export const TAG_UPDATE_LIMIT = 10;

const DEFAULT_TAGS = [
  { name: "Work", color: "#0EA5E9" },
  { name: "Home", color: "#22C55E" },
  { name: "Errands", color: "#F97316" },
];

const DEFAULT_TASKS = [
  {
    title: "Submit expense report",
    description: "Upload receipts and send to finance.",
    status: Status.OVERDUE,
    priority: Priority.URGENT,
    dueDateOffsetDays: -2,
    tags: ["Work"],
  },
  {
    title: "Plan sprint demo",
    description: "Outline talking points and share agenda.",
    status: Status.IN_PROGRESS,
    priority: Priority.HIGH,
    dueDateOffsetDays: 4,
    tags: ["Work"],
  },
  {
    title: "Book quarterly sync",
    description: "Coordinate calendar slots with the leadership team.",
    status: Status.NOT_STARTED,
    priority: Priority.MEDIUM,
    dueDateOffsetDays: 24,
    tags: ["Home", "Errands"],
  },
];

type PrismaClientOrTx = Prisma.TransactionClient | typeof prisma;

export class SessionLimitError extends Error {
  constructor(
    public code:
      | "TASK_LIMIT"
      | "TASK_CREATE_LIMIT"
      | "TASK_UPDATE_LIMIT"
      | "TAG_LIMIT"
      | "TAG_UPDATE_LIMIT",
    message: string
  ) {
    super(message);
    this.name = "SessionLimitError";
  }
}

const seedInitialData = async (sessionId: string) => {
  let tagMap = new Map<string, Tag>();
  const existingTags = await prisma.tag.findMany({ where: { sessionId } });

  if (existingTags.length === 0) {
    for (const tag of DEFAULT_TAGS) {
      const created = await prisma.tag.create({
        data: {
          sessionId,
          name: tag.name,
          color: tag.color,
        },
      });
      tagMap.set(tag.name.toLowerCase(), created);
    }
  } else {
    tagMap = new Map(existingTags.map((tag) => [tag.name.toLowerCase(), tag]));
  }

  const existingTasks = await prisma.task.count({ where: { sessionId } });
  if (existingTasks > 0) {
    return;
  }

  const now = new Date();
  for (const task of DEFAULT_TASKS) {
    const dueDate = task.dueDateOffsetDays
      ? addDays(now, task.dueDateOffsetDays)
      : null;

    await prisma.task.create({
      data: {
        sessionId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate,
        tags: {
          connect: task.tags
            .map((name) => tagMap.get(name.toLowerCase()))
            .filter(Boolean)
            .map((tag) => ({ id: (tag as Tag).id })),
        },
      },
    });
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { seededAt: new Date() },
  });
};

async function internalGetOrCreateSession(): Promise<Session> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const pendingHeaderValue = headerStore.get(SESSION_HEADER_NAME) ?? undefined;

  const ensureSession = async (sessionId: string) => {
    return prisma.session.upsert({
      where: { id: sessionId },
      update: {},
      create: { id: sessionId },
    });
  };

  if (cookieValue) {
    return ensureSession(cookieValue);
  }

  if (pendingHeaderValue) {
    return ensureSession(pendingHeaderValue);
  }

  const session = await prisma.session.create({ data: {} });
  await seedInitialData(session.id);
  return session;
}

export const getOrCreateSession = cache(async () => internalGetOrCreateSession());

export const getSessionId = async () => {
  const session = await getOrCreateSession();
  return session.id;
};

async function getSessionForUpdate(
  client: PrismaClientOrTx,
  sessionId: string
) {
  const session = await client.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new Error("Session not found");
  }

  return session;
}

export async function assertCanCreateTask(
  client: PrismaClientOrTx,
  sessionId: string
) {
  const [session, activeTaskCount] = await Promise.all([
    getSessionForUpdate(client, sessionId),
    client.task.count({ where: { sessionId } }),
  ]);

  if (session.taskCreateCount >= TASK_CREATE_LIMIT) {
    throw new SessionLimitError(
      "TASK_CREATE_LIMIT",
      "Create limit reached for this session."
    );
  }

  if (activeTaskCount >= TASK_CAPACITY_LIMIT) {
    throw new SessionLimitError(
      "TASK_LIMIT",
      "Too many tasks in this session. Delete one before adding more."
    );
  }
}

export async function recordTaskCreated(
  client: PrismaClientOrTx,
  sessionId: string
) {
  await client.session.update({
    where: { id: sessionId },
    data: { taskCreateCount: { increment: 1 } },
  });
}

export async function assertCanUpdateTask(
  client: PrismaClientOrTx,
  sessionId: string
) {
  const session = await getSessionForUpdate(client, sessionId);
  if (session.taskUpdateCount >= TASK_UPDATE_LIMIT) {
    throw new SessionLimitError(
      "TASK_UPDATE_LIMIT",
      "Edit limit reached for this session."
    );
  }
}

export async function recordTaskUpdated(
  client: PrismaClientOrTx,
  sessionId: string
) {
  await client.session.update({
    where: { id: sessionId },
    data: { taskUpdateCount: { increment: 1 } },
  });
}

export async function assertCanCreateTag(
  client: PrismaClientOrTx,
  sessionId: string
) {
  const tagCount = await client.tag.count({ where: { sessionId } });
  if (tagCount >= TAG_CAPACITY_LIMIT) {
    throw new SessionLimitError(
      "TAG_LIMIT",
      "Too many tags for this session. Delete one before adding more."
    );
  }
}

export async function recordTagCreated(
  client: PrismaClientOrTx,
  sessionId: string
) {
  await client.session.update({
    where: { id: sessionId },
    data: { tagCreateCount: { increment: 1 } },
  });
}

export async function assertCanUpdateTag(
  client: PrismaClientOrTx,
  sessionId: string
) {
  const session = await getSessionForUpdate(client, sessionId);
  if (session.tagUpdateCount >= TAG_UPDATE_LIMIT) {
    throw new SessionLimitError(
      "TAG_UPDATE_LIMIT",
      "Edit limit reached for tags in this session."
    );
  }
}

export async function recordTagUpdated(
  client: PrismaClientOrTx,
  sessionId: string
) {
  await client.session.update({
    where: { id: sessionId },
    data: { tagUpdateCount: { increment: 1 } },
  });
}
