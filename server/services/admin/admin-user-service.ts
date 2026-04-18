import { createPaginatedResult, resolvePagination, type PaginationOptions } from "@/lib/pagination";
import { db } from "@/lib/db";

type ListAdminUsersOptions = PaginationOptions & {
  search?: string;
};

function createUserSearchWhere(search?: string) {
  if (!search) {
    return {};
  }

  return {
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ],
  };
}

export const adminUserService = {
  async listUsers(options?: ListAdminUsersOptions) {
    const pagination = resolvePagination(options);
    const where = createUserSearchWhere(options?.search);

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          _count: { select: { memberships: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.perPage,
      }),
      db.user.count({ where }),
    ]);

    return createPaginatedResult(
      users.map((user) => ({
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        isPlatformAdmin: user.isPlatformAdmin,
        createdAt: user.createdAt,
        spaceCount: user._count.memberships,
      })),
      total,
      pagination,
    );
  },

  async getUserDetail(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            space: { select: { id: true, name: true, slug: true, baseCurrencyCode: true } },
          },
        },
        _count: { select: { expenses: true } },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      isPlatformAdmin: user.isPlatformAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      expenseCount: user._count.expenses,
      spaces: user.memberships.map((membership) => ({
        id: membership.space.id,
        name: membership.space.name,
        slug: membership.space.slug,
        baseCurrencyCode: membership.space.baseCurrencyCode,
        role: membership.role,
        joinedAt: membership.createdAt,
      })),
    };
  },

  async setUserAdmin(userId: string, isPlatformAdmin: boolean) {
    return db.user.update({
      where: { id: userId },
      data: { isPlatformAdmin },
    });
  },
};
