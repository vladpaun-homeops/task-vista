import { statusOptions } from "@/lib/constants";
import type { Status } from "@/generated/prisma/enums";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TaskSummaryProps = {
  counts: Partial<Record<Status, number>>;
};

export function TaskSummary({ counts }: TaskSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statusOptions.map((option) => (
        <Card key={option.value} className="border-muted">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {option.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {counts[option.value] ?? 0}
            </p>
            <CardDescription>Total tasks</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
