'use client';

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  CalendarDays,
  Home,
  LineChart,
  ListTodo,
  Plus,
  Settings,
  Sparkles,
  Tag as TagIcon,
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
import { Toaster } from "@/components/ui/sonner";

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
            <span className="group-data-[collapsible=icon]:hidden">TaskVista</span>
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
        <SidebarFooter className="mt-auto px-4 py-4">
          <Button asChild size="sm" className="w-full justify-center">
            <Link href="/tasks?create=1" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Add task</span>
            </Link>
          </Button>
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
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/tasks">View tasks</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                <Link href="/tags">Manage tags</Link>
              </Button>
              <ModeToggle />
            </div>
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </SidebarInset>
      <Toaster position="bottom-right" richColors closeButton duration={4000} />
    </SidebarProvider>
  );
}
