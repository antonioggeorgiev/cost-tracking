import { SpaceRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const spaceService = {
  async listForUser(userId: string) {
    const memberships = await db.spaceMembership.findMany({
      where: { userId, space: { deletedAt: null } },
      include: { space: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((membership) => ({
      id: membership.space.id,
      name: membership.space.name,
      slug: membership.space.slug,
      baseCurrencyCode: membership.space.baseCurrencyCode,
      role: membership.role,
    }));
  },

  async generateSlug(name: string) {
    const baseSlug = slugify(name) || "space";

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
      const existing = await db.space.findFirst({ where: { slug: candidate, deletedAt: null }, select: { id: true } });

      if (!existing) {
        return candidate;
      }
    }

    throw new Error("Unable to generate a unique space slug.");
  },

  async createForUser(input: { name: string; baseCurrencyCode: string; userId: string }) {
    const slug = await spaceService.generateSlug(input.name);

    return db.$transaction(async (tx) => {
      const space = await tx.space.create({
        data: {
          name: input.name,
          slug,
          baseCurrencyCode: input.baseCurrencyCode,
          createdByUserId: input.userId,
        },
      });

      await tx.spaceMembership.create({
        data: {
          spaceId: space.id,
          userId: input.userId,
          role: SpaceRole.owner,
        },
      });

      return space;
    });
  },

  async getForUserBySlug(input: { slug: string; userId: string }) {
    return db.space.findFirst({
      where: {
        slug: input.slug,
        deletedAt: null,
        memberships: {
          some: {
            userId: input.userId,
          },
        },
      },
      include: {
        memberships: {
          where: { userId: input.userId },
          select: { role: true },
        },
        _count: {
          select: {
            categories: true,
            expenses: true,
            recurringTemplates: true,
            debtAccounts: true,
            memberships: true,
          },
        },
      },
    });
  },

  async updateSettings(input: { spaceId: string; name: string; baseCurrencyCode: string }) {
    return db.space.update({
      where: { id: input.spaceId },
      data: {
        name: input.name.trim(),
        baseCurrencyCode: input.baseCurrencyCode,
      },
    });
  },

  async softDelete(spaceId: string) {
    return db.space.update({
      where: { id: spaceId },
      data: { deletedAt: new Date() },
    });
  },
};
