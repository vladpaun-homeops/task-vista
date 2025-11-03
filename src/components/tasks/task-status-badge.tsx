import { Badge } from "@/components/ui/badge";
import { Status } from "@/generated/prisma/enums";

type TaskStatusBadgeProps = {
  status: Status;
};

const statusStyles: Record<Status, string> = {
  [Status.NOT_STARTED]: "bg-muted text-muted-foreground",
  [Status.IN_PROGRESS]: "bg-blue-500/10 text-blue-500",
  [Status.OVERDUE]: "bg-destructive/10 text-destructive",
  [Status.DONE]: "bg-emerald-500/10 text-emerald-500",
};

const statusLabels: Record<Status, string> = {
  [Status.NOT_STARTED]: "Not started",
  [Status.IN_PROGRESS]: "In progress",
  [Status.OVERDUE]: "Overdue",
  [Status.DONE]: "Done",
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {statusLabels[status]}
    </Badge>
  );
}
