import type { ReactNode } from "react";

import { Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { ChevronDown, Clock3, CheckCircle2, CircleDashed, AlertTriangle } from "lucide-react";

type TaskStatusBadgeProps = {
  status: Status;
  withChevron?: boolean;
  className?: string;
};

const statusStyles: Record<
  Status,
  { container: string; dot: string; icon: ReactNode }
> = {
  [Status.NOT_STARTED]: {
    container:
      "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200",
    dot: "bg-slate-500 dark:bg-slate-300",
    icon: <CircleDashed className="h-3 w-3" />,
  },
  [Status.IN_PROGRESS]: {
    container:
      "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-200",
    dot: "bg-sky-600 dark:bg-sky-300",
    icon: <Clock3 className="h-3 w-3" />,
  },
  [Status.OVERDUE]: {
    container:
      "border-red-300 bg-red-100 text-red-900 dark:border-red-500/60 dark:bg-red-500/15 dark:text-red-200",
    dot: "bg-red-700 dark:bg-red-400",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  [Status.DONE]: {
    container:
      "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200",
    dot: "bg-emerald-600 dark:bg-emerald-300",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

const statusLabels: Record<Status, string> = {
  [Status.NOT_STARTED]: "Not started",
  [Status.IN_PROGRESS]: "In progress",
  [Status.OVERDUE]: "Overdue",
  [Status.DONE]: "Done",
};

export function TaskStatusBadge({ status, withChevron, className }: TaskStatusBadgeProps) {
  const style = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
        style.container,
        className
      )}
    >
      <span className={cn("flex h-1.5 w-1.5 rounded-full", style.dot)} />
      <span className="flex items-center gap-1">{statusLabels[status]}</span>
      {withChevron ? <ChevronDown className="h-3 w-3 opacity-80" /> : style.icon}
    </span>
  );
}
