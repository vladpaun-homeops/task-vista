import * as React from "react";

import { CalendarIcon } from "lucide-react";

import { Priority, Status } from "@/generated/prisma/enums";
import type { TaskFormValues } from "@/lib/validations/task";
import { priorityOptions, statusOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagMultiSelect, type TagOption } from "@/components/tags/tag-multi-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type TaskEditorProps = {
  tags: TagOption[];
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
  initialValues?: Partial<TaskFormValues>;
};

const defaultValues: TaskFormValues = {
  title: "",
  description: "",
  dueDate: null,
  priority: Priority.LOW,
  status: Status.NOT_STARTED,
  tagIds: [],
};

function buildInitialValues(initial?: Partial<TaskFormValues>): TaskFormValues {
  return {
    ...defaultValues,
    ...initial,
    description: initial?.description ?? "",
    dueDate: initial?.dueDate ? new Date(initial.dueDate) : null,
    tagIds: initial?.tagIds ?? [],
  };
}

export function TaskEditor({
  tags,
  submitLabel,
  onSubmit,
  onSuccess,
  initialValues,
}: TaskEditorProps) {
  const [values, setValues] = React.useState<TaskFormValues>(() => buildInitialValues(initialValues));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setValues(buildInitialValues(initialValues));
    setError(null);
  }, [initialValues]);

  const updateField = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit(values);
      if (!result.success) {
        setError(result.error ?? "Unable to save task.");
        return;
      }
      onSuccess?.();
    } catch (submissionError) {
      setError("Unexpected error. Please try again.");
      console.error("[TaskEditor]", submissionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="task-title">
          Title
        </label>
        <Input
          id="task-title"
          value={values.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="What needs to get done?"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="task-description">
          Description
        </label>
        <Textarea
          id="task-description"
          value={values.description ?? ""}
          rows={4}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Add any extra context or notes."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="task-due">
          Due date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !values.dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">
                {values.dueDate ? values.dueDate.toLocaleDateString() : "No due date"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={values.dueDate ?? undefined}
              onSelect={(date) => updateField("dueDate", date ?? null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {values.dueDate && (
          <Button
            type="button"
            variant="link"
            className="px-0 text-sm text-muted-foreground"
            onClick={() => updateField("dueDate", null)}
          >
            Clear due date
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Priority</label>
        <Select
          value={values.priority}
          onValueChange={(value) => updateField("priority", value as Priority)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Status</label>
        <Select
          value={values.status}
          onValueChange={(value) => updateField("status", value as Status)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Tags</label>
        <TagMultiSelect
          options={tags}
          value={values.tagIds}
          onChange={(next) => updateField("tagIds", next)}
          placeholder="Add tags"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
