import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk";
import { routes } from "@/lib/routes";
import { getServerCaller } from "@/server/trpc-caller";

type AcceptInvitePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

async function AcceptInviteForm({ token }: { token: string }) {
  async function acceptInviteAction() {
    "use server";

    try {
      const caller = await getServerCaller();
      await caller.members.acceptInvite({ token });

      redirect(routes.overview);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to accept invite.";
      redirect(`${routes.acceptInvite(token)}?error=${encodeURIComponent(message)}`);
    }
  }

  return (
    <form action={acceptInviteAction} className="mt-6">
      <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">
        Accept invite
      </button>
    </form>
  );
}

export default async function AcceptInvitePage({ params, searchParams }: AcceptInvitePageProps) {
  const { token } = await params;
  const { error } = await searchParams;

  return (
    <main className="container py-10">
      <section className="card max-w-2xl rounded-3xl p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Invite</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Accept workspace invite</h1>
        <p className="mt-3 text-slate-300">
          Sign in with the invited email address and accept the invite to join the workspace.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Invite token: <span className="font-mono text-white">{token}</span>
        </p>

        {!isClerkConfigured ? (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            Clerk is not configured in this environment.
          </div>
        ) : (
          <>
            <SignedOut>
              <div className="mt-6 flex flex-wrap gap-3">
                <SignInButton forceRedirectUrl={routes.acceptInvite(token)}>
                  <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">
                    Sign in to accept
                  </button>
                </SignInButton>
                <SignUpButton forceRedirectUrl={routes.acceptInvite(token)}>
                  <button className="rounded-2xl border border-white/10 px-5 py-3 font-medium text-white">
                    Create account
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>

            <SignedIn>
              <AcceptInviteForm token={token} />
            </SignedIn>
          </>
        )}

        <div className="mt-6">
          <Link href={routes.home} className="text-sm text-slate-400 hover:text-slate-200">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
