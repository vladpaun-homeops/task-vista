'use client';

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Tag as TagIcon } from "lucide-react";

import { Priority, Status } from "@/generated/prisma/enums";
import { statusOptions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskSummary } from "@/components/tasks/task-summary";
import { TaskTable, type TaskRow } from "@/components/tasks/task-table";
import type { TagOption } from "@/components/tags/tag-multi-select";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  updateTaskPriorityAction,
  updateTaskStatusAction,
} from "@/server/actions/tasks";
import { createTagAction } from "@/server/actions/tags";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TagForm } from "@/components/tags/tag-form";
import type { TaskFormValues } from "@/lib/validations/task";
import { toast } from "@/components/ui/sonner";

type TasksClientProps = {
  tasks: TaskRow[];
  tags: TagOption[];
  statusCounts: Partial<Record<Status, number>>;
};

export function TasksClient({ tasks, tags, statusCounts }: TasksClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = React.useState(false);
  const [taskToEdit, setTaskToEdit] = React.useState<TaskRow | null>(null);
  const suppressCreateSyncRef = React.useRef(false);
  const [taskItems, setTaskItems] = React.useState<TaskRow[]>(tasks);
  const taskItemsRef = React.useRef(tasks);

  React.useEffect(() => {
    setTaskItems(tasks);
    taskItemsRef.current = tasks;
  }, [tasks]);

  React.useEffect(() => {
    taskItemsRef.current = taskItems;
  }, [taskItems]);

  const findTags = React.useCallback(
    (ids: string[]) =>
      ids
        .map((id) => tags.find((tag) => tag.id === id))
        .filter((tag): tag is TagOption => Boolean(tag)),
    [tags]
  );

  const addTask = React.useCallback((task: TaskRow) => {
    setTaskItems((current) => [task, ...current]);
  }, []);

  const applyTaskUpdate = React.useCallback(
    (id: string, updater: (task: TaskRow) => TaskRow | null) => {
      setTaskItems((current) =>
        current
          .map((task) => (task.id === id ? updater(task) : task))
          .filter((task): task is TaskRow => Boolean(task))
      );
    },
    []
  );

  const activeTasks = React.useMemo(
    () => taskItems.filter((task) => task.status !== Status.DONE),
    [taskItems]
  );
  const completedTasks = React.useMemo(
    () => taskItems.filter((task) => task.status === Status.DONE),
    [taskItems]
  );
  const shouldShowActiveSection = activeTasks.length > 0 || completedTasks.length === 0;

  const summaryCounts = React.useMemo(() => {
    const base: Partial<Record<Status, number>> = {
      [Status.NOT_STARTED]: 0,
      [Status.IN_PROGRESS]: 0,
      [Status.OVERDUE]: 0,
      [Status.DONE]: 0,
    };
    for (const task of taskItems) {
      base[task.status] = (base[task.status] ?? 0) + 1;
    }
    return base;
  }, [taskItems]);

  const createParam = searchParams.get("create");

  const updateCreateQuery = React.useCallback(
    (shouldOpen: boolean) => {
      if (!pathname) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      if (shouldOpen) {
        nextParams.set("create", "1");
      } else {
        nextParams.delete("create");
      }

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleOpenCreate = React.useCallback(() => {
    setIsCreateOpen(true);
    suppressCreateSyncRef.current = false;
    updateCreateQuery(true);
  }, [updateCreateQuery]);

  React.useEffect(() => {
    if (createParam && !isCreateOpen) {
      if (suppressCreateSyncRef.current) {
        return;
      }
      setIsCreateOpen(true);
      return;
    }

    if (!createParam && suppressCreateSyncRef.current) {
      suppressCreateSyncRef.current = false;
      return;
    }

    if (!createParam && isCreateOpen) {
      setIsCreateOpen(false);
    }
  }, [createParam, isCreateOpen]);

  const handleCreateOpenChange = React.useCallback(
    (open: boolean) => {
      setIsCreateOpen(open);
      if (open) {
        suppressCreateSyncRef.current = false;
        updateCreateQuery(true);
        return;
      }

      suppressCreateSyncRef.current = true;
      updateCreateQuery(false);
    },
    [updateCreateQuery]
  );

  const handleCreate = React.useCallback(
    async (values: TaskFormValues) => {
      const tempId = `temp-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const optimisticTask: TaskRow = {
        id: tempId,
        title: values.title,
        description: values.description ?? null,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        priority: values.priority,
        status: values.status,
        createdAt: now,
        updatedAt: now,
        tags: findTags(values.tagIds).map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
      };

      addTask(optimisticTask);

      const result = await createTaskAction(values);
      if (!result.success) {
        setTaskItems((current) => current.filter((task) => task.id !== tempId));
        toast.error("Failed to create task", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      if (result.data?.id) {
        setTaskItems((current) =>
          current.map((task) => (task.id === tempId ? { ...task, id: result.data!.id } : task))
        );
      }

      toast.success("Task created");
      React.startTransition(() => {
        router.refresh();
      });
      return { success: true };
    },
    [addTask, findTags, router]
  );

  const handleUpdate = React.useCallback(
    async (values: TaskFormValues & { id: string }) => {
      const previous = taskItemsRef.current;
      applyTaskUpdate(values.id, (task) => {
        const now = new Date().toISOString();
        return {
          ...task,
          title: values.title,
          description: values.description ?? null,
          dueDate: values.dueDate ? values.dueDate.toISOString() : null,
          priority: values.priority,
          status: values.status,
          updatedAt: now,
          tags: findTags(values.tagIds).map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
        };
      });

      const result = await updateTaskAction({ ...values });
      if (!result.success) {
        setTaskItems(previous);
        toast.error("Failed to update task", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Task updated");
      React.startTransition(() => {
        router.refresh();
      });
      return { success: true };
    },
    [applyTaskUpdate, findTags, router]
  );

  const handleDelete = React.useCallback(
    async (task: TaskRow) => {
      const previous = taskItemsRef.current;
      setTaskItems((current) => current.filter((item) => item.id !== task.id));

      const result = await deleteTaskAction({ id: task.id });
      if (!result.success) {
        setTaskItems(previous);
        toast.error("Failed to delete task", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Task deleted");
      React.startTransition(() => {
        router.refresh();
      });
      return { success: true };
    },
    [router]
  );

  const handleStatusChange = React.useCallback(
    async (task: TaskRow, status: Status) => {
      const previous = taskItemsRef.current;
      applyTaskUpdate(task.id, (current) => ({
        ...current,
        status,
        updatedAt: new Date().toISOString(),
      }));

      const result = await updateTaskStatusAction({ id: task.id, status });
      if (!result.success) {
        setTaskItems(previous);
        toast.error("Failed to update status", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Status updated");
      React.startTransition(() => {
        router.refresh();
      });
      return { success: true };
    },
    [applyTaskUpdate, router]
  );

  const handlePriorityChange = React.useCallback(
    async (task: TaskRow, priority: Priority) => {
      const previous = taskItemsRef.current;
      applyTaskUpdate(task.id, (current) => ({
        ...current,
        priority,
        updatedAt: new Date().toISOString(),
      }));

      const result = await updateTaskPriorityAction({ id: task.id, priority });
      if (!result.success) {
        setTaskItems(previous);
        toast.error("Failed to update priority", {
          description: result.error ?? "Please try again.",
        });
        return { success: false, error: result.error };
      }

      toast.success("Priority updated");
      React.startTransition(() => {
        router.refresh();
      });
      return { success: true };
    },
    [applyTaskUpdate, router]
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
      React.startTransition(() => {
        router.refresh();
      });
      return { success: true };
    },
    [router]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Capture tasks, update their status, and keep everything tagged.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New task
          </Button>
          <Button variant="outline" onClick={() => setIsCreateTagOpen(true)}>
            <TagIcon className="mr-2 h-4 w-4" />
            New tag
          </Button>
        </div>
      </div>

      <TaskFilters statusOptions={statusOptions} tags={tags} />

      <TaskSummary counts={summaryCounts} />

      {shouldShowActiveSection && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Active tasks</h2>
            <span className="text-sm text-muted-foreground">{activeTasks.length}</span>
          </div>
          {activeTasks.length ? (
            <TaskTable
              tasks={activeTasks}
              onEdit={(task) => setTaskToEdit(task)}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {tasks.length === 0
                ? "No tasks found. Adjust your filters or add one above."
                : "Nice work—nothing left on your plate right now."}
            </div>
          )}
        </section>
      )}

      {completedTasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Completed</h2>
            <span className="text-sm text-muted-foreground">{completedTasks.length}</span>
          </div>
          <TaskTable
            tasks={completedTasks}
            onEdit={(task) => setTaskToEdit(task)}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
          />
        </section>
      )}

      <Sheet open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Create task</SheetTitle>
            <SheetDescription>
              Set the basics now—you can always refine it later.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="px-6 pb-8 pt-2">
              <TaskForm
                tags={tags}
                submitLabel="Create task"
                onSubmit={handleCreate}
                onSuccess={() => {
                  handleCreateOpenChange(false);
                }}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={!!taskToEdit} onOpenChange={(open) => !open && setTaskToEdit(null)}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Edit task</SheetTitle>
            <SheetDescription>
              Update details, due date, status, or tags.
            </SheetDescription>
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
                    handleUpdate({
                      ...values,
                      id: taskToEdit.id,
                    })
                  }
                  onSuccess={() => {
                    setTaskToEdit(null);
                  }}
                />
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create tag</DialogTitle>
            <DialogDescription>Organize tasks with new labels.</DialogDescription>
          </DialogHeader>
          <TagForm
            submitLabel="Create tag"
            onSubmit={handleCreateTag}
            onSuccess={() => setIsCreateTagOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
