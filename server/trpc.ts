import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { SpaceRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { memberService } from "@/server/services/member-service";
import { platformConfigService } from "@/server/services/platform-config-service";
import { userService } from "@/server/services/user-service";

export async function createTrpcContext() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return { clerkUser: null, user: null };
  }

  // Existing users always sync (name/avatar updates etc.)
  const existingUser = await db.user.findUnique({
    where: { clerkUserId: clerkUser.id },
    select: { id: true },
  });

  if (existingUser) {
    const user = await userService.syncFromClerk(clerkUser);
    return { clerkUser, user };
  }

  // New user — check if sign-ups are allowed or email is whitelisted
  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (email && (await platformConfigService.isSignupAllowed(email))) {
    const user = await userService.syncFromClerk(clerkUser);
    return { clerkUser, user };
  }

  // Sign-ups disabled and not whitelisted
  return { clerkUser, user: null };
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

const spaceSlugInput = z.object({
  spaceSlug: z.string().min(1),
});

export const spaceMemberProcedure = protectedProcedure.use(async ({ ctx, getRawInput, next }) => {
  const parsed = spaceSlugInput.safeParse(await getRawInput());

  if (!parsed.success) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "spaceSlug is required." });
  }

  const membership = await memberService.getSpaceMembershipBySlug({
    spaceSlug: parsed.data.spaceSlug,
    userId: ctx.user.id,
  });

  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Space membership not found." });
  }

  return next({
    ctx: {
      ...ctx,
      membership,
    },
  });
});

export const spaceEditorProcedure = spaceMemberProcedure.use(({ ctx, next }) => {
  if (ctx.membership.role !== SpaceRole.owner && ctx.membership.role !== SpaceRole.editor) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only owners and editors can modify space records." });
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

export const spaceOwnerProcedure = spaceMemberProcedure.use(({ ctx, next }) => {
  if (ctx.membership.role !== SpaceRole.owner) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only space owners can perform this action." });
  }

  return next({
    ctx: {
      ...ctx,
      membership: ctx.membership,
    },
  });
});
