import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const categoryService = {
  /** List platform-wide categories (spaceId IS NULL) as a parent->children tree. */
  async listPlatformCategoriesTree() {
    const categories = await db.category.findMany({
      where: { spaceId: null },
      orderBy: [{ parentCategoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    const parentCategories = categories.filter((category) => category.parentCategoryId === null);

    return parentCategories.map((parent) => ({
      ...parent,
      children: categories.filter((category) => category.parentCategoryId === parent.id),
    }));
  },

  /**
   * List categories available to a space.
   * Returns platform categories (spaceId IS NULL) plus any legacy space categories
   * that still have expenses referencing them.
   */
  async listSpaceCategoriesTree(spaceId: string) {
    const categories = await db.category.findMany({
      where: {
        OR: [
          { spaceId: null },
          { spaceId },
        ],
      },
      orderBy: [{ parentCategoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    const parentCategories = categories.filter((category) => category.parentCategoryId === null);

    return parentCategories.map((parent) => ({
      ...parent,
      children: categories.filter((category) => category.parentCategoryId === parent.id),
    }));
  },

  /** Create a platform-wide category (spaceId = null). */
  async createPlatformCategory(input: { name: string; parentCategoryId?: string | null; color?: string | null }) {
    const name = input.name.trim();
    if (!name) throw new Error("Category name is required.");

    const slugBase = slugify(name) || "category";
    const parentCategoryId = input.parentCategoryId ?? null;

    if (parentCategoryId) {
      const parentCategory = await db.category.findUnique({
        where: { id: parentCategoryId },
        include: { parentCategory: { select: { id: true } } },
      });

      if (!parentCategory || parentCategory.spaceId !== null) {
        throw new Error("Parent category not found or is not a platform category.");
      }

      if (parentCategory.parentCategoryId) {
        throw new Error("Only one level of child categories is allowed.");
      }
    }

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const slug = suffix === 0 ? slugBase : `${slugBase}-${suffix + 1}`;
      const existing = await db.category.findFirst({
        where: { spaceId: null, parentCategoryId, slug },
        select: { id: true },
      });

      if (!existing) {
        return db.category.create({
          data: { name, slug, parentCategoryId, color: input.color ?? null },
        });
      }
    }

    throw new Error("Unable to create a unique category slug.");
  },

  /** Update a platform category. */
  async updatePlatformCategory(categoryId: string, input: {
    name?: string;
    isArchived?: boolean;
    sortOrder?: number;
    color?: string | null;
  }) {
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category || category.spaceId !== null) {
      throw new Error("Platform category not found.");
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) {
      data.name = input.name.trim();
      data.slug = slugify(input.name.trim()) || category.slug;
    }
    if (input.isArchived !== undefined) data.isArchived = input.isArchived;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.color !== undefined) data.color = input.color;

    return db.category.update({ where: { id: categoryId }, data });
  },

  /** Legacy: create a space-scoped category. */
  async create(input: { spaceId: string; name: string; parentCategoryId?: string | null }) {
    const name = input.name.trim();
    if (!name) throw new Error("Category name is required.");

    const slugBase = slugify(name) || "category";
    const parentCategoryId = input.parentCategoryId ?? null;

    if (parentCategoryId) {
      const parentCategory = await db.category.findUnique({
        where: { id: parentCategoryId },
        include: { parentCategory: { select: { id: true } } },
      });

      if (!parentCategory || (parentCategory.spaceId !== null && parentCategory.spaceId !== input.spaceId)) {
        throw new Error("Parent category does not belong to this space.");
      }

      if (parentCategory.parentCategoryId) {
        throw new Error("Only one level of child categories is allowed.");
      }
    }

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const slug = suffix === 0 ? slugBase : `${slugBase}-${suffix + 1}`;
      const existing = await db.category.findFirst({
        where: { spaceId: input.spaceId, parentCategoryId, slug },
        select: { id: true },
      });

      if (!existing) {
        return db.category.create({
          data: { spaceId: input.spaceId, name, slug, parentCategoryId },
        });
      }
    }

    throw new Error("Unable to create a unique category slug.");
  },
};
