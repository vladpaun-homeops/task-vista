import { CalendarBoard, type CalendarBoardTask } from "@/components/tasks/calendar-board";
import { prisma } from "@/server/db";
import { getSessionId } from "@/server/session";

export default async function CalendarPage() {
  const sessionId = await getSessionId();
  const tasks = await prisma.task.findMany({
    where: { sessionId },
    include: { tags: true },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });

  const tasksForClient: CalendarBoardTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    tags: task.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
  }));

  return <CalendarBoard tasks={tasksForClient} />;
}
