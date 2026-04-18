export type CategoryTreeNode = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

export function toCategoryTree(
  categories: Array<{
    id: string;
    name: string;
    children: Array<{ id: string; name: string }>;
  }>,
): CategoryTreeNode[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    children: category.children.map((child) => ({
      id: child.id,
      name: child.name,
    })),
  }));
}

export function toCategorySelectItems(categories: CategoryTreeNode[]) {
  return categories.map((category) => ({ value: category.id, label: category.name }));
}

export function toSubcategorySelectItems(categories: CategoryTreeNode[], parentCategoryId: string) {
  return (categories.find((category) => category.id === parentCategoryId)?.children ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }));
}
