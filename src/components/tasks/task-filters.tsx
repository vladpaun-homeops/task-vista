'use client';

import * as React from "react";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Filter, SlidersHorizontal, XCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskTagPill } from "@/components/tasks/task-tag-pill";
import type { TagOption } from "@/components/tags/tag-multi-select";
import { Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { taskQuickFilters, type TaskQuickFilterValue } from "@/lib/task-quick-filters";

type TaskFiltersProps = {
  statusOptions: { value: Status; label: string }[];
  tags: TagOption[];
};

export function TaskFilters({ statusOptions, tags }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");
  const [tagPickerOpen, setTagPickerOpen] = useState(false);

  React.useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const status = searchParams.get("status");
  const tag = searchParams.get("tag");
  const view = searchParams.get("view");

  const topTags = useMemo(() => tags.slice(0, 5), [tags]);
  const moreTags = tags.slice(5);

  const updateQuery = React.useCallback(
    (next: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(next).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const onSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      updateQuery({ q: query.trim() || null });
    },
    [query, updateQuery]
  );

  const handleQuickFilterToggle = React.useCallback(
    (value: TaskQuickFilterValue) => {
      const nextActive = view === value;
      updateQuery({
        view: nextActive ? null : value,
        ...(nextActive ? {} : { status: null }),
      });
    },
    [updateQuery, view]
  );

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search by title or description…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full"
          />
        </div>
        <Button type="submit" variant="secondary" className="hidden sm:inline-flex">
          <Filter className="mr-2 h-4 w-4" />
          Apply
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQuery("");
            router.replace(pathname, { scroll: false });
          }}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </form>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Quick filters
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuickFilterChip
            label="All"
            description="Show every task."
            active={!view}
            onClick={() => updateQuery({ view: null })}
          />
          {taskQuickFilters.map((filter) => (
            <QuickFilterChip
              key={filter.value}
              label={filter.label}
              description={filter.description}
              icon={filter.icon}
              active={view === filter.value}
              onClick={() => handleQuickFilterToggle(filter.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Status</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusFilterPill
            label="All"
            active={!status || status === "ALL"}
            onClick={() => updateQuery({ status: null })}
          />
          {statusOptions.map((option) => (
            <StatusFilterPill
              key={option.value}
              label={option.label}
              active={status === option.value}
              onClick={() =>
                updateQuery({
                  status: status === option.value ? null : option.value,
                })
              }
              status={option.value}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Tags</span>
          {moreTags.length > 0 && (
            <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1 text-xs px-2">
                  <SlidersHorizontal className="h-3 w-3" />
                  More
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Filter tags..." />
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="ALL"
                      onSelect={() => {
                        updateQuery({ tag: null });
                        setTagPickerOpen(false);
                      }}
                    >
                      All tags
                    </CommandItem>
                    {tags.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => {
                          updateQuery({ tag: item.id });
                          setTagPickerOpen(false);
                        }}
                      >
                        {item.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <TagFilterPill
            label="All tags"
            active={!tag || tag === "ALL"}
            onClick={() => updateQuery({ tag: null })}
          />
          {topTags.map((tagOption) => (
            <TagFilterPill
              key={tagOption.id}
              tag={tagOption}
              active={tag === tagOption.id}
              onClick={() =>
                updateQuery({
                  tag: tag === tagOption.id ? null : tagOption.id,
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickFilterChip({
  label,
  description,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  description: string;
  icon?: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground"
      )}
      aria-pressed={active}
      title={description}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function StatusFilterPill({
  label,
  status,
  active,
  onClick,
}: {
  label: string;
  status?: Status;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      {status ? (
        <TaskStatusBadge
          status={status}
          className={cn(
            active
              ? "ring-2 ring-primary/60 ring-offset-1 ring-offset-background"
              : "opacity-75 hover:opacity-100"
          )}
        />
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
            active
              ? "border-primary/60 bg-primary/20 text-primary"
              : "border-border text-muted-foreground"
          )}
        >
          {label}
        </span>
      )}
    </button>
  );
}

function TagFilterPill({
  label,
  tag,
  active,
  onClick,
}: {
  label?: string;
  tag?: TagOption;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}>
      {tag ? (
        <TaskTagPill name={tag.name} color={tag.color} isActive={active} />
      ) : (
        <TaskTagPill name={label ?? "All tags"} color={undefined} isActive={active} />
      )}
    </button>
  );
}
