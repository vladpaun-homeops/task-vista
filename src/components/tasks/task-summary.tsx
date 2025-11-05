import type { Status } from "@/generated/prisma/enums";
import { statusOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";

type TaskSummaryProps = {
  counts: Partial<Record<Status, number>>;
};

export function TaskSummary({ counts }: TaskSummaryProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {statusOptions.map((option) => (
        <StatusSummaryChip
          key={option.value}
          label={option.label}
          value={counts[option.value] ?? 0}
          status={option.value}
        />
      ))}
    </div>
  );
}

function StatusSummaryChip({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: Status;
}) {
  const tones: Record<
    Status,
    { container: string; dot: string; label: string; value: string }
  > = {
    NOT_STARTED: {
      container:
        "border-slate-300 bg-slate-100 dark:border-slate-700/60 dark:bg-slate-900/60",
      dot: "bg-slate-600 dark:bg-slate-300",
      label: "text-slate-700 dark:text-slate-200",
      value: "text-slate-900 dark:text-slate-100",
    },
    IN_PROGRESS: {
      container:
        "border-sky-300 bg-sky-100 dark:border-sky-500/60 dark:bg-sky-500/15",
      dot: "bg-sky-600 dark:bg-sky-300",
      label: "text-sky-800 dark:text-sky-200",
      value: "text-sky-900 dark:text-sky-100",
    },
    OVERDUE: {
      container:
        "border-red-300 bg-red-100 dark:border-red-500/60 dark:bg-red-500/15",
      dot: "bg-red-700 dark:bg-red-400",
      label: "text-red-800 dark:text-red-200",
      value: "text-red-900 dark:text-red-100",
    },
    DONE: {
      container:
        "border-emerald-300 bg-emerald-100 dark:border-emerald-500/60 dark:bg-emerald-500/15",
      dot: "bg-emerald-600 dark:bg-emerald-300",
      label: "text-emerald-800 dark:text-emerald-200",
      value: "text-emerald-900 dark:text-emerald-100",
    },
  };

  const tone = tones[status];

  return (
    <div
      className={cn(
        "flex min-w-[180px] items-center justify-between rounded-md border px-3 py-2 transition-colors",
        tone.container
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", tone.dot)} />
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            tone.label
          )}
        >
          {label}
        </span>
      </div>
      <span className={cn("text-lg font-semibold", tone.value)}>{value}</span>
    </div>
  );
}
