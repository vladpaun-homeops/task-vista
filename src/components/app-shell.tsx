'use client';

import type { ReactNode } from "react";
import Link from "next/link";

import { Activity, CalendarDays, Home, LineChart, Settings, Tag, ListTodo } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { SidebarNav, type SidebarItem } from "@/components/sidebar-nav";

type AppShellProps = {
  children: ReactNode;
};

const navigation: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: ListTodo,
  },
  {
    label: "Tags",
    href: "/tags",
    icon: Tag,
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Activity",
    href: "/activity",
    icon: Activity,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: LineChart,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 border-r bg-muted/20 md:flex md:flex-col">
        <div className="flex items-center justify-between gap-2 px-2 py-3">
          <Link href="/dashboard" className="text-xl font-semibold">
            Todo AI
          </Link>
          <ModeToggle />
        </div>
        <nav className="mt-6 flex-1 space-y-1 px-2">
          <SidebarNav items={navigation} />
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <Link href="/dashboard" className="text-lg font-semibold">
            Todo AI
          </Link>
          <ModeToggle />
        </header>
        <main className="flex-1 px-4 py-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}
