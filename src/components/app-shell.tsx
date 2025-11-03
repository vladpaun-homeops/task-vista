'use client';

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  CalendarDays,
  Home,
  ListTodo,
  Settings,
  Tag as TagIcon,
  LineChart,
  Sparkles,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: ReactNode;
};

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Tags", href: "/tags", icon: TagIcon },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Reports", href: "/reports", icon: LineChart },
  { label: "Settings", href: "/settings", icon: Settings },
] satisfies Array<{ label: string; href: string; icon: ComponentType<{ className?: string }> }>;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            Todo AI
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Overview
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                      <Link href={item.href} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="mt-auto flex items-center justify-between gap-2 px-4 py-4">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/tasks?status=NOT_STARTED">Quick Start</Link>
          </Button>
          <ModeToggle />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {navigation.find((item) => pathname.startsWith(item.href))?.label ?? "Dashboard"}
            </p>
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild size="sm">
                <Link href="/tasks">View tasks</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/tags">Manage tags</Link>
              </Button>
            </div>
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
