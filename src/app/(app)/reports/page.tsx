import { addDays, differenceInCalendarDays, format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/server/db";

export default async function ReportsPage() {
  const thirtyDaysAgo = addDays(new Date(), -30);

  const [statusGroups, priorityGroups, tags, completed, overdue] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.task.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.tag.findMany({ include: { _count: { select: { tasks: true } } }, orderBy: { name: "asc" } }),
    prisma.task.findMany({
      where: { status: "DONE", updatedAt: { gte: thirtyDaysAgo } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: { status: { not: "DONE" }, dueDate: { lt: new Date() } },
    }),
  ]);

  const totalTasks = statusGroups.reduce((acc, group) => acc + group._count._all, 0);
  const totalCompleted = completed.length;
  const avgCompletionPerDay = totalCompleted === 0
    ? 0
    : Number((totalCompleted / Math.max(1, differenceInCalendarDays(new Date(), thirtyDaysAgo))).toFixed(2));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Reports & Insights</h1>
        <p className="text-muted-foreground">
          Analyze overall status, priority balance, tag distribution, and completion velocity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total tasks</CardTitle>
            <CardDescription>Everything tracked in the workspace right now.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{totalTasks}</p>
            <p className="text-sm text-muted-foreground">Includes active and completed tasks.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed (30 days)</CardTitle>
            <CardDescription>Closed tasks in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{totalCompleted}</p>
            <p className="text-sm text-muted-foreground">≈ {avgCompletionPerDay} per day on average.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
            <CardDescription>Tasks past due that still need attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{overdue.length}</p>
            <p className="text-sm text-muted-foreground">Overdue count as of {format(new Date(), "PPP")}.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>Distribution of tasks by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusGroups.map((group) => (
                  <TableRow key={group.status}>
                    <TableCell className="capitalize">{group.status.toLowerCase().replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{group._count._all}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority breakdown</CardTitle>
            <CardDescription>Balance of urgency levels across tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityGroups.map((group) => (
                  <TableRow key={group.priority}>
                    <TableCell>{group.priority}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{group._count._all}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tag distribution</CardTitle>
          <CardDescription>How tags are used across tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead className="text-right">Tasks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                    No tags yet.
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: tag.color ?? undefined }}
                      />
                      {tag.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{tag._count.tasks}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
