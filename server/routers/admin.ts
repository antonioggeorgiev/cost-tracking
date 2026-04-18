import { z } from "zod";
import { categoryService } from "@/server/services/category-service";
import { adminSpaceService } from "@/server/services/admin/admin-space-service";
import { adminStatsService } from "@/server/services/admin/admin-stats-service";
import { adminUserService } from "@/server/services/admin/admin-user-service";
import { platformConfigService } from "@/server/services/platform-config-service";
import { createTRPCRouter, platformAdminProcedure } from "@/server/trpc";

export const adminRouter = createTRPCRouter({
  stats: platformAdminProcedure.query(() => adminStatsService.getStats()),

  listUsers: platformAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).optional(),
        perPage: z.coerce.number().int().min(1).max(100).optional(),
      }),
    )
    .query(({ input }) => adminUserService.listUsers(input)),

  getUserDetail: platformAdminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(({ input }) => adminUserService.getUserDetail(input.userId)),

  setUserAdmin: platformAdminProcedure
    .input(z.object({ userId: z.string().cuid(), isPlatformAdmin: z.boolean() }))
    .mutation(({ input }) => adminUserService.setUserAdmin(input.userId, input.isPlatformAdmin)),

  listSpaces: platformAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).optional(),
        perPage: z.coerce.number().int().min(1).max(100).optional(),
      }),
    )
    .query(({ input }) => adminSpaceService.listSpaces(input)),

  getSpaceDetail: platformAdminProcedure
    .input(z.object({ spaceId: z.string().cuid() }))
    .query(({ input }) => adminSpaceService.getSpaceDetail(input.spaceId)),

  listPlatformCategories: platformAdminProcedure.query(() =>
    categoryService.listPlatformCategoriesTree(),
  ),

  createPlatformCategory: platformAdminProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(80),
        parentCategoryId: z.string().cuid().nullable().optional(),
        color: z.string().max(20).nullable().optional(),
      }),
    )
    .mutation(({ input }) =>
      categoryService.createPlatformCategory({
        name: input.name,
        parentCategoryId: input.parentCategoryId ?? null,
        color: input.color ?? null,
      }),
    ),

  updatePlatformCategory: platformAdminProcedure
    .input(
      z.object({
        categoryId: z.string().cuid(),
        name: z.string().trim().min(2).max(80).optional(),
        isArchived: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        color: z.string().max(20).nullable().optional(),
      }),
    )
    .mutation(({ input }) =>
      categoryService.updatePlatformCategory(input.categoryId, {
        name: input.name,
        isArchived: input.isArchived,
        sortOrder: input.sortOrder,
        color: input.color,
      }),
    ),

  // Platform config
  getConfig: platformAdminProcedure.query(async () => {
    const [config, whitelistCount] = await Promise.all([
      platformConfigService.getConfig(),
      platformConfigService.listAllowedEmails({ perPage: 1 }).then((r) => r.total),
    ]);
    return { ...config, whitelistCount };
  }),

  updateConfig: platformAdminProcedure
    .input(z.object({ signupsEnabled: z.boolean() }))
    .mutation(({ input }) => platformConfigService.updateConfig(input)),

  listAllowedEmails: platformAdminProcedure
    .input(
      z.object({
        page: z.coerce.number().int().min(1).optional(),
        perPage: z.coerce.number().int().min(1).max(100).optional(),
      }),
    )
    .query(({ input }) => platformConfigService.listAllowedEmails(input)),

  addAllowedEmail: platformAdminProcedure
    .input(
      z.object({
        email: z.string().email(),
        note: z.string().max(200).optional(),
      }),
    )
    .mutation(({ input }) => platformConfigService.addAllowedEmail(input.email, input.note)),

  removeAllowedEmail: platformAdminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ input }) => platformConfigService.removeAllowedEmail(input.id)),
});
