import { createTRPCRouter } from "@/server/trpc";
import { categoriesRouter } from "@/server/routers/categories";
import { debtsRouter } from "@/server/routers/debts";
import { expensesRouter } from "@/server/routers/expenses";
import { membersRouter } from "@/server/routers/members";
import { reportingRouter } from "@/server/routers/reporting";
import { recurringRouter } from "@/server/routers/recurring";
import { workspacesRouter } from "@/server/routers/workspaces";

export const appRouter = createTRPCRouter({
  workspaces: workspacesRouter,
  members: membersRouter,
  categories: categoriesRouter,
  expenses: expensesRouter,
  recurring: recurringRouter,
  debts: debtsRouter,
  reporting: reportingRouter,
});

export type AppRouter = typeof appRouter;
