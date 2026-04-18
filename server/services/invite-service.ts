import crypto from "node:crypto";
import { Resend } from "resend";
import { InviteStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { isResendConfigured } from "@/lib/resend";
import { routes } from "@/lib/routes";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const inviteService = {
  async createSpaceInvite(input: { spaceId: string; invitedByUserId: string; email: string; role: "editor" | "viewer" }) {
    const email = normalizeEmail(input.email);

    const existingMember = await db.spaceMembership.findFirst({
      where: { spaceId: input.spaceId, user: { email } },
      select: { id: true },
    });

    if (existingMember) {
      throw new Error("That user is already a member of this space.");
    }

    const existingInvite = await db.spaceInvite.findFirst({
      where: {
        spaceId: input.spaceId,
        email,
        status: InviteStatus.pending,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (existingInvite) {
      throw new Error("There is already an active invite for that email.");
    }

    return db.spaceInvite.create({
      data: {
        spaceId: input.spaceId,
        email,
        role: input.role,
        token: crypto.randomUUID(),
        status: InviteStatus.pending,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        invitedByUserId: input.invitedByUserId,
      },
    });
  },

  async sendSpaceInviteEmail(input: { spaceName: string; recipientEmail: string; token: string }) {
    if (!isResendConfigured || !process.env.APP_BASE_URL) {
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const acceptUrl = `${process.env.APP_BASE_URL}${routes.acceptInvite(input.token)}`;

    await resend.emails.send({
      from: "Cost Tracking <onboarding@resend.dev>",
      to: input.recipientEmail,
      subject: `Join ${input.spaceName} on Cost Tracking`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h1 style="font-size: 20px;">You're invited to join ${input.spaceName}</h1>
          <p>Open the link below to accept the space invite.</p>
          <p><a href="${acceptUrl}">${acceptUrl}</a></p>
        </div>
      `,
    });
  },

  async getInviteByToken(token: string) {
    return db.spaceInvite.findUnique({
      where: { token },
      include: { space: true },
    });
  },

  async revokeSpaceInvite(input: { spaceId: string; inviteId: string }) {
    const invite = await db.spaceInvite.findUnique({
      where: { id: input.inviteId },
      select: { id: true, spaceId: true, status: true },
    });

    if (!invite || invite.spaceId !== input.spaceId) {
      throw new Error("Invite not found.");
    }

    if (invite.status !== InviteStatus.pending) {
      throw new Error("Only pending invites can be revoked.");
    }

    return db.spaceInvite.update({
      where: { id: input.inviteId },
      data: { status: InviteStatus.revoked },
    });
  },

  async acceptSpaceInvite(input: { token: string; userId: string; userEmail: string }) {
    const invite = await inviteService.getInviteByToken(input.token);

    if (!invite) {
      throw new Error("Invite not found.");
    }

    if (invite.status !== InviteStatus.pending) {
      throw new Error("This invite is no longer active.");
    }

    if (invite.expiresAt <= new Date()) {
      await db.spaceInvite.update({ where: { id: invite.id }, data: { status: InviteStatus.expired } });
      throw new Error("This invite has expired.");
    }

    if (normalizeEmail(invite.email) !== normalizeEmail(input.userEmail)) {
      throw new Error(`Sign in as ${invite.email} to accept this invite.`);
    }

    return db.$transaction(async (tx) => {
      const existingMembership = await tx.spaceMembership.findFirst({
        where: { spaceId: invite.spaceId, userId: input.userId },
      });

      if (!existingMembership) {
        await tx.spaceMembership.create({
          data: {
            spaceId: invite.spaceId,
            userId: input.userId,
            role: invite.role,
          },
        });
      }

      await tx.spaceInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.accepted, acceptedByUserId: input.userId, acceptedAt: new Date() },
      });

      return invite.space;
    });
  },
};
