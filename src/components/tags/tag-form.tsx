'use client';

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { tagFormSchema, type TagFormValues } from "@/lib/validations/tag";

type TagFormProps = {
  defaultValues?: TagFormValues;
  submitLabel?: string;
  onSubmit: (values: TagFormValues) => Promise<{ success: boolean; error?: string } | void>;
  onSuccess?: () => void;
};

const defaultTagValues: TagFormValues = {
  name: "",
  color: "#475569",
};

export function TagForm({
  defaultValues,
  submitLabel = "Save tag",
  onSubmit,
  onSuccess,
}: TagFormProps) {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: defaultValues ?? defaultTagValues,
  });

  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = form.handleSubmit((values) => {
    setError(null);

    startTransition(async () => {
      const result = await onSubmit(values);
      if (result && "success" in result && !result.success) {
        setError(result.error ?? "Failed to save tag");
        return;
      }

      if (!defaultValues) {
        form.reset(defaultTagValues);
      }

      onSuccess?.();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Work" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Input
                    type="color"
                    className="h-10 w-16 p-1"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  />
                </FormControl>
                <Input
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
              </div>
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
