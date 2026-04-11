import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function getSessionUserId() {
  const session = await auth();

  return session.userId;
}

export async function requireSessionUserId() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
}

export async function getCurrentClerkUser() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
