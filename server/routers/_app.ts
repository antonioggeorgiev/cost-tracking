import { createTRPCRouter } from "@/server/trpc";
import { adminRouter } from "@/server/routers/admin";
import { categoriesRouter } from "@/server/routers/categories";
import { debtsRouter } from "@/server/routers/debts";
import { expensesRouter } from "@/server/routers/expenses";
import { membersRouter } from "@/server/routers/members";
import { reportingRouter } from "@/server/routers/reporting";
import { recurringRouter } from "@/server/routers/recurring";
import { spacesRouter } from "@/server/routers/spaces";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  spaces: spacesRouter,
  members: membersRouter,
  categories: categoriesRouter,
  expenses: expensesRouter,
  recurring: recurringRouter,
  debts: debtsRouter,
  reporting: reportingRouter,
});

export type AppRouter = typeof appRouter;
