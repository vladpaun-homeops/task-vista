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

import type { Priority, Status } from "@/generated/prisma/enums";
import { statusOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";

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
};

export function TaskTable({ tasks, onEdit, onDelete, onStatusChange }: TaskTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "dueDate", desc: false },
  ]);
  const [pendingTaskId, setPendingTaskId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TaskRow | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, startDeleting] = React.useTransition();

  const columns = React.useMemo<ColumnDef<TaskRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: () => <span>Task</span>,
        cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="space-y-1">
              <p className="font-medium text-sm">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {task.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{
                        borderColor: tag.color ?? undefined,
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full border"
                        style={{ backgroundColor: tag.color ?? undefined }}
                      />
                      {tag.name}
                    </Badge>
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
          <StatusCell
            task={row.original}
            onStatusChange={onStatusChange}
            pendingTaskId={pendingTaskId}
            setPendingTaskId={setPendingTaskId}
          />
        ),
      },
      {
        accessorKey: "priority",
        header: () => <span>Priority</span>,
        cell: ({ row }) => <TaskPriorityBadge priority={row.original.priority} />,
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
    [deleteError, deleteTarget?.id, isDeleting, onDelete, onEdit, onStatusChange, pendingTaskId]
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

type StatusCellProps = {
  task: TaskRow;
  pendingTaskId: string | null;
  setPendingTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  onStatusChange: (
    task: TaskRow,
    status: Status
  ) => Promise<{ success: boolean; error?: string } | void>;
};

function StatusCell({
  task,
  pendingTaskId,
  setPendingTaskId,
  onStatusChange,
}: StatusCellProps) {
  const [isUpdating, startUpdate] = React.useTransition();

  const handleStatusChange = (nextStatus: Status) => {
    if (nextStatus === task.status) {
      return;
    }

    setPendingTaskId(task.id);
    startUpdate(async () => {
      try {
        await onStatusChange(task, nextStatus);
      } finally {
        setPendingTaskId(null);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2"
          disabled={isUpdating || pendingTaskId === task.id}
        >
          <TaskStatusBadge status={task.status} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Update status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
