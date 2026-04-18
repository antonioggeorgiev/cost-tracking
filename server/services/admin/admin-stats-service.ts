import { db } from "@/lib/db";

export const adminStatsService = {
  async getStats() {
    const [userCount, spaceCount, expenseCount, categoryCount] = await Promise.all([
      db.user.count(),
      db.space.count({ where: { deletedAt: null } }),
      db.expense.count(),
      db.category.count({ where: { spaceId: null } }),
    ]);

    return { userCount, spaceCount, expenseCount, categoryCount };
  },
};
