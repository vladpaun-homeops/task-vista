import { format } from "date-fns";

import type { Priority, Status } from "@/generated/prisma/enums";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";

type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: Priority;
  status: Status;
  tags: { id: string; name: string; color: string | null }[];
};

type TaskListProps = {
  tasks: TaskListItem[];
  emptyMessage?: string;
};

export function TaskList({ tasks, emptyMessage = "Nothing to show." }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="border px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium leading-tight">{task.title}</p>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <TaskStatusBadge status={task.status} />
                {task.dueDate ? (
                  <span>Due {format(new Date(task.dueDate), "MMM d")}</span>
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
            </div>
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </Card>
      ))}
    </div>
  );
}
