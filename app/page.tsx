import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";

export default function HomePage() {
  return (
    <main className="container py-10 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
        <section className="space-y-6">
          <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-200">
            Multi-workspace expense tracking for renovation and daily costs
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">
              Replace ad hoc finance notes with a shared cost-tracking workspace.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Track one-time purchases, recurring expenses, debts, and multi-currency spending in a workspace everyone can see.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isClerkConfigured ? (
              <>
                <SignedOut>
                  <SignUpButton>
                    <button className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">
                      Create account
                    </button>
                  </SignUpButton>
                  <SignInButton>
                    <button className="rounded-2xl border border-white/10 px-5 py-3 font-medium text-white">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/app" className="rounded-2xl bg-emerald-300 px-5 py-3 font-medium text-slate-950">
                    Open app
                  </Link>
                </SignedIn>
              </>
            ) : (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Add Clerk env variables to enable sign-in and protected app routes.
              </div>
            )}
          </div>
        </section>

        <section className="card rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold text-white">MVP foundation</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>Invite-only workspaces with shared visibility</li>
            <li>Parent and child categories with depth limited to 2</li>
            <li>Multi-currency entries normalized into a workspace base currency</li>
            <li>Recurring expense templates and manual debt tracking</li>
            <li>Clerk auth, Prisma, Neon, Resend, and Open Exchange Rates</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
