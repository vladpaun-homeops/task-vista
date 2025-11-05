import type { ReactNode } from "react";

import { Priority } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { ChevronDown, ArrowUpRight, AlertTriangle, Flame, SignalLow } from "lucide-react";

type TaskPriorityBadgeProps = {
  priority: Priority;
  withChevron?: boolean;
};

const priorityStyles: Record<
  Priority,
  {
    container: string;
    accent: string;
    icon: ReactNode;
  }
> = {
  [Priority.LOW]: {
    container:
      "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200",
    accent: "bg-slate-600 dark:bg-slate-300",
    icon: <SignalLow className="h-3 w-3" />,
  },
  [Priority.MEDIUM]: {
    container:
      "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-200",
    accent: "bg-amber-600 dark:bg-amber-300",
    icon: <ArrowUpRight className="h-3 w-3" />,
  },
  [Priority.HIGH]: {
    container:
      "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-500/60 dark:bg-orange-500/15 dark:text-orange-200",
    accent: "bg-orange-600 dark:bg-orange-300",
    icon: <Flame className="h-3 w-3" />,
  },
  [Priority.URGENT]: {
    container:
      "border-red-300 bg-red-100 text-red-900 dark:border-red-500/60 dark:bg-red-500/15 dark:text-red-200",
    accent: "bg-red-700 dark:bg-red-400",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

const priorityLabels: Record<Priority, string> = {
  [Priority.LOW]: "Low",
  [Priority.MEDIUM]: "Medium",
  [Priority.HIGH]: "High",
  [Priority.URGENT]: "Urgent",
};

export function TaskPriorityBadge({ priority, withChevron }: TaskPriorityBadgeProps) {
  const style = priorityStyles[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        style.container
      )}
    >
      <span className={cn("h-1.5 w-1 rounded-sm", style.accent)} />
      <span>{priorityLabels[priority]}</span>
      {withChevron ? <ChevronDown className="h-3 w-3 opacity-80" /> : style.icon}
    </span>
  );
}
