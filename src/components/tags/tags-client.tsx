'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { Palette, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TagForm } from "@/components/tags/tag-form";
import { createTagAction, deleteTagAction, updateTagAction } from "@/server/actions/tags";
import type { TagFormValues } from "@/lib/validations/tag";

export type TagRow = {
  id: string;
  name: string;
  color: string;
  usageCount: number;
};

type TagsClientProps = {
  tags: TagRow[];
};

export function TagsClient({ tags }: TagsClientProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [tagToEdit, setTagToEdit] = React.useState<TagRow | null>(null);
  const [tagToDelete, setTagToDelete] = React.useState<TagRow | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, startDeleting] = React.useTransition();

  const handleCreate = React.useCallback(async (values: TagFormValues) => {
    const result = await createTagAction(values);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    router.refresh();
    return { success: true };
  }, [router]);

  const handleUpdate = React.useCallback(async (tag: TagRow, values: TagFormValues) => {
    const result = await updateTagAction({ id: tag.id, ...values });
    if (!result.success) {
      return { success: false, error: result.error };
    }

    router.refresh();
    return { success: true };
  }, [router]);

  const handleDelete = React.useCallback(async (tag: TagRow) => {
    const result = await deleteTagAction({ id: tag.id });
    if (!result.success) {
      return { success: false, error: result.error };
    }

    router.refresh();
    return { success: true };
  }, [router]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Define tag names and colors, then assign them to tasks to stay organized.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create tag</DialogTitle>
              <DialogDescription>
                Tag colors help tasks stand out when filtering.
              </DialogDescription>
            </DialogHeader>
            <TagForm
              submitLabel="Create tag"
              onSubmit={handleCreate}
              onSuccess={() => {
                setIsCreateOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length ? (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border"
                      style={{ backgroundColor: tag.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tag.usageCount} tasks</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={tagToEdit?.id === tag.id} onOpenChange={(open) => {
                        setTagToEdit(open ? tag : null);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Palette className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit tag</DialogTitle>
                            <DialogDescription>
                              Update the tag name or color.
                            </DialogDescription>
                          </DialogHeader>
                          <TagForm
                            submitLabel="Save changes"
                            defaultValues={{ name: tag.name, color: tag.color }}
                            onSubmit={(values) => handleUpdate(tag, values)}
                            onSuccess={() => {
                              setTagToEdit(null);
                            }}
                          />
                        </DialogContent>
                      </Dialog>

                      <Dialog open={tagToDelete?.id === tag.id} onOpenChange={(open) => {
                        setDeleteError(null);
                        setTagToDelete(open ? tag : null);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete tag</DialogTitle>
                            <DialogDescription>
                              Removing this tag detaches it from any tasks using it.
                            </DialogDescription>
                          </DialogHeader>
                          {deleteError && (
                            <p className="text-sm text-destructive">{deleteError}</p>
                          )}
                          <DialogFooter className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setTagToDelete(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              disabled={isDeleting && tagToDelete?.id === tag.id}
                              onClick={() =>
                                startDeleting(async () => {
                                  setDeleteError(null);
                                  const result = await handleDelete(tag);
                                  if (!result || result.success) {
                                    setTagToDelete(null);
                                  } else {
                                    setDeleteError(result.error ?? "Failed to delete tag");
                                  }
                                })
                              }
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                  No tags yet. Create one to start grouping tasks.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
