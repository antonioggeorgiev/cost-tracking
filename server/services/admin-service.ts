import { db } from "@/lib/db";

export const adminService = {
  async getStats() {
    const [userCount, workspaceCount, expenseCount, categoryCount] = await Promise.all([
      db.user.count(),
      db.workspace.count(),
      db.expense.count(),
      db.category.count({ where: { workspaceId: null } }),
    ]);

    return { userCount, workspaceCount, expenseCount, categoryCount };
  },

  async listUsers(options?: { search?: string; page?: number; perPage?: number }) {
    const page = options?.page ?? 1;
    const perPage = options?.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          _count: { select: { memberships: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      db.user.count({ where }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        clerkUserId: u.clerkUserId,
        email: u.email,
        name: u.name,
        imageUrl: u.imageUrl,
        isPlatformAdmin: u.isPlatformAdmin,
        createdAt: u.createdAt,
        workspaceCount: u._count.memberships,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  async getUserDetail(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            workspace: { select: { id: true, name: true, slug: true, baseCurrencyCode: true } },
          },
        },
        _count: { select: { expenses: true } },
      },
    });

    if (!user) return null;

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
      workspaces: user.memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        baseCurrencyCode: m.workspace.baseCurrencyCode,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    };
  },

  async setUserAdmin(userId: string, isPlatformAdmin: boolean) {
    return db.user.update({
      where: { id: userId },
      data: { isPlatformAdmin },
    });
  },

  async listWorkspaces(options?: { search?: string; page?: number; perPage?: number }) {
    const page = options?.page ?? 1;
    const perPage = options?.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { slug: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [workspaces, total] = await Promise.all([
      db.workspace.findMany({
        where,
        include: {
          createdByUser: { select: { name: true, email: true } },
          _count: { select: { memberships: true, expenses: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      db.workspace.count({ where }),
    ]);

    return {
      items: workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        baseCurrencyCode: w.baseCurrencyCode,
        createdAt: w.createdAt,
        createdBy: w.createdByUser.name || w.createdByUser.email,
        memberCount: w._count.memberships,
        expenseCount: w._count.expenses,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  async getWorkspaceDetail(workspaceId: string) {
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
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

    if (!workspace) return null;

    const expenseAgg = await db.expense.aggregate({
      where: { workspaceId },
      _sum: { workspaceAmountMinor: true },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      baseCurrencyCode: workspace.baseCurrencyCode,
      createdAt: workspace.createdAt,
      createdBy: workspace.createdByUser.name || workspace.createdByUser.email,
      expenseCount: workspace._count.expenses,
      recurringCount: workspace._count.recurringTemplates,
      totalSpendMinor: expenseAgg._sum.workspaceAmountMinor ?? 0,
      members: workspace.memberships.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        imageUrl: m.user.imageUrl,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    };
  },
};
