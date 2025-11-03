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
    container: "border-slate-500/40 bg-slate-900/60 text-slate-200",
    dot: "bg-slate-300",
    icon: <CircleDashed className="h-3 w-3" />,
  },
  [Status.IN_PROGRESS]: {
    container: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400",
    icon: <Clock3 className="h-3 w-3" />,
  },
  [Status.OVERDUE]: {
    container: "border-red-500/50 bg-red-500/10 text-red-300",
    dot: "bg-red-500",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  [Status.DONE]: {
    container: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
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
