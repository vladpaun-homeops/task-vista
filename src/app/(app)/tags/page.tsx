import { TagsClient } from "@/components/tags/tags-client";
import { prisma } from "@/server/db";
import { getSessionId } from "@/server/session";

export default async function TagsPage() {
  const sessionId = await getSessionId();
  const tags = await prisma.tag.findMany({
    where: { sessionId },
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  const tagsForClient = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    usageCount: tag._count.tasks,
  }));

  return <TagsClient tags={tagsForClient} />;
}
