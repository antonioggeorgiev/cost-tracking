import { SpaceCreator } from "@/components/space-creator";
import { SpaceList } from "@/components/space-list";
import { getServerCaller } from "@/server/trpc-caller";
import { LayoutDashboard } from "lucide-react";

export default async function SpacesPage() {
  const caller = await getServerCaller();
  const spaces = await caller.spaces.listMine();

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-lighter text-primary">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Overview</p>
            <h1 className="font-heading text-2xl font-bold text-heading">Your Spaces</h1>
          </div>
        </div>
        <p className="text-sm text-body">
          Create a space or select an existing one. Each space has its own currency, categories, and members.
        </p>
      </section>

      <SpaceCreator />

      {spaces.length > 0 ? <SpaceList spaces={spaces} /> : null}
    </>
  );
}
