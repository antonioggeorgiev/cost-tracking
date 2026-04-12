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
  async createWorkspaceInvite(input: { workspaceId: string; invitedByUserId: string; email: string; role: "editor" | "viewer" }) {
    const email = normalizeEmail(input.email);

    const existingMember = await db.workspaceMembership.findFirst({
      where: { workspaceId: input.workspaceId, user: { email } },
      select: { id: true },
    });

    if (existingMember) {
      throw new Error("That user is already a member of this workspace.");
    }

    const existingInvite = await db.workspaceInvite.findFirst({
      where: {
        workspaceId: input.workspaceId,
        email,
        status: InviteStatus.pending,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (existingInvite) {
      throw new Error("There is already an active invite for that email.");
    }

    return db.workspaceInvite.create({
      data: {
        workspaceId: input.workspaceId,
        email,
        role: input.role,
        token: crypto.randomUUID(),
        status: InviteStatus.pending,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        invitedByUserId: input.invitedByUserId,
      },
    });
  },

  async sendWorkspaceInviteEmail(input: { workspaceName: string; recipientEmail: string; token: string }) {
    if (!isResendConfigured || !process.env.APP_BASE_URL) {
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const acceptUrl = `${process.env.APP_BASE_URL}${routes.acceptInvite(input.token)}`;

    await resend.emails.send({
      from: "Cost Tracking <onboarding@resend.dev>",
      to: input.recipientEmail,
      subject: `Join ${input.workspaceName} on Cost Tracking`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h1 style="font-size: 20px;">You're invited to join ${input.workspaceName}</h1>
          <p>Open the link below to accept the workspace invite.</p>
          <p><a href="${acceptUrl}">${acceptUrl}</a></p>
        </div>
      `,
    });
  },

  async getInviteByToken(token: string) {
    return db.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true },
    });
  },

  async revokeWorkspaceInvite(input: { workspaceId: string; inviteId: string }) {
    const invite = await db.workspaceInvite.findUnique({
      where: { id: input.inviteId },
      select: { id: true, workspaceId: true, status: true },
    });

    if (!invite || invite.workspaceId !== input.workspaceId) {
      throw new Error("Invite not found.");
    }

    if (invite.status !== InviteStatus.pending) {
      throw new Error("Only pending invites can be revoked.");
    }

    return db.workspaceInvite.update({
      where: { id: input.inviteId },
      data: { status: InviteStatus.revoked },
    });
  },

  async acceptWorkspaceInvite(input: { token: string; userId: string; userEmail: string }) {
    const invite = await inviteService.getInviteByToken(input.token);

    if (!invite) {
      throw new Error("Invite not found.");
    }

    if (invite.status !== InviteStatus.pending) {
      throw new Error("This invite is no longer active.");
    }

    if (invite.expiresAt <= new Date()) {
      await db.workspaceInvite.update({ where: { id: invite.id }, data: { status: InviteStatus.expired } });
      throw new Error("This invite has expired.");
    }

    if (normalizeEmail(invite.email) !== normalizeEmail(input.userEmail)) {
      throw new Error(`Sign in as ${invite.email} to accept this invite.`);
    }

    return db.$transaction(async (tx) => {
      const existingMembership = await tx.workspaceMembership.findFirst({
        where: { workspaceId: invite.workspaceId, userId: input.userId },
      });

      if (!existingMembership) {
        await tx.workspaceMembership.create({
          data: {
            workspaceId: invite.workspaceId,
            userId: input.userId,
            role: invite.role,
          },
        });
      }

      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.accepted, acceptedByUserId: input.userId, acceptedAt: new Date() },
      });

      return invite.workspace;
    });
  },
};
