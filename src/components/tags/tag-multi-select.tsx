'use client';

import * as React from "react";

import { Check, ChevronsUpDown, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type TagOption = {
  id: string;
  name: string;
  color: string | null;
  usageCount?: number;
};

type TagMultiSelectProps = {
  options: TagOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

export function TagMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select tags",
}: TagMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedTags = React.useMemo(
    () => options.filter((option) => value.includes(option.id)),
    [options, value]
  );

  const toggleTag = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((tagId) => tagId !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {selectedTags.length > 0 ? (
                <span>{selectedTags.length} selected</span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="max-h-48">
                  {options.map((option) => {
                    const isSelected = value.includes(option.id);
                    return (
                      <CommandItem
                        key={option.id}
                        value={option.name}
                        onSelect={() => toggleTag(option.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{option.name}</span>
                        {option.color && (
                          <span
                            className="ml-auto h-3 w-3 rounded-full border"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              <span
                className="h-2 w-2 rounded-full border"
                style={{ backgroundColor: tag.color ?? undefined }}
              />
              {tag.name}
              <button
                type="button"
                className="ml-1 text-xs text-muted-foreground transition hover:text-foreground"
                onClick={() => toggleTag(tag.id)}
                aria-label={`Remove ${tag.name}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
