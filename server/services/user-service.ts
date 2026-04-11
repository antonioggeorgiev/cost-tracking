import type { User as ClerkUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const userService = {
  async syncFromClerk(user: ClerkUser) {
    const primaryEmail = user.primaryEmailAddress?.emailAddress;

    if (!primaryEmail) {
      throw new Error("Clerk user must have a primary email address.");
    }

    return db.user.upsert({
      where: {
        clerkUserId: user.id,
      },
      update: {
        email: primaryEmail,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null,
        imageUrl: user.imageUrl,
      },
      create: {
        clerkUserId: user.id,
        email: primaryEmail,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null,
        imageUrl: user.imageUrl,
      },
    });
  },
};
