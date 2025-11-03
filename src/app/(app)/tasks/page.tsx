import { Prisma } from "@/generated/prisma/client";
import type { Status } from "@/generated/prisma/enums";

import { TasksClient } from "@/components/tasks/tasks-client";
import { prisma } from "@/server/db";
import { taskFiltersSchema } from "@/lib/validations/task";

type TasksPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const rawStatus = typeof searchParams?.status === "string" ? searchParams.status : null;
  const rawTag = typeof searchParams?.tag === "string" ? searchParams.tag : null;
  const rawQuery = typeof searchParams?.q === "string" ? searchParams.q : null;

  const parsedFilters = taskFiltersSchema.safeParse({
    status: rawStatus && rawStatus !== "ALL" ? rawStatus : undefined,
    tag: rawTag && rawTag !== "ALL" ? rawTag : undefined,
    q: rawQuery ?? undefined,
  });

  const filters = parsedFilters.success ? parsedFilters.data : null;
  const statusFilter = filters?.status;
  const tagFilter = filters?.tag;
  const queryFilter = filters?.q;

  const where: Prisma.TaskWhereInput = {
    ...(statusFilter && { status: statusFilter }),
    ...(tagFilter && { tags: { some: { id: tagFilter } } }),
    ...(queryFilter && {
      OR: [
        { title: { contains: queryFilter, mode: "insensitive" } },
        { description: { contains: queryFilter, mode: "insensitive" } },
      ],
    }),
  };

  const [tasks, tags, statusGroups] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { tags: true },
      orderBy: [
        { dueDate: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.task.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const tasksForClient = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    tags: task.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
  }));

  const tagsForClient = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  }));

  const statusCounts = statusGroups.reduce<Partial<Record<Status, number>>>((acc, group) => {
    acc[group.status as Status] = group._count._all;
    return acc;
  }, {});

  return (
    <TasksClient
      tasks={tasksForClient}
      tags={tagsForClient}
      statusCounts={statusCounts}
    />
  );
}
