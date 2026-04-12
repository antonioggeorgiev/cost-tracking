import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";

export default function SignInPage() {
  if (!isClerkConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-xl rounded-3xl p-6 text-center text-slate-300">
          Configure Clerk environment variables to use sign-in.
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignIn />
    </main>
  );
}
