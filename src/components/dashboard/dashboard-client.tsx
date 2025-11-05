"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Plus, Tag as TagIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Priority, Status } from "@/generated/prisma/enums";
import type { TaskFormValues } from "@/lib/validations/task";
import type { TagOption } from "@/components/tags/tag-multi-select";
import { taskQuickFilters } from "@/lib/task-quick-filters";
import { toast } from "@/components/ui/sonner";
import { addDays } from "date-fns";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  updateTaskPriorityAction,
  updateTaskStatusAction,
} from "@/server/actions/tasks";
import { createTagAction } from "@/server/actions/tags";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { TagForm } from "@/components/tags/tag-form";
import { TaskSummary } from "@/components/tasks/task-summary";

type DashboardTask = {
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

type DashboardClientProps = {
  overdue: DashboardTask[];
  dueSoon: DashboardTask[];
  backlog: DashboardTask[];
  completed: DashboardTask[];
  statusCounts: Partial<Record<Status, number>>;
  tags: TagOption[];
};

export function DashboardClient({
  overdue,
  dueSoon,
  backlog,
  completed,
  statusCounts,
  tags,
}: DashboardClientProps) {
  const router = useRouter();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = React.useState(false);
  const [taskToEdit, setTaskToEdit] = React.useState<DashboardTask | null>(null);
  const [taskToDelete, setTaskToDelete] = React.useState<DashboardTask | null>(null);

  const initialTasks = React.useMemo(
    () => [...overdue, ...dueSoon, ...backlog, ...completed],
    [overdue, dueSoon, backlog, completed]
  );

  const [allTasks, setAllTasks] = React.useState<DashboardTask[]>(initialTasks);
  const tasksRef = React.useRef(allTasks);

  React.useEffect(() => {
    setAllTasks(initialTasks);
  }, [initialTasks]);

  React.useEffect(() => {
    tasksRef.current = allTasks;
  }, [allTasks]);

  const partitionTasks = React.useCallback((tasksList: DashboardTask[]) => {
    const now = new Date();
    const soon = addDays(now, 7);

    const groups = {
      overdue: [] as DashboardTask[],
      dueSoon: [] as DashboardTask[],
      backlog: [] as DashboardTask[],
      completed: [] as DashboardTask[],
    };

    for (const task of tasksList) {
      if (task.status === Status.DONE) {
        groups.completed.push(task);
        continue;
      }

      if (task.status === Status.OVERDUE) {
        groups.overdue.push(task);
        continue;
      }

      if (task.dueDate) {
        const due = new Date(task.dueDate);
        if (due < now) {
          groups.overdue.push(task);
          continue;
        }
        if (due <= soon) {
          groups.dueSoon.push(task);
          continue;
        }
      }

      groups.backlog.push(task);
    }

    return groups;
  }, []);

  const { overdue: overdueTasks, dueSoon: dueSoonTasks, backlog: backlogTasks, completed: completedTasks } = React.useMemo(
    () => partitionTasks(allTasks),
    [allTasks, partitionTasks]
  );

  const summaryCounts = React.useMemo(() => {
    const base: Partial<Record<Status, number>> = {
      [Status.NOT_STARTED]: 0,
      [Status.IN_PROGRESS]: 0,
      [Status.OVERDUE]: 0,
      [Status.DONE]: 0,
    };
    for (const task of allTasks) {
      base[task.status] = (base[task.status] ?? 0) + 1;
    }
    return base;
  }, [allTasks]);

  const findTags = React.useCallback(
    (ids: string[]) =>
      ids
        .map((id) => tags.find((tag) => tag.id === id))
        .filter((tag): tag is TagOption => Boolean(tag)),
    [tags]
  );

  const upsertTask = React.useCallback((task: DashboardTask) => {
    setAllTasks((current) => {
      const existingIndex = current.findIndex((item) => item.id === task.id);
      if (existingIndex === -1) {
        return [task, ...current];
      }
      const next = [...current];
      next[existingIndex] = task;
      return next;
    });
  }, []);

  const buildTaskFromValues = React.useCallback(
    (id: string, values: TaskFormValues, base?: DashboardTask): DashboardTask => ({
      id,
      title: values.title,
      description: values.description ?? null,
      dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      priority: values.priority,
      status: values.status,
      createdAt: base?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: findTags(values.tagIds).map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
    }),
    [findTags]
  );

  const removeTask = React.useCallback((id: string) => {
    setAllTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCreateTask = React.useCallback(
    async (values: TaskFormValues) => {
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimisticTask = buildTaskFromValues(tempId, values);

      upsertTask(optimisticTask);

      const result = await createTaskAction(values);
      if (!result.success) {
        removeTask(tempId);
        toast.error("Failed to create task", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      if (result.data?.id) {
        upsertTask({ ...optimisticTask, id: result.data.id });
      }

      toast.success("Task created");
      React.startTransition(() => refresh());
      return { success: true };
    },
    [buildTaskFromValues, refresh, removeTask, upsertTask]
  );

  const handleUpdateTask = React.useCallback(
    async (values: TaskFormValues & { id: string }) => {
      const previous = tasksRef.current;
      const existing = previous.find((task) => task.id === values.id);
      const optimistic = buildTaskFromValues(values.id, values, existing);
      upsertTask(optimistic);

      const result = await updateTaskAction({ ...values });
      if (!result.success) {
        setAllTasks(previous);
        toast.error("Failed to update task", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Task updated");
      React.startTransition(() => refresh());
      return { success: true };
    },
    [buildTaskFromValues, refresh, upsertTask]
  );

  const handleDeleteTask = React.useCallback(
    async (task: DashboardTask) => {
      const previous = tasksRef.current;
      removeTask(task.id);

      const result = await deleteTaskAction({ id: task.id });
      if (!result.success) {
        setAllTasks(previous);
        toast.error("Failed to delete task", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Task deleted");
      React.startTransition(() => refresh());
      return { success: true };
    },
    [refresh, removeTask]
  );

  const handleStatusChange = React.useCallback(
    async (task: DashboardTask, status: Status) => {
      const previous = tasksRef.current;
      upsertTask({
        ...task,
        status,
        updatedAt: new Date().toISOString(),
      });

      const result = await updateTaskStatusAction({ id: task.id, status });
      if (!result.success) {
        setAllTasks(previous);
        toast.error("Failed to update status", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Status updated");
      React.startTransition(() => refresh());
      return { success: true };
    },
    [refresh, upsertTask]
  );

  const handlePriorityChange = React.useCallback(
    async (task: DashboardTask, priority: Priority) => {
      const previous = tasksRef.current;
      upsertTask({
        ...task,
        priority,
        updatedAt: new Date().toISOString(),
      });

      const result = await updateTaskPriorityAction({ id: task.id, priority });
      if (!result.success) {
        setAllTasks(previous);
        toast.error("Failed to update priority", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Priority updated");
      React.startTransition(() => refresh());
      return { success: true };
    },
    [refresh, upsertTask]
  );

  const handleCreateTag = React.useCallback(
    async (values: { name: string; color: string }) => {
      const result = await createTagAction(values);
      if (!result.success) {
        toast.error("Failed to create tag", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Tag created");
      React.startTransition(() => refresh());
      return { success: true };
    },
    [refresh]
  );

  const actions = {
    onStatusChange: handleStatusChange,
    onPriorityChange: handlePriorityChange,
    onComplete: (task: DashboardTask) => handleStatusChange(task, Status.DONE),
    onEdit: setTaskToEdit,
    onDelete: setTaskToDelete,
  } as const;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Prioritize what matters today. Manage overdue, upcoming, and active work from one spot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add task
          </Button>
          <Button variant="outline" onClick={() => setIsCreateTagOpen(true)}>
            <TagIcon className="mr-2 h-4 w-4" />
            Add tag
          </Button>
        </div>
      </header>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Quick filters
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuickFilterLink label="All tasks" href="/tasks" description="Show every task." />
          {taskQuickFilters.map((filter) => (
            <QuickFilterLink
              key={filter.value}
              label={filter.label}
              description={filter.description}
              icon={filter.icon}
              href={`/tasks?view=${filter.value}`}
            />
          ))}
        </div>
      </section>

      <TaskSummary counts={summaryCounts} />

      {overdueTasks.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title="Overdue"
            description="Handle these first to get back on track."
            tone="danger"
          />
          <TaskList
            tasks={overdueTasks}
            highlight="overdue"
            onComplete={actions.onComplete}
            onEdit={actions.onEdit}
            onDelete={actions.onDelete}
            onStatusChange={actions.onStatusChange}
            onPriorityChange={actions.onPriorityChange}
          />
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader
          title="Due soon"
          description="Upcoming deadlines within the next 7 days."
          tone="warning"
        />
        <TaskList
          tasks={dueSoonTasks}
          highlight="soon"
          emptyMessage="Nothing due this week."
          onComplete={actions.onComplete}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
          onStatusChange={actions.onStatusChange}
          onPriorityChange={actions.onPriorityChange}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Active backlog"
          description="Everything else still on your plate."
        />
        <TaskList
          tasks={backlogTasks}
          emptyMessage="All caught up!"
          onComplete={actions.onComplete}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
          onStatusChange={actions.onStatusChange}
          onPriorityChange={actions.onPriorityChange}
        />
      </section>

      {completedTasks.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title="Recently completed"
            description="A quick glance at finished work."
          />
          <TaskList tasks={completedTasks} emptyMessage="" />
        </section>
      )}

      <Sheet open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Create task</SheetTitle>
            <SheetDescription>Capture a new task for your queue.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="px-6 pb-8 pt-2">
              <TaskForm
                tags={tags}
                onSubmit={handleCreateTask}
                submitLabel="Create task"
                onSuccess={() => setIsCreateTaskOpen(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={!!taskToEdit} onOpenChange={(open) => !open && setTaskToEdit(null)}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Edit task</SheetTitle>
            <SheetDescription>Adjust details, status, or tags.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="px-6 pb-8 pt-2">
              {taskToEdit && (
                <TaskForm
                  tags={tags}
                  submitLabel="Save changes"
                  defaultValues={{
                    title: taskToEdit.title,
                    description: taskToEdit.description ?? "",
                    dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate) : null,
                    priority: taskToEdit.priority,
                    status: taskToEdit.status,
                    tagIds: taskToEdit.tags.map((tag) => tag.id),
                  }}
                  onSubmit={(values) =>
                    handleUpdateTask({
                      ...values,
                      id: taskToEdit.id,
                    })
                  }
                  onSuccess={() => setTaskToEdit(null)}
                />
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this task. You can&#39;t undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!taskToDelete) return;
                await handleDeleteTask(taskToDelete);
                setTaskToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create tag</DialogTitle>
            <DialogDescription>Organize tasks by grouping them with tags.</DialogDescription>
          </DialogHeader>
          <TagForm
            submitLabel="Create tag"
            onSubmit={handleCreateTag}
            onSuccess={() => setIsCreateTagOpen(false)}
          />
          <DialogFooter className="hidden" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  description: string;
  tone?: "default" | "danger" | "warning";
};

function SectionHeader({ title, description, tone = "default" }: SectionHeaderProps) {
  const toneStyles: Record<NonNullable<SectionHeaderProps["tone"]>, string> = {
    default: "text-muted-foreground",
    danger: "text-red-600 dark:text-red-300",
    warning: "text-amber-600 dark:text-amber-300",
  };

  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className={cn("text-sm", toneStyles[tone])}>{description}</p>
    </div>
  );
}

function QuickFilterLink({
  label,
  href,
  description,
  icon: Icon,
}: {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
      title={description}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </Link>
  );
}
