import { addDays } from "date-fns";

import { Prisma } from "@/generated/prisma/client";
import { Status } from "@/generated/prisma/enums";
import type { Status as StatusType } from "@/generated/prisma/enums";

import { TasksClient } from "@/components/tasks/tasks-client";
import { prisma } from "@/server/db";
import { taskFiltersSchema } from "@/lib/validations/task";

type TasksPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const rawStatus =
    typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : null;
  const rawTag = typeof resolvedSearchParams?.tag === "string" ? resolvedSearchParams.tag : null;
  const rawQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : null;
  const rawView = typeof resolvedSearchParams?.view === "string" ? resolvedSearchParams.view : null;

  const parsedFilters = taskFiltersSchema.safeParse({
    status: rawStatus && rawStatus !== "ALL" ? rawStatus : undefined,
    tag: rawTag && rawTag !== "ALL" ? rawTag : undefined,
    q: rawQuery ?? undefined,
    view: rawView && rawView !== "ALL" ? rawView : undefined,
  });

  const filters = parsedFilters.success ? parsedFilters.data : null;
  const statusFilter = filters?.status;
  const tagFilter = filters?.tag;
  const queryFilter = filters?.q;
  const viewFilter = filters?.view;

  const now = new Date();
  const soonThreshold = addDays(now, 7);

  let viewWhere: Prisma.TaskWhereInput | undefined;

  switch (viewFilter) {
    case "overdue":
      viewWhere = {
        OR: [
          {
            status: { not: Status.DONE },
            dueDate: { lt: now },
          },
          { status: Status.OVERDUE },
        ],
      };
      break;
    case "due-soon":
      viewWhere = {
        status: { not: Status.DONE },
        dueDate: { gte: now, lte: soonThreshold },
      };
      break;
    case "no-due":
      viewWhere = {
        dueDate: null,
      };
      break;
    case "completed":
      viewWhere = {
        status: Status.DONE,
      };
      break;
    default:
      viewWhere = undefined;
  }

  const where: Prisma.TaskWhereInput = {
    ...(statusFilter && { status: statusFilter }),
    ...(tagFilter && { tags: { some: { id: tagFilter } } }),
    ...(queryFilter && {
      OR: [
        { title: { contains: queryFilter, mode: "insensitive" } },
        { description: { contains: queryFilter, mode: "insensitive" } },
      ],
    }),
    ...(viewWhere ?? {}),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput[] = viewFilter === "completed"
    ? [{ updatedAt: "desc" }, { title: "asc" }]
    : [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }];

  const [tasks, tags, statusGroups] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { tags: true },
      orderBy,
    }),
    prisma.tag.findMany({
      include: { _count: { select: { tasks: true } } },
      orderBy: [{ tasks: { _count: "desc" } }, { name: "asc" }],
    }) as Promise<
      Array<{ id: string; name: string; color: string; _count: { tasks: number } }>
    >,
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
    usageCount: tag._count.tasks,
  }));

  const statusCounts = statusGroups.reduce<Partial<Record<StatusType, number>>>((acc, group) => {
    acc[group.status as StatusType] = group._count._all;
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
