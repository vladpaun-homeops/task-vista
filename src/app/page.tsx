// src/app/page.tsx
import { prisma } from "@/server/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
const apiBase = new URL("/api/ai/", base)
const healthUrl = new URL("health", apiBase);
const categorizeUrl = new URL("categorize", apiBase)


export default async function Home() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: { tags: true },
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">API</h1>
      <div className="flex gap-4">
        <Button><Link href={healthUrl.toString()}>Check API health</Link></Button>
        <form action={categorizeUrl.toString()} method="POST" className="flex gap-1">
          <Input type="text" name="text"></Input>
          <Button type="submit">Submit</Button>
        </form>
      </div>
      <h1 className="text-2xl font-semibold">Seeded Tasks</h1>
      <ul className="space-y-3">
        {tasks.map((t) => (
          <li key={t.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t.title}</span>
              <span className="text-sm opacity-70">
                {t.status} • {t.priority}
              </span>
            </div>
            {t.description && (
              <p className="text-sm mt-1 opacity-90">{t.description}</p>
            )}
            <div className="text-sm mt-2 opacity-80">
              Due: {t.dueDate ? new Date(t.dueDate).toLocaleString() : "—"}
            </div>
            {t.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {t.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 rounded text-xs border"
                    style={{ background: tag.color ?? undefined }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
