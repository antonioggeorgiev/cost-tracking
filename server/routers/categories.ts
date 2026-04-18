import { z } from "zod";
import { categoryService } from "@/server/services/category-service";
import { createTRPCRouter, spaceMemberProcedure } from "@/server/trpc";

export const categoriesRouter = createTRPCRouter({
  list: spaceMemberProcedure
    .input(z.object({ spaceSlug: z.string().min(1) }))
    .query(({ ctx }) => categoryService.listSpaceCategoriesTree(ctx.membership.spaceId)),
});
