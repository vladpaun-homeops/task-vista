'use client';

import * as React from "react";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Priority, Status } from "@/generated/prisma/enums";
import { cn, formatDateLabel } from "@/lib/utils";
import { sortTasks, nextSortConfig, type SortConfig, type TaskSortKey } from "@/lib/task-sorting";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  selectable?: boolean;
  selectedIds?: Set<string> | string[];
  onSelectChange?: (taskId: string, selected: boolean) => void;
  onSelectAll?: (taskIds: string[], selected: boolean) => void;
};

export function TaskTable({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  selectable = true,
  selectedIds,
  onSelectChange,
  onSelectAll,
}: TaskTableProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "dueDate",
    direction: "asc",
  });
  const [now, setNow] = React.useState(() => Date.now());
  const [deleteTarget, setDeleteTarget] = React.useState<TaskRow | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, startDeleting] = React.useTransition();

  React.useEffect(() => {
    setNow(Date.now());
  }, [tasks]);

  const sortedTasks = React.useMemo(
    () => sortTasks(tasks, sortConfig),
    [tasks, sortConfig]
  );

  const isSelectable = selectable && typeof onSelectChange === "function";

  const selectedIdSet = React.useMemo(() => {
    if (!selectedIds) return new Set<string>();
    return selectedIds instanceof Set ? new Set(selectedIds) : new Set(selectedIds);
  }, [selectedIds]);

  const allIds = React.useMemo(() => sortedTasks.map((task) => task.id), [sortedTasks]);
  const selectedCountInView = isSelectable
    ? allIds.reduce((count, id) => count + (selectedIdSet.has(id) ? 1 : 0), 0)
    : 0;
  const allSelected = isSelectable && allIds.length > 0 && selectedCountInView === allIds.length;
  const someSelected = isSelectable && selectedCountInView > 0 && selectedCountInView < allIds.length;

  const handleSortToggle = React.useCallback((key: TaskSortKey) => {
    setSortConfig((current) => nextSortConfig(current, key));
  }, []);

  const getDirectionFor = React.useCallback(
    (key: TaskSortKey) =>
      sortConfig && sortConfig.key === key ? sortConfig.direction : null,
    [sortConfig]
  );

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              {isSelectable ? (
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) =>
                    onSelectAll?.(allIds, checked === true)
                  }
                  disabled={!onSelectAll}
                  aria-label="Select all"
                />
              ) : (
                <span className="sr-only">Select</span>
              )}
            </TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Complete</span>
            </TableHead>
            <TableHead>Task</TableHead>
            <TableHead>
              <HeaderSortButton
                label="Status"
                direction={getDirectionFor("status")}
                onClick={() => handleSortToggle("status")}
              />
            </TableHead>
            <TableHead>
              <HeaderSortButton
                label="Priority"
                direction={getDirectionFor("priority")}
                onClick={() => handleSortToggle("priority")}
              />
            </TableHead>
            <TableHead>
              <HeaderSortButton
                label="Due"
                icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
                direction={getDirectionFor("dueDate")}
                onClick={() => handleSortToggle("dueDate")}
              />
            </TableHead>
            <TableHead>
              <HeaderSortButton
                label="Created"
                direction={getDirectionFor("createdAt")}
                onClick={() => handleSortToggle("createdAt")}
              />
            </TableHead>
            <TableHead className="w-20 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.length ? (
            sortedTasks.map((task) => {
              const dueDate = task.dueDate ? new Date(task.dueDate) : null;
              const isPastDue = dueDate ? dueDate.getTime() < now : false;
              const dueDateLabel = task.dueDate ? formatDateLabel(task.dueDate) : null;
              const createdAtDate = task.createdAt ? new Date(task.createdAt) : null;
              const createdAtLabel =
                createdAtDate && !Number.isNaN(createdAtDate.getTime())
                  ? formatDistanceToNow(createdAtDate, { addSuffix: true })
                  : null;

              return (
                <TableRow key={task.id}>
                  <TableCell className="w-8">
                    {isSelectable && (
                      <Checkbox
                        checked={selectedIdSet.has(task.id)}
                        onCheckedChange={(checked) =>
                          onSelectChange?.(task.id, checked === true)
                        }
                        aria-label={`Select ${task.title}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="w-12">
                    <TaskCompleteButton
                      task={task}
                      onComplete={(completedTask) => onStatusChange(completedTask, Status.DONE)}
                    />
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <TaskStatusMenuButton task={task} onStatusChange={onStatusChange} />
                </TableCell>
                <TableCell>
                  <TaskPriorityMenuButton task={task} onPriorityChange={onPriorityChange} />
                </TableCell>
                <TableCell>
                  {dueDateLabel ? (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isPastDue ? "text-destructive" : "text-foreground"
                      )}
                    >
                      {dueDateLabel}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {task.dueDate ? "Invalid date" : "No due date"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {createdAtLabel ? (
                    <span className="text-xs text-muted-foreground">{createdAtLabel}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="w-20">
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
                </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                No tasks found. Adjust your filters or add one above.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SortIndicator({ direction }: { direction: "asc" | "desc" | null }) {
  if (!direction) {
    return null;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function HeaderSortButton({
  label,
  direction,
  onClick,
  icon,
}: {
  label: string;
  direction: "asc" | "desc" | null;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 gap-2"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <SortIndicator direction={direction} />
    </Button>
  );
}
