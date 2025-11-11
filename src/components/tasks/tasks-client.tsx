'use client';

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Tag as TagIcon } from "lucide-react";

import { Priority, Status } from "@/generated/prisma/enums";
import { statusOptions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskEditor } from "@/components/tasks/task-editor";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagForm } from "@/components/tags/tag-form";
import type { TaskFormValues } from "@/lib/validations/task";
import { toast } from "@/components/ui/sonner";

type TasksClientProps = {
  tasks: TaskRow[];
  tags: TagOption[];
};

export function TasksClient({ tasks, tags }: TasksClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = React.useState(false);
  const [taskToEdit, setTaskToEdit] = React.useState<TaskRow | null>(null);
  const [taskItems, setTaskItems] = React.useState<TaskRow[]>(tasks);
  const taskItemsRef = React.useRef(tasks);
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setTaskItems(tasks);
    taskItemsRef.current = tasks;
  }, [tasks]);

  React.useEffect(() => {
    taskItemsRef.current = taskItems;
  }, [taskItems]);

  React.useEffect(() => {
    const validIds = new Set(taskItems.map((task) => task.id));
    setSelectedTaskIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      if (!changed && next.size === prev.size) {
        return prev;
      }
      return next;
    });
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

  const handleSelectTask = React.useCallback((id: string, selected: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllTasks = React.useCallback((ids: string[], selected: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        ids.forEach((id) => next.add(id));
      } else {
        ids.forEach((id) => next.delete(id));
      }
      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const selectedTasks = React.useMemo(
    () => taskItems.filter((task) => selectedTaskIds.has(task.id)),
    [taskItems, selectedTaskIds]
  );

  React.useEffect(() => {
    if (!searchParams) {
      return;
    }

    const shouldOpen = searchParams.get("create") === "1";
    if (!shouldOpen) {
      return;
    }

    setIsCreateOpen(true);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } else {
      router.replace("/tasks", { scroll: false });
    }
  }, [router, searchParams]);

  const handleOpenCreate = React.useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const handleCreateOpenChange = React.useCallback((open: boolean) => {
    setIsCreateOpen(open);
  }, []);

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
      const previousSelection = new Set(selectedTaskIds);
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      setTaskItems((current) => current.filter((item) => item.id !== task.id));

      const result = await deleteTaskAction({ id: task.id });
      if (!result.success) {
        setTaskItems(previous);
        setSelectedTaskIds(previousSelection);
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
    [router, selectedTaskIds]
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

  const handleBulkMarkDone = React.useCallback(async () => {
    const selectedArray = Array.from(selectedTaskIds);
    if (selectedArray.length === 0) {
      return;
    }

    const previous = taskItemsRef.current;
    const selectedSet = new Set(selectedArray);
    const tasksToUpdate = previous.filter(
      (task) => selectedSet.has(task.id) && task.status !== Status.DONE
    );

    if (tasksToUpdate.length === 0) {
      clearSelection();
      return;
    }

    const now = new Date().toISOString();
    setTaskItems((current) =>
      current.map((task) =>
        selectedSet.has(task.id)
          ? { ...task, status: Status.DONE, updatedAt: now }
          : task
      )
    );
    clearSelection();

    const results = await Promise.all(
      tasksToUpdate.map((task) => updateTaskStatusAction({ id: task.id, status: Status.DONE }))
    );

    if (results.some((res) => !res?.success)) {
      setTaskItems(previous);
      setSelectedTaskIds(new Set(selectedArray));
      toast.error("Failed to update some tasks", {
        description: "Please try again.",
      });
      return;
    }

    toast.success(
      tasksToUpdate.length === 1
        ? "Marked 1 task as done"
        : `Marked ${tasksToUpdate.length} tasks as done`
    );
    React.startTransition(() => {
      router.refresh();
    });
  }, [clearSelection, router, selectedTaskIds]);

  const handleBulkDelete = React.useCallback(async () => {
    const selectedArray = Array.from(selectedTaskIds);
    if (selectedArray.length === 0) {
      return;
    }

    const previous = taskItemsRef.current;
    const selectedSet = new Set(selectedArray);

    setTaskItems(previous.filter((task) => !selectedSet.has(task.id)));
    clearSelection();

    const results = await Promise.all(
      selectedArray.map((id) => deleteTaskAction({ id }))
    );

    if (results.some((res) => !res?.success)) {
      setTaskItems(previous);
      setSelectedTaskIds(new Set(selectedArray));
      toast.error("Failed to delete some tasks", {
        description: "Please try again.",
      });
      return;
    }

    toast.success(
      selectedArray.length === 1
        ? "Deleted 1 task"
        : `Deleted ${selectedArray.length} tasks`
    );
    React.startTransition(() => {
      router.refresh();
    });
  }, [clearSelection, router, selectedTaskIds]);

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

      {selectedTaskIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 p-3">
          <span className="text-sm font-medium text-primary">
            {selectedTaskIds.size} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleBulkMarkDone}
              disabled={!selectedTasks.some((task) => task.status !== Status.DONE)}
            >
              Mark done
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
            >
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

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
              selectedIds={selectedTaskIds}
              onSelectChange={handleSelectTask}
              onSelectAll={handleSelectAllTasks}
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
            selectedIds={selectedTaskIds}
            onSelectChange={handleSelectTask}
            onSelectAll={handleSelectAllTasks}
          />
        </section>
      )}

      <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="max-w-lg gap-0 p-0">
          <div className="border-b px-6 py-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle>Create task</DialogTitle>
              <DialogDescription>
                Set the basics now—you can always refine it later.
              </DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 pb-8 pt-4">
              <TaskEditor
                tags={tags}
                submitLabel="Create task"
                onSubmit={handleCreate}
                onSuccess={() => handleCreateOpenChange(false)}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskToEdit} onOpenChange={(open) => !open && setTaskToEdit(null)}>
        <DialogContent className="max-w-lg gap-0 p-0">
          <div className="border-b px-6 py-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle>Edit task</DialogTitle>
              <DialogDescription>
                Update details, due date, status, or tags.
              </DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 pb-8 pt-4">
              {taskToEdit && (
                <TaskEditor
                  tags={tags}
                  submitLabel="Save changes"
                  initialValues={{
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
                  onSuccess={() => setTaskToEdit(null)}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
