import { statusOptions } from "@/lib/constants";
import type { Status } from "@/generated/prisma/enums";

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
  const tones: Record<Status, { border: string; dot: string; background: string; text: string }> = {
    NOT_STARTED: {
      border: "border-slate-600/50",
      dot: "bg-slate-300",
      background: "bg-slate-900/60",
      text: "text-slate-100",
    },
    IN_PROGRESS: {
      border: "border-sky-500/40",
      dot: "bg-sky-400",
      background: "bg-sky-500/10",
      text: "text-sky-100",
    },
    OVERDUE: {
      border: "border-red-500/50",
      dot: "bg-red-500",
      background: "bg-red-500/10",
      text: "text-red-100",
    },
    DONE: {
      border: "border-emerald-500/50",
      dot: "bg-emerald-500",
      background: "bg-emerald-500/10",
      text: "text-emerald-100",
    },
  };

  const tone = tones[status];

  return (
    <div
      className={
        "flex min-w-[180px] items-center justify-between rounded-md border px-3 py-2 " +
        `${tone.border} ${tone.background}`
      }
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">
          {label}
        </span>
      </div>
      <span className={`text-lg font-semibold ${tone.text}`}>{value}</span>
    </div>
  );
}
