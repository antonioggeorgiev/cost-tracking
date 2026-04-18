import { z } from "zod";
import { categoryService } from "@/server/services/category-service";
import { createTRPCRouter, workspaceMemberProcedure } from "@/server/trpc";

export const categoriesRouter = createTRPCRouter({
  list: workspaceMemberProcedure
    .input(z.object({ workspaceSlug: z.string().min(1) }))
    .query(({ ctx }) => categoryService.listWorkspaceCategoriesTree(ctx.membership.workspaceId)),
});
