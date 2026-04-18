"use client";

import { useRef } from "react";
import { deleteSpaceAction } from "@/app/(app)/settings/actions";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteSpaceDialogProps = {
  spaceSlug: string;
  spaceName: string;
};

export function DeleteSpaceDialog({ spaceSlug, spaceName }: DeleteSpaceDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="destructive" />}
      >
        <Trash2 size={14} />
        Delete Space
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{spaceName}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will archive the space and all its data. Members will lose access. This action cannot be easily undone.
          </DialogDescription>
        </DialogHeader>
        <form action={deleteSpaceAction}>
          <input type="hidden" name="spaceSlug" value={spaceSlug} />
          <label className="grid gap-1.5 text-sm mt-2">
            <span className="text-body">
              Type <strong className="text-heading">{spaceName}</strong> to confirm
            </span>
            <input
              ref={inputRef}
              name="confirmName"
              required
              autoComplete="off"
              pattern={spaceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}
              placeholder={spaceName}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-heading outline-none placeholder:text-body focus:border-danger focus:ring-2 focus:ring-danger/10"
            />
          </label>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-danger px-3 py-2 text-sm font-medium text-white transition hover:bg-danger/90"
            >
              <Trash2 size={14} />
              Delete permanently
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
