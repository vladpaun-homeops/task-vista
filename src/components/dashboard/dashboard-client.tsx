"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag as TagIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Priority, Status } from "@/generated/prisma/enums";
import type { TaskFormValues } from "@/lib/validations/task";
import type { TagOption } from "@/components/tags/tag-multi-select";
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

  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCreateTask = React.useCallback(
    async (values: TaskFormValues) => {
      const result = await createTaskAction(values);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      refresh();
      return { success: true };
    },
    [refresh]
  );

  const handleUpdateTask = React.useCallback(
    async (values: TaskFormValues & { id: string }) => {
      const result = await updateTaskAction({ ...values });
      if (!result.success) {
        return { success: false, error: result.error };
      }
      refresh();
      return { success: true };
    },
    [refresh]
  );

  const handleDeleteTask = React.useCallback(
    async (task: DashboardTask) => {
      const result = await deleteTaskAction({ id: task.id });
      if (!result.success) {
        return { success: false, error: result.error };
      }
      refresh();
      return { success: true };
    },
    [refresh]
  );

  const handleStatusChange = React.useCallback(
    async (task: DashboardTask, status: Status) => {
      const result = await updateTaskStatusAction({ id: task.id, status });
      if (!result.success) {
        return { success: false, error: result.error };
      }
      refresh();
      return { success: true };
    },
    [refresh]
  );

  const handlePriorityChange = React.useCallback(
    async (task: DashboardTask, priority: Priority) => {
      const result = await updateTaskPriorityAction({ id: task.id, priority });
      if (!result.success) {
        return { success: false, error: result.error };
      }
      refresh();
      return { success: true };
    },
    [refresh]
  );

  const handleCreateTag = React.useCallback(
    async (values: { name: string; color: string }) => {
      const result = await createTagAction(values);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      refresh();
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

      <TaskSummary counts={statusCounts} />

      {overdue.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title="Overdue"
            description="Handle these first to get back on track."
            tone="danger"
          />
          <TaskList
            tasks={overdue}
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
          tasks={dueSoon}
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
          tasks={backlog}
          emptyMessage="All caught up!"
          onComplete={actions.onComplete}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
          onStatusChange={actions.onStatusChange}
          onPriorityChange={actions.onPriorityChange}
        />
      </section>

      {completed.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title="Recently completed"
            description="A quick glance at finished work."
          />
          <TaskList tasks={completed} emptyMessage="" />
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
