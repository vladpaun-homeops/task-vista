// src/app/page.tsx
import { prisma } from "@/server/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
          <li key={t.id} >
            <Card>
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>Due: {t.dueDate ? new Date(t.dueDate).toLocaleString() : "—"}</CardDescription>
                <CardAction>
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
                </CardAction>
              </CardHeader>
              <CardContent>
                <p>{t.description ?? t.title}</p>
              </CardContent>
              <CardFooter>
                <p>{t.status} • {t.priority}</p>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
