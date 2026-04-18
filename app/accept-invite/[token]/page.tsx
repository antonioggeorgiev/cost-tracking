import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";
import { Mail, UserPlus, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";

type AcceptInvitePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

async function AcceptInviteForm({ token }: { token: string }) {
  async function acceptInviteAction() {
    "use server";

    let errorMessage: string | null = null;

    try {
      const caller = await getServerCaller();
      await caller.members.acceptInvite({ token });
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Unable to accept invite.";
    }

    if (errorMessage) {
      redirect(`${routes.acceptInvite(token)}?error=${encodeURIComponent(errorMessage)}`);
    }

    redirect(routes.overview);
  }

  return (
    <form action={acceptInviteAction}>
      <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-on-primary shadow-sm transition hover:bg-primary-dark">
        <UserPlus size={16} />
        Accept invite
      </button>
    </form>
  );
}

export default async function AcceptInvitePage({ params, searchParams }: AcceptInvitePageProps) {
  const { token } = await params;

  const user = await currentUser();
  if (!user) {
    redirect(`${routes.signIn}?redirect_url=${encodeURIComponent(routes.acceptInvite(token))}`);
  }

  const { error } = await searchParams;
  const caller = await getServerCaller();
  const invite = await caller.members.inviteByToken({ token });

  const userEmail = user.primaryEmailAddress?.emailAddress;

  // ── Not found ──
  if (!invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg p-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
            <XCircle size={24} />
          </div>
          <h1 className="mt-5 font-heading text-xl font-bold text-heading">Invite not found</h1>
          <p className="mt-2 text-sm text-body">
            This invite link is invalid or has already been used.
          </p>
          <div className="mt-6">
            <Link
              href={routes.home}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-dark"
            >
              Go to home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── Already accepted ──
  if (invite.status === "accepted") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg p-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-posted-bg text-posted">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="mt-5 font-heading text-xl font-bold text-heading">Already accepted</h1>
          <p className="mt-2 text-sm text-body">
            This invite to <span className="font-medium text-heading">{invite.space.name}</span> has already been accepted.
          </p>
          <div className="mt-6">
            <Link
              href={routes.overview}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-dark"
            >
              Go to overview
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── Revoked ──
  if (invite.status === "revoked") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg p-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
            <XCircle size={24} />
          </div>
          <h1 className="mt-5 font-heading text-xl font-bold text-heading">Invite revoked</h1>
          <p className="mt-2 text-sm text-body">
            This invite to <span className="font-medium text-heading">{invite.space.name}</span> has been revoked by the space owner.
          </p>
          <div className="mt-6">
            <Link
              href={routes.home}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-dark"
            >
              Go to home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── Expired ──
  if (invite.status === "expired" || invite.expiresAt <= new Date()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg p-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-bg text-warning">
            <Clock size={24} />
          </div>
          <h1 className="mt-5 font-heading text-xl font-bold text-heading">Invite expired</h1>
          <p className="mt-2 text-sm text-body">
            This invite to <span className="font-medium text-heading">{invite.space.name}</span> has expired.
            Ask the space owner to send a new one.
          </p>
          <div className="mt-6">
            <Link
              href={routes.home}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-dark"
            >
              Go to home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── Pending — main accept flow ──
  const emailMismatch = userEmail && invite.email !== userEmail.toLowerCase();

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="border-b border-border p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <Mail size={24} />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-bold text-heading">
            Join {invite.space.name}
          </h1>
          <p className="mt-2 text-sm text-body">
            You&apos;ve been invited as {invite.role === "editor" ? "an" : "a"}{" "}
            <span className="inline-flex items-center rounded-full bg-primary-lighter px-2.5 py-0.5 text-xs font-semibold text-primary">
              {invite.role}
            </span>
          </p>
        </div>

        {/* Body */}
        <div className="p-8">
          {error ? (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-danger bg-danger-bg p-4 text-sm text-danger">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{decodeURIComponent(error)}</span>
            </div>
          ) : null}

          {emailMismatch ? (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning-bg p-4 text-sm text-warning-text">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Wrong account</p>
                  <p className="mt-1">
                    This invite was sent to <span className="font-semibold">{invite.email}</span>,
                    but you&apos;re signed in as <span className="font-semibold">{userEmail}</span>.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-body">
                Sign out and sign in with the correct account to accept.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary text-xs font-bold">
                  {(userEmail ?? "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-heading truncate">{userEmail}</p>
                  <p className="text-xs text-body">Your account</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <AcceptInviteForm token={token} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-8 py-4 text-center">
          <Link href={routes.home} className="text-sm text-body transition hover:text-heading">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
