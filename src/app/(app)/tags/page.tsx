import { TagsClient } from "@/components/tags/tags-client";
import { prisma } from "@/server/db";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
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
