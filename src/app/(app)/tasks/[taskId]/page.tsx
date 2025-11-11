import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskDetailEditor } from "@/components/tasks/task-detail-editor";
import { prisma } from "@/server/db";
import { getSessionId } from "@/server/session";

type TaskDetailPageProps = {
  params: {
    taskId: string;
  };
};

export const metadata: Metadata = {
  title: "Task details",
  description: "Inspect and edit a single TaskVista task.",
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const sessionId = await getSessionId();
  const task = await prisma.task.findFirst({
    where: { id: params.taskId, sessionId },
    include: { tags: true },
  });

  if (!task) {
    notFound();
  }

  const tags = await prisma.tag.findMany({
    where: { sessionId },
    orderBy: { name: "asc" },
  });

  const tagOptions = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{task.title}</h1>
        <p className="text-muted-foreground">Review and edit this task&apos;s details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Overview</CardTitle>
              <CardDescription>Context and metadata for this task.</CardDescription>
            </div>
            <TaskPriorityBadge priority={task.priority} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <TaskStatusBadge status={task.status} />
              {task.dueDate ? (
                <span>Due {task.dueDate.toLocaleDateString()}</span>
              ) : (
                <span>No due date</span>
              )}
              <span>Created {task.createdAt.toLocaleDateString()}</span>
              <span>Updated {task.updatedAt.toLocaleDateString()}</span>
            </div>

            {task.description ? (
              <p className="text-sm leading-relaxed text-foreground/90">{task.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No description provided.</p>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold">Tags</p>
              {task.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{ borderColor: tag.color ?? undefined }}
                    >
                      <span
                        className="h-2 w-2 rounded-full border"
                        style={{ backgroundColor: tag.color ?? undefined }}
                      />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <TaskDetailEditor
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            priority: task.priority,
            status: task.status,
            tagIds: task.tags.map((tag) => tag.id),
          }}
          tags={tagOptions}
        />
      </div>
    </div>
  );
}
