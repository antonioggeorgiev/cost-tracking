import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const categoryService = {
  async listWorkspaceCategoriesTree(workspaceId: string) {
    const categories = await db.category.findMany({
      where: { workspaceId },
      orderBy: [{ parentCategoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    const parentCategories = categories.filter((category) => category.parentCategoryId === null);

    return parentCategories.map((parent) => ({
      ...parent,
      children: categories.filter((category) => category.parentCategoryId === parent.id),
    }));
  },

  async create(input: { workspaceId: string; name: string; parentCategoryId?: string | null }) {
    const name = input.name.trim();
    if (!name) throw new Error("Category name is required.");

    const slugBase = slugify(name) || "category";
    const parentCategoryId = input.parentCategoryId ?? null;

    if (parentCategoryId) {
      const parentCategory = await db.category.findUnique({
        where: { id: parentCategoryId },
        include: { parentCategory: { select: { id: true } } },
      });

      if (!parentCategory || parentCategory.workspaceId !== input.workspaceId) {
        throw new Error("Parent category does not belong to this workspace.");
      }

      if (parentCategory.parentCategoryId) {
        throw new Error("Only one level of child categories is allowed.");
      }
    }

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const slug = suffix === 0 ? slugBase : `${slugBase}-${suffix + 1}`;
      const existing = await db.category.findFirst({
        where: { workspaceId: input.workspaceId, parentCategoryId, slug },
        select: { id: true },
      });

      if (!existing) {
        return db.category.create({
          data: { workspaceId: input.workspaceId, name, slug, parentCategoryId },
        });
      }
    }

    throw new Error("Unable to create a unique category slug.");
  },
};
