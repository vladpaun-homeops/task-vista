import type { ReactNode } from "react";

import { addDays, differenceInCalendarDays, format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskSummary } from "@/components/tasks/task-summary";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import type { Priority, Status } from "@/generated/prisma/enums";
import { prisma } from "@/server/db";

export default async function ReportsPage() {
  const thirtyDaysAgo = addDays(new Date(), -30);

  const [statusGroups, priorityGroups, tags, completed, overdue] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.task.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.tag.findMany({ include: { _count: { select: { tasks: true } } }, orderBy: { name: "asc" } }),
    prisma.task.findMany({
      where: { status: "DONE", updatedAt: { gte: thirtyDaysAgo } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: { status: { not: "DONE" }, dueDate: { lt: new Date() } },
    }),
  ]);

  const totalTasks = statusGroups.reduce((acc, group) => acc + group._count._all, 0);
  const totalCompleted = completed.length;
  const avgCompletionPerDay = totalCompleted === 0
    ? 0
    : Number((totalCompleted / Math.max(1, differenceInCalendarDays(new Date(), thirtyDaysAgo))).toFixed(2));

  const statusCounts = statusGroups.reduce<Record<Status, number>>((acc, group) => {
    acc[group.status as Status] = group._count._all;
    return acc;
  }, {} as Record<Status, number>);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Reports & Insights</h1>
        <p className="text-muted-foreground">
          Analyze overall status, priority balance, tag distribution, and completion velocity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total tasks</CardTitle>
            <CardDescription>Everything tracked in the workspace right now.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{totalTasks}</p>
            <p className="text-sm text-muted-foreground">Includes active and completed tasks.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed (30 days)</CardTitle>
            <CardDescription>Closed tasks in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{totalCompleted}</p>
            <p className="text-sm text-muted-foreground">≈ {avgCompletionPerDay} per day on average.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
            <CardDescription>Tasks past due that still need attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{overdue.length}</p>
            <p className="text-sm text-muted-foreground">Overdue count as of {format(new Date(), "PPP")}.</p>
          </CardContent>
        </Card>
      </div>

      <TaskSummary counts={statusCounts} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>Distribution of tasks by current status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusGroups.map((group) => (
              <BreakdownRow
                key={group.status}
                label={<TaskStatusBadge status={group.status as Status} />}
                value={group._count._all}
                total={totalTasks}
                tone={statusTone[group.status] ?? "var(--primary)"}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority breakdown</CardTitle>
            <CardDescription>Balance of urgency levels across tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityGroups.map((group) => (
              <BreakdownRow
                key={group.priority}
                label={<TaskPriorityBadge priority={group.priority as Priority} />}
                value={group._count._all}
                total={totalTasks}
                tone={priorityTone[group.priority] ?? "var(--primary)"}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tag distribution</CardTitle>
          <CardDescription>How tags are used across tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            tags.map((tag) => (
              <BreakdownRow
                key={tag.id}
                label={
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full border"
                      style={{ backgroundColor: tag.color ?? undefined }}
                    />
                    {tag.name}
                  </span>
                }
                value={tag._count.tasks}
                total={totalTasks}
                tone={tag.color ?? "var(--primary)"}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  total,
  tone,
}: {
  label: ReactNode;
  value: number;
  total: number;
  tone: string;
}) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-2">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, background: tone }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{percentage}% of total</p>
    </div>
  );
}

const statusTone: Record<string, string> = {
  NOT_STARTED: "linear-gradient(90deg, rgba(148,163,184,0.9), rgba(148,163,184,0.6))",
  IN_PROGRESS: "linear-gradient(90deg, rgba(56,189,248,0.9), rgba(56,189,248,0.5))",
  OVERDUE: "linear-gradient(90deg, rgba(248,113,113,0.9), rgba(248,113,113,0.5))",
  DONE: "linear-gradient(90deg, rgba(34,197,94,0.9), rgba(34,197,94,0.5))",
};

const priorityTone: Record<string, string> = {
  URGENT: "linear-gradient(90deg, rgba(248,113,113,0.9), rgba(248,113,113,0.5))",
  HIGH: "linear-gradient(90deg, rgba(249,115,22,0.9), rgba(249,115,22,0.5))",
  MEDIUM: "linear-gradient(90deg, rgba(251,191,36,0.9), rgba(251,191,36,0.5))",
  LOW: "linear-gradient(90deg, rgba(148,163,184,0.9), rgba(148,163,184,0.5))",
};
