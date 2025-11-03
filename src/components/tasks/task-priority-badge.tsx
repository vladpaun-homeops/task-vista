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
    container: "border-slate-500/30 bg-slate-900/60 text-slate-200",
    accent: "bg-slate-400",
    icon: <SignalLow className="h-3 w-3" />,
  },
  [Priority.MEDIUM]: {
    container: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    accent: "bg-amber-400",
    icon: <ArrowUpRight className="h-3 w-3" />,
  },
  [Priority.HIGH]: {
    container: "border-orange-500/40 bg-orange-500/10 text-orange-300",
    accent: "bg-orange-400",
    icon: <Flame className="h-3 w-3" />,
  },
  [Priority.URGENT]: {
    container: "border-red-500/50 bg-red-500/10 text-red-300",
    accent: "bg-red-500",
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
