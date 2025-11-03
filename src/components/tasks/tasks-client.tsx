'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import type { Status } from "@/generated/prisma/enums";
import { statusOptions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskSummary } from "@/components/tasks/task-summary";
import { TaskTable, type TaskRow } from "@/components/tasks/task-table";
import type { TagOption } from "@/components/tags/tag-multi-select";
import { createTaskAction, deleteTaskAction, updateTaskAction, updateTaskStatusAction } from "@/server/actions/tasks";
import type { TaskFormValues } from "@/lib/validations/task";

type TasksClientProps = {
  tasks: TaskRow[];
  tags: TagOption[];
  statusCounts: Partial<Record<Status, number>>;
};

export function TasksClient({ tasks, tags, statusCounts }: TasksClientProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [taskToEdit, setTaskToEdit] = React.useState<TaskRow | null>(null);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Capture tasks, update their status, and keep everything tagged.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New task
        </Button>
      </div>

      <TaskFilters statusOptions={statusOptions} tags={tags} />

      <TaskSummary counts={statusCounts} />

      <TaskTable
        tasks={tasks}
        onEdit={(task) => setTaskToEdit(task)}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create task</SheetTitle>
            <SheetDescription>
              Set the basics now—you can always refine it later.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full px-1">
            <TaskForm
              tags={tags}
              submitLabel="Create task"
              onSubmit={handleCreate}
              onSuccess={() => {
                setIsCreateOpen(false);
              }}
            />
          </ScrollArea>
          <SheetFooter />
        </SheetContent>
      </Sheet>

      <Sheet open={!!taskToEdit} onOpenChange={(open) => !open && setTaskToEdit(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit task</SheetTitle>
            <SheetDescription>
              Update details, due date, status, or tags.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full px-1">
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
          </ScrollArea>
          <SheetFooter />
        </SheetContent>
      </Sheet>
    </div>
  );
}
