import { createPaginatedResult, resolvePagination, type PaginationOptions } from "@/lib/pagination";
import { db } from "@/lib/db";

type ListAdminSpacesOptions = PaginationOptions & {
  search?: string;
};

function createSpaceSearchWhere(search?: string) {
  if (!search) {
    return { deletedAt: null };
  }

  return {
    deletedAt: null,
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { slug: { contains: search, mode: "insensitive" as const } },
    ],
  };
}

export const adminSpaceService = {
  async listSpaces(options?: ListAdminSpacesOptions) {
    const pagination = resolvePagination(options);
    const where = createSpaceSearchWhere(options?.search);

    const [spaces, total] = await Promise.all([
      db.space.findMany({
        where,
        include: {
          createdByUser: { select: { name: true, email: true } },
          _count: { select: { memberships: true, expenses: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.perPage,
      }),
      db.space.count({ where }),
    ]);

    return createPaginatedResult(
      spaces.map((space) => ({
        id: space.id,
        name: space.name,
        slug: space.slug,
        baseCurrencyCode: space.baseCurrencyCode,
        createdAt: space.createdAt,
        createdBy: space.createdByUser.name || space.createdByUser.email,
        memberCount: space._count.memberships,
        expenseCount: space._count.expenses,
      })),
      total,
      pagination,
    );
  },

  async getSpaceDetail(spaceId: string) {
    const space = await db.space.findFirst({
      where: { id: spaceId, deletedAt: null },
      include: {
        createdByUser: { select: { name: true, email: true } },
        memberships: {
          include: {
            user: { select: { id: true, name: true, email: true, imageUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { expenses: true, recurringTemplates: true } },
      },
    });

    if (!space) {
      return null;
    }

    const expenseAgg = await db.expense.aggregate({
      where: { spaceId },
      _sum: { workspaceAmountMinor: true },
    });

    return {
      id: space.id,
      name: space.name,
      slug: space.slug,
      baseCurrencyCode: space.baseCurrencyCode,
      createdAt: space.createdAt,
      createdBy: space.createdByUser.name || space.createdByUser.email,
      expenseCount: space._count.expenses,
      recurringCount: space._count.recurringTemplates,
      totalSpendMinor: expenseAgg._sum.workspaceAmountMinor ?? 0,
      members: space.memberships.map((membership) => ({
        userId: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        imageUrl: membership.user.imageUrl,
        role: membership.role,
        joinedAt: membership.createdAt,
      })),
    };
  },
};
