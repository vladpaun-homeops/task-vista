'use client';

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TagOption } from "@/components/tags/tag-multi-select";
import type { Status } from "@/generated/prisma/enums";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type TaskFiltersProps = {
  statusOptions: SelectOption<Status>[];
  tags: TagOption[];
};

export function TaskFilters({ statusOptions, tags }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");

  React.useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const status = searchParams.get("status");
  const tag = searchParams.get("tag");

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

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Search by title or description…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full md:w-72"
        />
        <div className="flex gap-3">
          <Select
            value={status ?? undefined}
            onValueChange={(value) =>
              updateQuery({ status: value === "ALL" ? null : value })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={tag ?? undefined}
            onValueChange={(value) =>
              updateQuery({ tag: value === "ALL" ? null : value })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All tags</SelectItem>
              {tags.map((tagOption) => (
                <SelectItem key={tagOption.id} value={tagOption.id}>
                  {tagOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="w-full md:w-auto"
        onClick={() => {
          setQuery("");
          router.replace(pathname, { scroll: false });
        }}
      >
        <XCircle className="mr-2 h-4 w-4" />
        Reset filters
      </Button>
    </div>
  );
}
