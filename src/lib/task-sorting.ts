import { Priority, Status } from "@/generated/prisma/enums";

export type TaskSortKey = "dueDate" | "priority" | "status" | "createdAt";
export type SortDirection = "asc" | "desc";
export type SortConfig = { key: TaskSortKey; direction: SortDirection } | null;

type SortableTask = {
  dueDate: string | null;
  priority: Priority;
  status: Status;
  createdAt?: string | null;
};

const PRIORITY_ORDER: Record<Priority, number> = {
  [Priority.URGENT]: 0,
  [Priority.HIGH]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 3,
};

const STATUS_ORDER: Record<Status, number> = {
  [Status.OVERDUE]: 0,
  [Status.IN_PROGRESS]: 1,
  [Status.NOT_STARTED]: 2,
  [Status.DONE]: 3,
};

export function nextSortConfig(current: SortConfig, key: TaskSortKey): SortConfig {
  if (!current || current.key !== key) {
    return { key, direction: "asc" };
  }

  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }

  return null;
}

export function sortTasks<T extends SortableTask>(tasks: T[], config: SortConfig): T[] {
  if (!config) {
    return tasks;
  }

  const sorted = [...tasks];
  const directionMultiplier = config.direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (config.key) {
      case "dueDate": {
        const aTime = a.dueDate ? Date.parse(a.dueDate) : null;
        const bTime = b.dueDate ? Date.parse(b.dueDate) : null;
        if (aTime === null && bTime === null) return 0;
        if (aTime === null) return 1;
        if (bTime === null) return -1;
        return (aTime - bTime) * directionMultiplier;
      }
      case "priority": {
        const aRank = PRIORITY_ORDER[a.priority] ?? Number.MAX_SAFE_INTEGER;
        const bRank = PRIORITY_ORDER[b.priority] ?? Number.MAX_SAFE_INTEGER;
        return (aRank - bRank) * directionMultiplier;
      }
      case "status": {
        const aRank = STATUS_ORDER[a.status] ?? Number.MAX_SAFE_INTEGER;
        const bRank = STATUS_ORDER[b.status] ?? Number.MAX_SAFE_INTEGER;
        return (aRank - bRank) * directionMultiplier;
      }
      case "createdAt": {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : null;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : null;
        if (aTime === null && bTime === null) return 0;
        if (aTime === null) return 1;
        if (bTime === null) return -1;
        return (aTime - bTime) * directionMultiplier;
      }
      default:
        return 0;
    }
  });

  return sorted;
}
