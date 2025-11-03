import { Badge } from "@/components/ui/badge";
import { Priority } from "@/generated/prisma/enums";

type TaskPriorityBadgeProps = {
  priority: Priority;
};

const priorityStyles: Record<Priority, string> = {
  [Priority.LOW]: "bg-muted text-muted-foreground",
  [Priority.MEDIUM]: "bg-amber-500/10 text-amber-500",
  [Priority.HIGH]: "bg-orange-500/10 text-orange-500",
  [Priority.URGENT]: "bg-red-500/10 text-red-500",
};

const priorityLabels: Record<Priority, string> = {
  [Priority.LOW]: "Low",
  [Priority.MEDIUM]: "Medium",
  [Priority.HIGH]: "High",
  [Priority.URGENT]: "Urgent",
};

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <Badge variant="outline" className={priorityStyles[priority]}>
      {priorityLabels[priority]}
    </Badge>
  );
}
