import { z } from "zod";
import { categoryService } from "@/server/services/category-service";
import { createTRPCRouter, workspaceEditorProcedure, workspaceMemberProcedure } from "@/server/trpc";

export const categoriesRouter = createTRPCRouter({
  list: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => categoryService.listWorkspaceCategoriesTree(ctx.membership.workspaceId)),

  create: workspaceEditorProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
        name: z.string().trim().min(2).max(80),
        parentCategoryId: z.string().cuid().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return categoryService.create({
        workspaceId: ctx.membership.workspaceId,
        name: input.name,
        parentCategoryId: input.parentCategoryId ?? null,
      });
    }),
});
