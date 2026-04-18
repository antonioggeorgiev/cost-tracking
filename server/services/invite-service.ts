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

    const { data, error } = await resend.emails.send({
      from: "Cost Tracking <noreply@trakk-map.com>",
      to: input.recipientEmail,
      subject: `Join ${input.spaceName} on Cost Tracking`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8F9FA;font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F9FA;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border:1px solid #E3E9EC;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background-color:#1A1A2E;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.6);">You're invited</p>
          <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">Join ${input.spaceName}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#64748B;line-height:1.6;">
            You've been invited to collaborate on <strong style="color:#1A1A2E;">${input.spaceName}</strong> on Cost Tracking. Accept the invite to start tracking expenses together.
          </p>
          <!-- Button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${acceptUrl}" style="display:inline-block;background-color:#1A1A2E;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;">
                Accept invite
              </a>
            </td></tr>
          </table>
          <!-- Fallback link -->
          <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;word-break:break-all;">
            Or copy this link: <a href="${acceptUrl}" style="color:#64748B;text-decoration:underline;">${acceptUrl}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="border-top:1px solid #E3E9EC;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">
            This invite expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
        </td></tr>
      </table>
      <!-- Branding -->
      <p style="margin:24px 0 0;font-size:11px;color:#94A3B8;text-align:center;">Cost Tracking</p>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("[Invite Email] Failed to send:", error);
    } else {
      console.log("[Invite Email] Sent to", input.recipientEmail, "id:", data?.id);
    }
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
