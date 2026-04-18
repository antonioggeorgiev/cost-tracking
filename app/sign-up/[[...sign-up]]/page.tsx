import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import { routes } from "@/lib/routes";
import { platformConfigService } from "@/server/services/platform-config-service";

export default async function SignUpPage() {
  if (!isClerkConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-xl rounded-3xl p-6 text-center text-slate-300">
          Configure Clerk environment variables to use sign-up.
        </div>
      </main>
    );
  }

  const config = await platformConfigService.getConfig();

  if (!config.signupsEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <h1 className="font-heading text-xl font-bold text-heading">
            Registrations Closed
          </h1>
          <p className="mt-3 text-sm text-body">
            New registrations are currently disabled. If you already have an
            account, please sign in.
          </p>
          <Link
            href={routes.signIn}
            className="mt-5 inline-block rounded-lg bg-heading px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Go to Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignUp />
    </main>
  );
}
