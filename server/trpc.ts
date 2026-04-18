import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { WorkspaceRole } from "@/generated/prisma/enums";
import { memberService } from "@/server/services/member-service";
import { userService } from "@/server/services/user-service";

export async function createTrpcContext() {
  const clerkUser = await currentUser();
  const user = clerkUser ? await userService.syncFromClerk(clerkUser) : null;

  return {
    clerkUser,
    user,
  };
}

type Context = Awaited<ReturnType<typeof createTrpcContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.clerkUser || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      clerkUser: ctx.clerkUser,
      user: ctx.user,
    },
  });
});

const workspaceSlugInput = z.object({
  workspaceSlug: z.string().min(1),
});

export const workspaceMemberProcedure = protectedProcedure.use(async ({ ctx, getRawInput, next }) => {
  const parsed = workspaceSlugInput.safeParse(await getRawInput());

  if (!parsed.success) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "workspaceSlug is required." });
  }

  const membership = await memberService.getWorkspaceMembershipBySlug({
    workspaceSlug: parsed.data.workspaceSlug,
    userId: ctx.user.id,
  });

  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Workspace membership not found." });
  }

  return next({
    ctx: {
      ...ctx,
      membership,
    },
  });
});

export const workspaceEditorProcedure = workspaceMemberProcedure.use(({ ctx, next }) => {
  if (ctx.membership.role !== WorkspaceRole.owner && ctx.membership.role !== WorkspaceRole.editor) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only owners and editors can modify workspace records." });
  }

  return next({
    ctx: {
      ...ctx,
      membership: ctx.membership,
    },
  });
});

export const platformAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isPlatformAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required." });
  }

  return next({ ctx });
});

export const workspaceOwnerProcedure = workspaceMemberProcedure.use(({ ctx, next }) => {
  if (ctx.membership.role !== WorkspaceRole.owner) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only workspace owners can perform this action." });
  }

  return next({
    ctx: {
      ...ctx,
      membership: ctx.membership,
    },
  });
});
