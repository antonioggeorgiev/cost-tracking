import { WorkspaceRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const workspaceService = {
  async listForUser(userId: string) {
    const memberships = await db.workspaceMembership.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      baseCurrencyCode: membership.workspace.baseCurrencyCode,
      role: membership.role,
    }));
  },

  async generateSlug(name: string) {
    const baseSlug = slugify(name) || "workspace";

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
      const existing = await db.workspace.findUnique({ where: { slug: candidate }, select: { id: true } });

      if (!existing) {
        return candidate;
      }
    }

    throw new Error("Unable to generate a unique workspace slug.");
  },

  async createForUser(input: { name: string; baseCurrencyCode: string; userId: string }) {
    const slug = await workspaceService.generateSlug(input.name);

    return db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: input.name,
          slug,
          baseCurrencyCode: input.baseCurrencyCode,
          createdByUserId: input.userId,
        },
      });

      await tx.workspaceMembership.create({
        data: {
          workspaceId: workspace.id,
          userId: input.userId,
          role: WorkspaceRole.owner,
        },
      });

      return workspace;
    });
  },

  async getForUserBySlug(input: { slug: string; userId: string }) {
    return db.workspace.findFirst({
      where: {
        slug: input.slug,
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

  async updateSettings(input: { workspaceId: string; name: string; baseCurrencyCode: string }) {
    return db.workspace.update({
      where: { id: input.workspaceId },
      data: {
        name: input.name.trim(),
        baseCurrencyCode: input.baseCurrencyCode,
      },
    });
  },
};
