'use client';

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";

import { Priority, Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskTagPill } from "@/components/tasks/task-tag-pill";
import {
  TaskCompleteButton,
  TaskPriorityMenuButton,
  TaskStatusMenuButton,
} from "@/components/tasks/task-quick-actions";

export type TaskRow = {
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

type TaskTableProps = {
  tasks: TaskRow[];
  onEdit: (task: TaskRow) => void;
  onDelete: (task: TaskRow) => Promise<{ success: boolean; error?: string } | void>;
  onStatusChange: (
    task: TaskRow,
    status: Status
  ) => Promise<{ success: boolean; error?: string } | void>;
  onPriorityChange: (
    task: TaskRow,
    priority: Priority
  ) => Promise<{ success: boolean; error?: string } | void>;
};

export function TaskTable({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}: TaskTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "dueDate", desc: false },
  ]);
  const [deleteTarget, setDeleteTarget] = React.useState<TaskRow | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, startDeleting] = React.useTransition();

  const columns = React.useMemo<ColumnDef<TaskRow>[]>(
    () => [
      {
        id: "complete",
        header: () => <span className="sr-only">Complete</span>,
        cell: ({ row }) => (
          <TaskCompleteButton
            task={row.original}
            onComplete={(task) => onStatusChange(task, Status.DONE)}
          />
        ),
        enableSorting: false,
        size: 48,
      },
      {
        accessorKey: "title",
        header: () => <span>Task</span>,
        cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="space-y-2">
              <p className="font-medium text-sm text-foreground">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {task.tags.map((tag) => (
                    <TaskTagPill key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <span>Status</span>,
        cell: ({ row }) => (
          <TaskStatusMenuButton task={row.original} onStatusChange={onStatusChange} />
        ),
      },
      {
        accessorKey: "priority",
        header: () => <span>Priority</span>,
        cell: ({ row }) => (
          <TaskPriorityMenuButton task={row.original} onPriorityChange={onPriorityChange} />
        ),
      },
      {
        accessorKey: "dueDate",
        header: () => (
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span>Due</span>
          </div>
        ),
        cell: ({ row }) => {
          const dueDate = row.original.dueDate
            ? new Date(row.original.dueDate)
            : null;
          if (!dueDate) {
            return <span className="text-xs text-muted-foreground">No due date</span>;
          }

          return (
            <span
              className={cn(
                "text-xs font-medium",
                dueDate.getTime() < Date.now() ? "text-destructive" : "text-foreground"
              )}
            >
              {format(dueDate, "MMM d, yyyy")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(task)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit task</span>
              </Button>

              <Dialog
                open={deleteTarget?.id === task.id}
                onOpenChange={(open) => {
                  setDeleteError(null);
                  setDeleteTarget(open ? task : null);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete task</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete task</DialogTitle>
                    <DialogDescription>
                      This will permanently remove &ldquo;{task.title}&rdquo;. You
                      can&apos;t undo this action.
                    </DialogDescription>
                  </DialogHeader>
                  {deleteError && (
                    <p className="px-4 text-sm text-destructive">{deleteError}</p>
                  )}
                  <DialogFooter className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteTarget(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isDeleting && deleteTarget?.id === task.id}
                      onClick={() =>
                        startDeleting(async () => {
                          setDeleteError(null);
                          const result = await onDelete(task);
                          if (!result || result.success) {
                            setDeleteTarget(null);
                          } else {
                            setDeleteError(result.error ?? "Failed to delete task");
                          }
                        })
                      }
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [deleteError, deleteTarget?.id, isDeleting, onDelete, onEdit, onPriorityChange, onStatusChange]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                return (
                  <TableHead key={header.id}>
                    {canSort ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 gap-2"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIndicator direction={header.column.getIsSorted()} />
                      </Button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                No tasks found. Adjust your filters or add one above.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  if (!direction) {
    return null;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}
