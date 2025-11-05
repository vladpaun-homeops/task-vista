import { addDays } from "date-fns";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { prisma } from "@/server/db";
import { Status } from "@/generated/prisma/enums";

export default async function DashboardPage() {
  const now = new Date();
  const soonThreshold = addDays(now, 7);

  const [tasks, tags] = await Promise.all([
    prisma.task.findMany({
      include: { tags: true },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const overdue: typeof tasks = [];
  const dueSoon: typeof tasks = [];
  const backlog: typeof tasks = [];
  const completed: typeof tasks = [];

  for (const task of tasks) {
    if (task.status === Status.DONE) {
      completed.push(task);
      continue;
    }

    if (task.dueDate) {
      if (task.dueDate < now) {
        overdue.push(task);
        continue;
      }

      if (task.dueDate <= soonThreshold) {
        dueSoon.push(task);
        continue;
      }
    }

    backlog.push(task);
  }

  const toClientTask = (task: (typeof tasks)[number]) => ({
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
  });

  const compareByDueDate = (a: (typeof tasks)[number], b: (typeof tasks)[number]) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  };

  const priorityOrder: Record<string, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  const compareByPriority = (a: (typeof tasks)[number], b: (typeof tasks)[number]) => {
    return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
  };

  overdue.sort(compareByDueDate);
  dueSoon.sort(compareByDueDate);
  backlog.sort((a, b) => {
    const priorityDiff = compareByPriority(a, b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.updatedAt.getTime() - b.updatedAt.getTime();
  });
  completed.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const completedLimited = completed.slice(0, 5);

  const tagsForClient = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  }));

  return (
    <DashboardClient
      overdue={overdue.map(toClientTask)}
      dueSoon={dueSoon.map(toClientTask)}
      backlog={backlog.map(toClientTask)}
      completed={completedLimited.map(toClientTask)}
      tags={tagsForClient}
    />
  );
}
