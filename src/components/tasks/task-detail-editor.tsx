'use client';

import * as React from "react";
import { useRouter } from "next/navigation";

import type { TaskFormValues } from "@/lib/validations/task";
import { TaskEditor } from "@/components/tasks/task-editor";
import type { TagOption } from "@/components/tags/tag-multi-select";
import { updateTaskAction, deleteTaskAction } from "@/server/actions/tasks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Priority, Status } from "@/generated/prisma/enums";

type TaskDetailEditorProps = {
  task: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    priority: Priority;
    status: Status;
    tagIds: string[];
  };
  tags: TagOption[];
};

export function TaskDetailEditor({ task, tags }: TaskDetailEditorProps) {
  const router = useRouter();
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, startDeleting] = React.useTransition();

  const handleSubmit = React.useCallback(
    async (values: TaskFormValues) => {
      const result = await updateTaskAction({ id: task.id, ...values });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      router.refresh();
      return { success: true };
    },
    [router, task.id]
  );

  const handleDelete = React.useCallback(() => {
    startDeleting(async () => {
      setDeleteError(null);
      const result = await deleteTaskAction({ id: task.id });
      if (!result.success) {
        setDeleteError(result.error ?? "Failed to delete task");
        return;
      }
      router.push("/tasks");
      router.refresh();
    });
  }, [router, task.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit task</CardTitle>
        <CardDescription>Adjust details, status, and tags.</CardDescription>
      </CardHeader>
      <CardContent>
        <TaskEditor
          tags={tags}
          submitLabel="Save changes"
          initialValues={{
            title: task.title,
            description: task.description ?? "",
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            priority: task.priority,
            status: task.status,
            tagIds: task.tagIds,
          }}
          onSubmit={handleSubmit}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="self-start sm:self-auto"
        >
          Delete task
        </Button>
      </CardFooter>
    </Card>
  );
}
