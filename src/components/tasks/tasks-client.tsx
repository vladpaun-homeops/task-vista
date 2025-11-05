'use client';

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Tag as TagIcon } from "lucide-react";

import type { Priority, Status } from "@/generated/prisma/enums";
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
    updateCreateQuery(true);
  }, [updateCreateQuery]);

  React.useEffect(() => {
    if (createParam && !isCreateOpen) {
      setIsCreateOpen(true);
    }
  }, [createParam, isCreateOpen]);

  const handleCreateOpenChange = React.useCallback(
    (open: boolean) => {
      setIsCreateOpen(open);
      if (!open && createParam) {
        updateCreateQuery(false);
      }
    },
    [createParam, updateCreateQuery]
  );

  const handleCreate = React.useCallback(
    async (values: TaskFormValues) => {
      const result = await createTaskAction(values);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      router.refresh();
      return { success: true };
    },
    [router]
  );

  const handleUpdate = React.useCallback(
    async (values: TaskFormValues & { id: string }) => {
      const result = await updateTaskAction({ ...values });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      router.refresh();
      return { success: true };
    },
    [router]
  );

  const handleDelete = React.useCallback(
    async (task: TaskRow) => {
      const result = await deleteTaskAction({ id: task.id });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      router.refresh();
      return { success: true };
    },
    [router]
  );

  const handleStatusChange = React.useCallback(
    async (task: TaskRow, status: Status) => {
      const result = await updateTaskStatusAction({ id: task.id, status });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      router.refresh();
      return { success: true };
    },
    [router]
  );

  const handlePriorityChange = React.useCallback(
    async (task: TaskRow, priority: Priority) => {
      const result = await updateTaskPriorityAction({ id: task.id, priority });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      router.refresh();
      return { success: true };
    },
    [router]
  );

  const handleCreateTag = React.useCallback(
    async (values: { name: string; color: string }) => {
      const result = await createTagAction(values);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      router.refresh();
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

      <TaskSummary counts={statusCounts} />

      <TaskTable
        tasks={tasks}
        onEdit={(task) => setTaskToEdit(task)}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
      />

      <Sheet open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Create task</SheetTitle>
            <SheetDescription>
              Set the basics now—you can always refine it later.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="px-6 pb-8">
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
        <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Edit task</SheetTitle>
            <SheetDescription>
              Update details, due date, status, or tags.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="px-6 pb-8">
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
