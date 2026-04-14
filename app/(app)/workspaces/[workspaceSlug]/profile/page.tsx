import { getCurrentClerkUser } from "@/lib/auth";
import { UserProfile } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import { User } from "lucide-react";

export default async function ProfilePage() {
  if (!isClerkConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-heading">Profile</h1>
          <p className="mt-2 text-sm text-body">Authentication is not configured.</p>
        </div>
      </div>
    );
  }

  const user = await getCurrentClerkUser();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-heading">Profile Settings</h1>
        <p className="mt-2 text-sm text-body">Manage your personal account settings.</p>
      </div>

      {/* User info */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <User size={18} />
          </div>
          <h2 className="font-heading text-base font-semibold text-heading">Account</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Name</p>
            <p className="mt-1 font-medium text-heading">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Email</p>
            <p className="mt-1 font-medium text-heading">
              {user.emailAddresses[0]?.emailAddress ?? "—"}
            </p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Joined</p>
            <p className="mt-1 font-medium text-heading">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Clerk UserProfile component for full management */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden [&_.cl-rootBox]:w-full [&_.cl-card]:shadow-none [&_.cl-card]:border-0 [&_.cl-navbar]:hidden [&_.cl-pageScrollBox]:p-6">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 rounded-none",
            },
          }}
        />
      </section>
    </div>
  );
}
