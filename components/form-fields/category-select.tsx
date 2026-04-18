"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CreateCategoryDialog } from "@/components/create-category-dialog";

type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

type CategorySelectProps = {
  categories: Category[];
  parentCategoryId: string;
  onParentChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  workspaceSlug: string;
  createCategory?: (formData: FormData) => Promise<{ id: string }>;
  parentError?: string;
  categoryError?: string;
};

export function CategorySelect({
  categories,
  parentCategoryId,
  onParentChange,
  categoryId,
  onCategoryChange,
  workspaceSlug,
  createCategory,
  parentError,
  categoryError,
}: CategorySelectProps) {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);

  const selectedParent = categories.find((c) => c.id === parentCategoryId);
  const childCategories = selectedParent?.children ?? [];

  const categoryItems = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const subcategoryItems = useMemo(
    () => childCategories.map((c) => ({ value: c.id, label: c.name })),
    [childCategories],
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Category</Label>
          <SearchableSelect
            items={categoryItems}
            value={parentCategoryId}
            onValueChange={(val) => {
              onParentChange(val);
              onCategoryChange("");
            }}
            placeholder="Select category"
            searchPlaceholder="Search categories..."
            emptyMessage="No categories found."
            onCreateNew={createCategory ? () => setCategoryDialogOpen(true) : undefined}
            createNewLabel="Create category"
          />
          {parentError && <span className="text-xs text-destructive">{parentError}</span>}
        </div>

        <div className="grid gap-1.5">
          <Label>Subcategory</Label>
          <SearchableSelect
            items={subcategoryItems}
            value={categoryId}
            onValueChange={onCategoryChange}
            placeholder={!parentCategoryId ? "Select category first" : "Select subcategory"}
            searchPlaceholder="Search subcategories..."
            emptyMessage="No subcategories found."
            disabled={!parentCategoryId}
            onCreateNew={parentCategoryId && createCategory ? () => setSubcategoryDialogOpen(true) : undefined}
            createNewLabel="Create subcategory"
          />
          {categoryError && <span className="text-xs text-destructive">{categoryError}</span>}
        </div>
      </div>

      {createCategory && (
        <>
          <CreateCategoryDialog
            type="category"
            workspaceSlug={workspaceSlug}
            createCategory={createCategory}
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
            onCreated={(id) => {
              onParentChange(id);
              onCategoryChange("");
            }}
          />
          <CreateCategoryDialog
            type="subcategory"
            workspaceSlug={workspaceSlug}
            parentCategoryId={parentCategoryId}
            createCategory={createCategory}
            open={subcategoryDialogOpen}
            onOpenChange={setSubcategoryDialogOpen}
            onCreated={(id) => {
              onCategoryChange(id);
            }}
          />
        </>
      )}
    </>
  );
}
