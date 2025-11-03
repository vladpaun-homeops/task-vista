import { CalendarView } from "@/components/tasks/calendar-view";
import { prisma } from "@/server/db";

export default async function CalendarPage() {
  const tasks = await prisma.task.findMany({
    include: { tags: true },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const tasksForClient = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority,
    status: task.status,
    tags: task.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
  }));

  return <CalendarView tasks={tasksForClient} />;
}
