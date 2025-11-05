"use client";

import * as React from "react";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  parseISO,
  startOfToday,
  startOfWeek,
} from "date-fns";

import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTaskAction } from "@/server/actions/tasks";
import { cn } from "@/lib/utils";
import type { Priority, Status } from "@/generated/prisma/enums";
import { TaskList } from "@/components/tasks/task-list";

export type CalendarBoardTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; color: string | null }[];
};

type CalendarBoardProps = {
  tasks: CalendarBoardTask[];
};

export function CalendarBoard({ tasks }: CalendarBoardProps) {
  const [items, setItems] = React.useState<CalendarBoardTask[]>(tasks);
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const today = startOfToday();
  const [weekStart, setWeekStart] = React.useState<Date>(startOfWeek(today, { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = React.useState<Date>(weekStart);

  React.useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const weekDates = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index));
  }, [weekStart]);

  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, CalendarBoardTask[]>();
    weekDates.forEach((date) => map.set(date.toDateString(), []));
    const unscheduled: CalendarBoardTask[] = [];

    items.forEach((task) => {
      if (!task.dueDate) {
        unscheduled.push(task);
        return;
      }
      const date = parseISO(task.dueDate);
      const key = date.toDateString();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.set(key, [...(map.get(key) ?? []), task]);
    });

    return { map, unscheduled };
  }, [items, weekDates]);

  const handleDrop = React.useCallback(
    async (targetDate: Date | null) => {
      if (!draggedTaskId) return;

      const task = items.find((item) => item.id === draggedTaskId);
      if (!task) {
        setDraggedTaskId(null);
        return;
      }

      const previousItems = items;
      const formattedTarget = targetDate
        ? new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
        : null;
      const newIso = formattedTarget ? formattedTarget.toISOString() : null;

      setItems((current) =>
        current.map((item) =>
          item.id === draggedTaskId
            ? {
                ...item,
                dueDate: newIso,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      const result = await updateTaskAction({
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        dueDate: formattedTarget,
        priority: task.priority,
        status: task.status,
        tagIds: task.tags.map((tag) => tag.id),
      });

      if (!result.success) {
        setItems(previousItems);
        toast.error("Failed to reschedule", {
          description: result.error ?? "Please try again.",
        });
      } else {
        toast.success(
          formattedTarget ? `Moved to ${format(formattedTarget, "PPP")}` : "Unschedule successful"
        );
        setSelectedDate(formattedTarget ?? weekStart);
      }

      setDraggedTaskId(null);
    },
    [draggedTaskId, items, weekStart]
  );

  const weekRangeLabel = React.useMemo(() => {
    const end = addDays(weekStart, 6);
    const sameMonth = weekStart.getMonth() === end.getMonth();
    return sameMonth
      ? `${format(weekStart, "MMM d")} – ${format(end, "d, yyyy")}`
      : `${format(weekStart, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }, [weekStart]);

  const goToWeek = (delta: number) => {
    setWeekStart((current) => addWeeks(current, delta));
  };

  const goToToday = () => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    setWeekStart(start);
    setSelectedDate(start);
  };

  React.useEffect(() => {
    const end = addDays(weekStart, 6);
    if (!(selectedDate >= weekStart && selectedDate <= end)) {
      setSelectedDate(weekStart);
    }
  }, [selectedDate, weekStart]);

  const todayKey = today.toDateString();

  const { map: dateMap, unscheduled } = tasksByDate;
  const selectedTasks = React.useMemo(
    () => dateMap.get(selectedDate.toDateString()) ?? [],
    [dateMap, selectedDate]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Drag tasks between days to reschedule. Drop into "Unscheduled" to clear a date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goToWeek(-1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToWeek(1)}>
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{weekRangeLabel}</h2>
          <span className="text-sm text-muted-foreground">
            {items.filter((task) => task.dueDate).length} scheduled | {unscheduled.length} unscheduled
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[960px] grid-cols-[220px_repeat(7,minmax(0,1fr))] gap-3 pr-2">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(null)}
            className="flex h-full min-h-[240px] flex-col rounded-md border border-dashed border-border bg-muted/40 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Unscheduled</p>
              <span className="text-xs text-muted-foreground">{unscheduled.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {unscheduled.length === 0 ? (
                <p className="text-xs text-muted-foreground">Drop a task here to remove its due date.</p>
              ) : (
                unscheduled.map((task) => (
                  <button
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => setDraggedTaskId(null)}
                    className="w-full rounded-md bg-background px-3 py-2 text-left text-xs shadow-sm"
                  >
                    <p className="font-semibold text-foreground">{task.title}</p>
                    <p className="text-muted-foreground">Drag to assign a day</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {weekDates.map((date) => {
            const key = date.toDateString();
            const tasksForDate = dateMap.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = isSameDay(date, selectedDate);

            return (
              <div
                key={key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(date)}
                onClick={() => setSelectedDate(date)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedDate(date);
                  }
                }}
                className={cn(
                  "flex h-full min-h-[240px] flex-col rounded-md border p-2 sm:p-3 transition",
                  draggedTaskId ? "border-dashed" : "border-border",
                  isToday ? "bg-primary/5" : "bg-muted/20",
                  isSelected ? " border-primary shadow-sm ring-1 ring-primary" : "hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-1 py-1 text-left transition"
                  )}
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {format(date, "EEE")}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {format(date, "MMM d")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{tasksForDate.length}</span>
                </div>
                <div className="mt-3 flex-1 space-y-2">
                  {tasksForDate.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Drag tasks here</p>
                  ) : (
                    tasksForDate.map((task) => (
                      <button
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                        className="w-full rounded-md bg-background px-3 py-2 text-left text-xs shadow-sm"
                      >
                        <p className="font-semibold text-foreground">{task.title}</p>
                        <p className="text-muted-foreground">
                          {task.tags.length ? task.tags.map((tag) => tag.name).join(", ") : "No tags"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks on {format(selectedDate, "PPP")}</CardTitle>
          <CardDescription>Detailed view for the selected date.</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled for this date.</p>
          ) : (
            <TaskList tasks={selectedTasks} showSortControls={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
