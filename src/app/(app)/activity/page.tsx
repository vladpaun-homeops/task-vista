import { formatDistanceToNow } from "date-fns";

import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/server/db";

export default async function ActivityPage() {
  const events = await prisma.task.findMany({
    include: { tags: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">
          Track the most recent changes made to tasks and their tags.
        </p>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Updates will appear here.</p>
        ) : (
          events.map((task) => (
            <Card key={task.id} className="border">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                  <CardDescription>
                    Updated {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
                  </CardDescription>
                </div>
                <TaskPriorityBadge priority={task.priority} />
              </CardHeader>
              <CardContent className="space-y-3">
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <TaskStatusBadge status={task.status} />
                  {task.dueDate ? (
                    <span>Due {task.dueDate.toLocaleDateString()}</span>
                  ) : (
                    <span>No due date</span>
                  )}
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
