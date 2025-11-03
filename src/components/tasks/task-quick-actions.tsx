'use client';

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { priorityOptions, statusOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Priority, Status } from "@/generated/prisma/enums";
import { CheckCircle2 } from "lucide-react";

export type TaskActionTarget = {
  id: string;
  status: Status;
  priority: Priority;
};

type StatusMenuButtonProps<T extends TaskActionTarget> = {
  task: T;
  onStatusChange: (
    task: T,
    status: Status
  ) => Promise<{ success: boolean; error?: string } | void>;
  disabled?: boolean;
  className?: string;
};

export function TaskStatusMenuButton<T extends TaskActionTarget>({
  task,
  onStatusChange,
  disabled = false,
  className,
}: StatusMenuButtonProps<T>) {
  const [isPending, startTransition] = React.useTransition();

  const handleStatusChange = (nextStatus: Status) => {
    if (nextStatus === task.status) return;

    startTransition(async () => {
      await onStatusChange(task, nextStatus);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("flex items-center gap-2 px-2", className)}
          disabled={disabled || isPending}
        >
          <TaskStatusBadge status={task.status} withChevron />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Update status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className="flex items-center justify-between gap-2"
          >
            <span>{option.label}</span>
            {option.value === task.status && (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type PriorityMenuButtonProps<T extends TaskActionTarget> = {
  task: T;
  onPriorityChange: (
    task: T,
    priority: Priority
  ) => Promise<{ success: boolean; error?: string } | void>;
  disabled?: boolean;
  className?: string;
};

export function TaskPriorityMenuButton<T extends TaskActionTarget>({
  task,
  onPriorityChange,
  disabled = false,
  className,
}: PriorityMenuButtonProps<T>) {
  const [isPending, startTransition] = React.useTransition();

  const handlePriorityChange = (nextPriority: Priority) => {
    if (nextPriority === task.priority) return;

    startTransition(async () => {
      await onPriorityChange(task, nextPriority);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("flex items-center gap-2 px-2", className)}
          disabled={disabled || isPending}
        >
          <TaskPriorityBadge priority={task.priority} withChevron />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Set priority</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {priorityOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handlePriorityChange(option.value)}
            className="flex items-center justify-between gap-2"
          >
            <span>{option.label}</span>
            {option.value === task.priority && (
              <CheckCircle2 className="h-4 w-4 text-amber-300" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type CompleteButtonProps<T extends TaskActionTarget> = {
  task: T;
  onComplete: (
    task: T
  ) => Promise<{ success: boolean; error?: string } | void>;
  className?: string;
};

export function TaskCompleteButton<T extends TaskActionTarget>({
  task,
  onComplete,
  className,
}: CompleteButtonProps<T>) {
  const [isPending, startTransition] = React.useTransition();
  const isDone = task.status === Status.DONE;

  const handleComplete = () => {
    if (isDone) return;
    startTransition(async () => {
      await onComplete(task);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      disabled={isDone || isPending}
      onClick={handleComplete}
    >
      <CheckCircle2
        className={cn(
          "h-4 w-4 transition",
          isDone ? "text-emerald-400" : "text-muted-foreground"
        )}
      />
      <span className="sr-only">Mark as done</span>
    </Button>
  );
}
