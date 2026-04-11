import { createTRPCRouter } from "@/server/trpc";
import { membersRouter } from "@/server/routers/members";
import { workspacesRouter } from "@/server/routers/workspaces";

export const appRouter = createTRPCRouter({
  workspaces: workspacesRouter,
  members: membersRouter,
});

export type AppRouter = typeof appRouter;
