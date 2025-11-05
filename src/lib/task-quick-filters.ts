import type { LucideIcon } from "lucide-react";
import { AlarmClock, CalendarClock, CalendarX2, CheckCircle2 } from "lucide-react";

export const taskQuickFilters = [
  {
    value: "overdue",
    label: "Overdue",
    description: "Due date has passed and task is still open.",
    icon: AlarmClock,
  },
  {
    value: "due-soon",
    label: "Due soon",
    description: "Due within the next 7 days.",
    icon: CalendarClock,
  },
  {
    value: "no-due",
    label: "No due date",
    description: "Due date not set yet.",
    icon: CalendarX2,
  },
  {
    value: "completed",
    label: "Completed",
    description: "Tasks marked as done.",
    icon: CheckCircle2,
  },
 ] as const satisfies ReadonlyArray<{
  value: "overdue" | "due-soon" | "no-due" | "completed";
  label: string;
  description: string;
  icon: LucideIcon;
}>;

export type TaskQuickFilterValue = (typeof taskQuickFilters)[number]["value"];

export const taskQuickFilterValues = taskQuickFilters.map((filter) => filter.value) as TaskQuickFilterValue[];
