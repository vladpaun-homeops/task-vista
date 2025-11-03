import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Clock3, ExternalLink } from "lucide-react";

import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskTagPill } from "@/components/tasks/task-tag-pill";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/server/db";
import { Status } from "@/generated/prisma/enums";
import { TaskSummary } from "@/components/tasks/task-summary";

export default async function ActivityPage() {
  const tasks = await prisma.task.findMany({
    include: { tags: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 30,
  });

  const statusCounts = tasks.reduce<Record<Status, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {} as Record<Status, number>);

  const overdueCount = tasks.filter((task) => task.dueDate && task.dueDate < new Date() && task.status !== Status.DONE).length;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">
          Review recent edits, prioritise overdue work, and jump directly into task details.
        </p>
      </header>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Snapshot</CardTitle>
            <CardDescription>Recent updates across your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TaskSummary counts={statusCounts} />
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Updated in last 30 changes: {tasks.length}
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Overdue still open: {overdueCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Latest updates</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Updates will appear here.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 hidden h-full border-l border-border sm:block" />
            <ul className="space-y-6 pl-0 sm:pl-6">
              {tasks.map((task) => (
                <li key={task.id} className="relative">
                  <div className="sm:absolute sm:-left-[6px] sm:top-1 hidden h-3 w-3 rounded-full border-2 border-background bg-primary sm:block" />
                  <Card className="sm:ml-6">
                    <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold text-foreground">
                          {task.title}
                        </CardTitle>
                        <CardDescription>
                          Updated {format(task.updatedAt, "MMM d, yyyy • h:mm a")}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <TaskPriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag) => (
                          <TaskTagPill key={tag.id} name={tag.name} color={tag.color} />
                        ))}
                        {task.tags.length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            No tags
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {task.dueDate ? `Due ${format(task.dueDate, "MMM d, yyyy")}` : "No due date"}
                        </span>
                        <ButtonLink href={`/tasks/${task.id}`}>Open task</ButtonLink>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );
}
