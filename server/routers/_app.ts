import { createTRPCRouter } from "@/server/trpc";
import { categoriesRouter } from "@/server/routers/categories";
import { expensesRouter } from "@/server/routers/expenses";
import { membersRouter } from "@/server/routers/members";
import { workspacesRouter } from "@/server/routers/workspaces";

export const appRouter = createTRPCRouter({
  workspaces: workspacesRouter,
  members: membersRouter,
  categories: categoriesRouter,
  expenses: expensesRouter,
});

export type AppRouter = typeof appRouter;
