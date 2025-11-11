"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, LineChart, ListTodo, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type WelcomeModalProps = {
  sessionId: string;
};

const STORAGE_KEY = "todoapp-session-welcome";

const featureList = [
  {
    icon: <Sparkles className="h-4 w-4 text-primary" />,
    title: "Portfolio demo",
    description: "Built to learn Next.js and showcase a full-stack setup.",
  },
  {
    icon: <ListTodo className="h-4 w-4 text-primary" />,
    title: "Tasks & tags",
    description: "Organize work, attach tags, and stay within a sandboxed quota.",
  },
  {
    icon: <CalendarDays className="h-4 w-4 text-primary" />,
    title: "Drag & drop calendar",
    description: "Reschedule tasks visually and play with the scheduling UI.",
  },
  {
    icon: <LineChart className="h-4 w-4 text-primary" />,
    title: "Activity & reports",
    description: "See stats, recent edits, and summaries of progress.",
  },
];

const quotaList = [
  "Up to 10 tasks & 5 tags per session",
  "50 task edits total",
  "10 tag edits total",
];

export function WelcomeModal({ sessionId }: WelcomeModalProps) {
  usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!sessionId) {
      return;
    }

    const previouslySeen = sessionStorage.getItem(STORAGE_KEY);
    if (previouslySeen === sessionId) {
      return;
    }

    setOpen(true);
  }, [sessionId]);

  const handleClose = React.useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, sessionId);
    setOpen(false);
  }, [sessionId]);

  if (!sessionId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to TaskVista
          </DialogTitle>
          <DialogDescription className="text-base text-foreground/80">
            Part of my portfolio server stack – a Next.js playground for tasks, tags, calendars, and dashboards.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {featureList.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border bg-muted/40 p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                {feature.icon}
                <p className="font-semibold">{feature.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground uppercase tracking-wide">
            Demo sandbox limits
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {quotaList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Explore the Dashboard, Tasks, Tags, drag-and-drop Calendar, Activity feed, and Reports. Everything resets per session so you can’t break my server – just have fun.
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose}>Let me in</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
