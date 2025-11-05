"use client";

import * as React from "react";

import { CalendarDays, Pencil, Trash2 } from "lucide-react";

import { cn, formatDateLabel } from "@/lib/utils";
import { sortTasks, nextSortConfig, type SortConfig, type TaskSortKey } from "@/lib/task-sorting";
import type { Priority, Status } from "@/generated/prisma/enums";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskTagPill } from "@/components/tasks/task-tag-pill";
import {
  TaskCompleteButton,
  TaskPriorityMenuButton,
  TaskStatusMenuButton,
  type TaskActionTarget,
} from "@/components/tasks/task-quick-actions";

type TaskListItem = TaskActionTarget & {
  title: string;
  description: string | null;
  dueDate: string | null;
  tags: { id: string; name: string; color: string | null }[];
  createdAt: string;
  updatedAt: string;
};

type TaskListProps = {
  tasks: TaskListItem[];
  emptyMessage?: string;
  highlight?: "default" | "overdue" | "soon";
  showSortControls?: boolean;
  onComplete?: (task: TaskListItem) => Promise<{ success: boolean; error?: string } | void>;
  onEdit?: (task: TaskListItem) => void;
  onDelete?: (task: TaskListItem) => void;
  onStatusChange?: (
    task: TaskListItem,
    status: Status
  ) => Promise<{ success: boolean; error?: string } | void>;
  onPriorityChange?: (
    task: TaskListItem,
    priority: Priority
  ) => Promise<{ success: boolean; error?: string } | void>;
};

const highlightClasses: Record<NonNullable<TaskListProps["highlight"]>, string> = {
  default: "border border-border",
  overdue: "border border-red-500/40 bg-red-500/5",
  soon: "border border-amber-500/30 bg-amber-500/5",
};

export function TaskList({
  tasks,
  emptyMessage = "Nothing to show.",
  highlight = "default",
  showSortControls = true,
  onComplete,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}: TaskListProps) {
  const hasTasks = tasks.length > 0;

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "dueDate",
    direction: "asc",
  });

  const sortedTasks = React.useMemo(
    () => sortTasks(tasks, sortConfig),
    [tasks, sortConfig]
  );

  const handleSortToggle = React.useCallback((key: TaskSortKey) => {
    setSortConfig((current) => nextSortConfig(current, key));
  }, []);

  const getDirectionFor = React.useCallback(
    (key: TaskSortKey) =>
      sortConfig && sortConfig.key === key ? sortConfig.direction : null,
    [sortConfig]
  );

  const sortOptions: Array<{ key: TaskSortKey; label: string }> = React.useMemo(
    () => [
      { key: "dueDate", label: "Due" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created" },
    ],
    []
  );

  return (
    <div className="space-y-3">
      {showSortControls && hasTasks && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sort
          </span>
          {sortOptions.map((option) => {
            const direction = getDirectionFor(option.key);
            return (
              <SortToggleButton
                key={option.key}
                label={option.label}
                direction={direction}
                onClick={() => handleSortToggle(option.key)}
              />
            );
          })}
        </div>
      )}

      {!hasTasks ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        sortedTasks.map((task) => (
        <Card key={task.id} className={cn("px-4 py-4 transition", highlightClasses[highlight])}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-base font-semibold leading-tight text-foreground">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onStatusChange ? (
                  <TaskStatusMenuButton task={task} onStatusChange={onStatusChange} />
                ) : (
                  <TaskStatusBadge status={task.status} />
                )}
                <DueDateChip dueDate={task.dueDate} />
              </div>
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <TaskTagPill key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {onPriorityChange ? (
                <TaskPriorityMenuButton task={task} onPriorityChange={onPriorityChange} />
              ) : (
                <TaskPriorityBadge priority={task.priority} />
              )}
              {(onComplete || onEdit || onDelete) && (
                <div className="flex items-center gap-1">
                  {onComplete && (
                    <TaskCompleteButton task={task} onComplete={onComplete} />
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(task)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit task</span>
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDelete(task)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete task</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
        ))
      )}
    </div>
  );
}

function SortToggleButton({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: "asc" | "desc" | null;
  onClick: () => void;
}) {
  const isActive = direction !== null;

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      className="gap-1"
      type="button"
      onClick={onClick}
    >
      {label}
      <SortIndicator direction={direction} />
    </Button>
  );
}

function SortIndicator({ direction }: { direction: "asc" | "desc" | null }) {
  if (!direction) {
    return null;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function DueDateChip({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">
        <CalendarDays className="h-3 w-3 text-slate-600 dark:text-slate-300" />
        No due date
      </span>
    );
  }

  const formattedDate = formatDateLabel(dueDate);
  if (!formattedDate) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">
        <CalendarDays className="h-3 w-3 text-slate-600 dark:text-slate-300" />
        Invalid date
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-900 dark:border-violet-500/60 dark:bg-violet-500/15 dark:text-violet-200">
      <CalendarDays className="h-3 w-3 text-violet-600 dark:text-violet-300" />
      Due {formattedDate}
    </span>
  );
}
