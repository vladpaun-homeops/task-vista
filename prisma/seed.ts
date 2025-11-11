// prisma/seed.ts
import { prisma } from "@/server/db";

async function main() {
  const sessionCount = await prisma.session.count();
  if (sessionCount > 0) {
    console.log("ℹ️ Session data already exists; nothing to seed.");
    return;
  }

  await prisma.session.create({
    data: {},
  });

  console.log("✅ Created an initial empty session. Runtime seeding happens per visitor.");
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
