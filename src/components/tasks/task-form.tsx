'use client';

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Priority, Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { priorityOptions, statusOptions } from "@/lib/constants";
import {
  taskFormSchema,
  type TaskFormValues,
} from "@/lib/validations/task";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagMultiSelect, type TagOption } from "@/components/tags/tag-multi-select";

type TaskFormProps = {
  onSubmit: (values: TaskFormValues) => Promise<{ success: boolean; error?: string } | void>;
  defaultValues?: Partial<TaskFormValues>;
  submitLabel?: string;
  onSuccess?: () => void;
  tags: TagOption[];
};

const defaultTaskValues: TaskFormValues = {
  title: "",
  description: "",
  dueDate: null,
  priority: Priority.LOW,
  status: Status.NOT_STARTED,
  tagIds: [],
};

export function TaskForm({
  onSubmit,
  defaultValues,
  submitLabel = "Save task",
  onSuccess,
  tags,
}: TaskFormProps) {
  const normalizedDefaults = React.useMemo(() => {
    const values = { ...defaultTaskValues, ...(defaultValues ?? {}) };

    return {
      ...values,
      title: values.title,
      description: values.description ?? "",
      dueDate: values.dueDate ? new Date(values.dueDate) : null,
      priority: values.priority ?? defaultTaskValues.priority,
      status: values.status ?? defaultTaskValues.status,
      tagIds: values.tagIds ?? [],
    } satisfies TaskFormValues;
  }, [defaultValues]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: normalizedDefaults,
  });

  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const submitHandler = form.handleSubmit((values) => {
    setError(null);

    startTransition(async () => {
      const result = await onSubmit(values);
      if (result && "success" in result && !result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      if (!defaultValues) {
        form.reset(defaultTaskValues);
      }

      onSuccess?.();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submitHandler} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="What needs to be done?" {...field} />
              </FormControl>
              <FormDescription>
                Keep it short and actionable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes, context, or acceptance criteria..."
                  rows={4}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : "No due date"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {field.value && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-xs text-muted-foreground"
                    onClick={() => field.onChange(null)}
                  >
                    Clear due date
                  </Button>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tagIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagMultiSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={tags}
                  placeholder="Add tags"
                />
              </FormControl>
              <FormDescription>Organize tasks with tags for easier filtering.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
