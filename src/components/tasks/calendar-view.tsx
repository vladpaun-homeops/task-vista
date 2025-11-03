'use client';

import * as React from "react";
import { format, isSameDay, parseISO } from "date-fns";

import type { Priority, Status } from "@/generated/prisma/enums";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskList } from "@/components/tasks/task-list";

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
              <TaskList tasks={tasksForSelectedDate} highlight="soon" />
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
              <TaskList tasks={noDueDateTasks} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
