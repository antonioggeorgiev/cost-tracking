"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CreateCategoryDialogProps = {
  type: "category" | "subcategory";
  workspaceSlug: string;
  parentCategoryId?: string;
  createCategory: (formData: FormData) => Promise<{ id: string }>;
  onCreated?: (id: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateCategoryDialog({
  type,
  workspaceSlug,
  parentCategoryId,
  createCategory,
  onCreated,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateCategoryDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const label = type === "category" ? "Category" : "Subcategory";
  const isControlled = controlledOpen !== undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    const formData = new FormData();
    formData.set("workspaceSlug", workspaceSlug);
    formData.set("name", name.trim());
    if (type === "subcategory" && parentCategoryId) {
      formData.set("parentCategoryId", parentCategoryId);
    }

    startTransition(async () => {
      try {
        const result = await createCategory(formData);
        setName("");
        setOpen(false);
        onCreated?.(result.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
            />
          }
        >
          <Plus className="size-4" />
          Create {label.toLowerCase()}
        </DialogTrigger>
      )}
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create {label}</DialogTitle>
            <DialogDescription>
              Add a new {label.toLowerCase()} to your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-4">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${label} name`}
              autoFocus
            />
            {error && (
              <span className="text-xs text-destructive">{error}</span>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : `Create ${label}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
