// prisma/seed.ts
import { prisma } from "@/server/db"
import { Priority, Status } from "@/generated/prisma/enums"

async function main() {
    const [tagCount, taskCount] = await Promise.all([
        prisma.tag.count(),
        prisma.task.count(),
    ]);

    if (tagCount > 0 || taskCount > 0) {
        console.log("ℹ️ Database already contains data; skipping seed");
        return;
    }

    const tags = [
        { name: "work",  color: "#0EA5E9" }, // sky-500
        { name: "uni",   color: "#A78BFA" }, // violet-400
        { name: "home",  color: "#22C55E" }, // green-500
        { name: "errand",color: "#F97316" }, // orange-500
    ];

    const tagRecords = await Promise.all(
        tags.map((t) => 
            prisma.tag.upsert({
                where: { name: t.name},
                update: { color: t.color },
                create: { name: t.name, color: t.color},
            })
        )
    );

    const byName = Object.fromEntries(tagRecords.map(t => [t.name, t]))


    const tasks = [
        {
        title: "Finish Next.js pages skeleton",
        description: "Layout + routes + server components",
        status: Status.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000), // +2 days
        tags: ["work", "uni"],
        },
        {
        title: "Buy groceries",
        description: "Milk, eggs, vegetables",
        status: Status.NOT_STARTED,
        priority: Priority.MEDIUM,
        dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000),
        tags: ["home", "errand"],
        },
        {
        title: "Pay rent",
        description: null,
        status: Status.OVERDUE,
        priority: Priority.URGENT,
        dueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000), // yesterday
        tags: ["home"],
        },
        {
        title: "Refactor Prisma layer",
        description: "Add indexes, split route handlers",
        status: Status.NOT_STARTED,
        priority: Priority.LOW,
        dueDate: null,
        tags: ["work"],
        },
    ];


    for (const t of tasks) {
        const existing = await prisma.task.findFirst({ where: { title: t.title } });
        if (existing) {
        await prisma.task.update({
            where: { id: existing.id },
            data: {
                description: t.description ?? undefined,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate ?? undefined,
                tags: {
                set: [], // reset existing
                connect: t.tags.map((name) => ({ id: byName[name].id })),
                },
            },
        });
        } else {
        await prisma.task.create({
            data: {
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                tags: {
                connect: t.tags.map((name) => ({ id: byName[name].id })),
                },
            },
        });
        }

    }
}

main()
  .then(async () => {
    console.log("✅ Seed complete");
  })
  .catch(async (e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
