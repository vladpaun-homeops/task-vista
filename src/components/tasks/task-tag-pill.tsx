type TaskTagPillProps = {
  name: string;
  color?: string | null;
  isActive?: boolean;
  className?: string;
};

function hexToRgba(hex: string, alpha: number) {
  if (!hex) return `rgba(148, 163, 184, ${alpha})`;
  const normalized = hex.replace("#", "");
  const isShort = normalized.length === 3;
  const r = parseInt(isShort ? normalized[0].repeat(2) : normalized.slice(0, 2), 16);
  const g = parseInt(isShort ? normalized[1].repeat(2) : normalized.slice(2, 4), 16);
  const b = parseInt(isShort ? normalized[2].repeat(2) : normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

import { cn } from "@/lib/utils";

export function TaskTagPill({ name, color, isActive = false, className }: TaskTagPillProps) {
  const borderColor = color ?? "rgba(148, 163, 184, 0.6)";
  const backgroundColor = hexToRgba(color ?? "#94a3b8", isActive ? 0.28 : 0.16);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-foreground transition dark:text-foreground/90",
        isActive ? "ring-2 ring-offset-1 ring-offset-background" : "",
        className
      )}
      style={{ borderColor, backgroundColor }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full border border-background"
        style={{ backgroundColor: color ?? "#94a3b8" }}
      />
      {name}
    </span>
  );
}
