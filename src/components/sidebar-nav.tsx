'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type SidebarNavProps = {
  items: SidebarItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(`${href}/`));

        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "group flex w-full items-center justify-start gap-2 px-3 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                "[&_svg]:text-muted-foreground"
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-background group-hover:bg-primary/10">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
