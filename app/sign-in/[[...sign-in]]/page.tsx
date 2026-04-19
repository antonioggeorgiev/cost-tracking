import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import { platformConfigService } from "@/server/services/platform-config-service";

export default async function SignInPage() {
  if (!isClerkConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-xl rounded-3xl p-6 text-center text-slate-300">
          Configure Clerk environment variables to use sign-in.
        </div>
      </main>
    );
  }

  const config = await platformConfigService.getConfig();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignIn
        appearance={
          !config.signupsEnabled
            ? { elements: { footerAction: { display: "none" } } }
            : undefined
        }
      />
    </main>
  );
}
