import { Priority, Status } from "@/generated/prisma/enums";

export const statusOptions: { value: Status; label: string }[] = [
  { value: Status.NOT_STARTED, label: "Not started" },
  { value: Status.IN_PROGRESS, label: "In progress" },
  { value: Status.OVERDUE, label: "Overdue" },
  { value: Status.DONE, label: "Done" },
];

export const priorityOptions: { value: Priority; label: string }[] = [
  { value: Priority.LOW, label: "Low" },
  { value: Priority.MEDIUM, label: "Medium" },
  { value: Priority.HIGH, label: "High" },
  { value: Priority.URGENT, label: "Urgent" },
];
