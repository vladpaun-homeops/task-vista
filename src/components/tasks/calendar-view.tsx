'use client';

import * as React from "react";
import { format, isSameDay, parseISO } from "date-fns";

import type { Priority, Status } from "@/generated/prisma/enums";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";

type CalendarTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: Priority;
  status: Status;
  tags: { id: string; name: string; color: string | null }[];
};

type CalendarViewProps = {
  tasks: CalendarTask[];
};

export function CalendarView({ tasks }: CalendarViewProps) {
  const tasksWithDueDates = React.useMemo(
    () => tasks.filter((task) => !!task.dueDate),
    [tasks]
  );

  const defaultSelected = React.useMemo(() => {
    const today = new Date();
    const todayTask = tasksWithDueDates.find((task) =>
      isSameDay(parseISO(task.dueDate as string), today)
    );

    if (todayTask) {
      return parseISO(todayTask.dueDate as string);
    }

    if (tasksWithDueDates.length > 0) {
      return parseISO(tasksWithDueDates[0].dueDate as string);
    }

    return today;
  }, [tasksWithDueDates]);

  const [selectedDate, setSelectedDate] = React.useState<Date>(defaultSelected);

  const tasksForSelectedDate = React.useMemo(() => {
    return tasksWithDueDates.filter((task) =>
      isSameDay(parseISO(task.dueDate as string), selectedDate)
    );
  }, [selectedDate, tasksWithDueDates]);

  const noDueDateTasks = React.useMemo(
    () => tasks.filter((task) => !task.dueDate),
    [tasks]
  );

  const modifierDates = React.useMemo(() => {
    const map = new Map<string, { status: Status; date: Date }>();
    tasksWithDueDates.forEach((task) => {
      if (!task.dueDate) return;
      const date = parseISO(task.dueDate);
      const key = date.toDateString();
      if (!map.has(key)) {
        map.set(key, { status: task.status, date });
      }
    });

    return Array.from(map.values()).map((entry) => entry.date);
  }, [tasksWithDueDates]);

  return (
    <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Select a date to review its tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={{ hasTasks: modifierDates }}
            modifiersClassNames={{
              hasTasks:
                "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
            }}
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {tasksForSelectedDate.length} task{tasksForSelectedDate.length === 1 ? "" : "s"} on {format(selectedDate, "PPP")}
            </CardTitle>
            <CardDescription>
              Keep tabs on what&apos;s due each day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksForSelectedDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled for this date.</p>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="space-y-4 pr-4">
                  {tasksForSelectedDate.map((task) => (
                    <div key={task.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <TaskPriorityBadge priority={task.priority} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <TaskStatusBadge status={task.status} />
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
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {noDueDateTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No due date</CardTitle>
              <CardDescription>
                Tasks without a due date stay here until scheduled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {noDueDateTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <TaskStatusBadge status={task.status} />
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
