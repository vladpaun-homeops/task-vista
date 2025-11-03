import { addDays, endOfDay } from "date-fns";

import { TaskSummary } from "@/components/tasks/task-summary";
import { TaskList } from "@/components/tasks/task-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/server/db";
import type { Status } from "@/generated/prisma/enums";

export default async function DashboardPage() {
  const now = new Date();
  const endOfRange = endOfDay(addDays(now, 7));

  const [statusGroups, priorityGroups, dueSoon, overdue, recentUpdates, tags] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: endOfRange,
        },
        status: { not: "DONE" },
      },
      include: { tags: true },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 6,
    }),
    prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
      include: { tags: true },
      orderBy: [{ dueDate: "asc" }],
      take: 6,
    }),
    prisma.task.findMany({
      include: { tags: true },
      orderBy: [{ updatedAt: "desc" }],
      take: 6,
    }),
    prisma.tag.findMany({
      include: { _count: { select: { tasks: true } } },
      orderBy: [{ tasks: { _count: "desc" } }, { name: "asc" }],
      take: 6,
    }),
  ]);

  const statusCounts = statusGroups.reduce<Partial<Record<Status, number>>>((acc, group) => {
    acc[group.status as Status] = group._count._all;
    return acc;
  }, {});

  const priorityCounts = priorityGroups.reduce<Record<string, number>>((acc, group) => {
    acc[group.priority] = group._count._all;
    return acc;
  }, {});

  const mapTasks = (items: typeof dueSoon) =>
    items.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      priority: task.priority,
      status: task.status,
      tags: task.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
    }));

  const dueSoonTasks = mapTasks(dueSoon);
  const overdueTasks = mapTasks(overdue);
  const recentTasks = mapTasks(recentUpdates);
  const popularTags = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    taskCount: tag._count.tasks,
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor upcoming work, overdue items, and recent updates in one place.
        </p>
      </div>

      <TaskSummary counts={statusCounts} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Due soon</CardTitle>
            <CardDescription>
              Tasks scheduled in the next 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList tasks={dueSoonTasks} emptyMessage="No upcoming tasks this week." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By priority</CardTitle>
            <CardDescription>Workload split by priority level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["URGENT", "HIGH", "MEDIUM", "LOW"].map((priority) => (
              <div key={priority} className="flex items-center justify-between text-sm">
                <span>{priority}</span>
                <Badge variant="outline">{priorityCounts[priority] ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
            <CardDescription>Catch up on tasks that slipped past their due date.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList tasks={overdueTasks} emptyMessage="No overdue tasks – nice work!" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Most recently updated tasks across the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList tasks={recentTasks} emptyMessage="No recent updates yet." />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular tags</CardTitle>
          <CardDescription>Top tags by number of associated tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {popularTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet. Create one from the Tags page.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {popularTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-2"
                  style={{ borderColor: tag.color ?? undefined }}
                >
                  <span
                    className="h-2 w-2 rounded-full border"
                    style={{ backgroundColor: tag.color ?? undefined }}
                  />
                  {tag.name}
                  <span className="text-xs text-muted-foreground">
                    {tag.taskCount}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
