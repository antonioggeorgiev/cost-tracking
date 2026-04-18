import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

type DashboardPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspaceSlug } = await params;
  redirect(routes.workspaceOverview(workspaceSlug));
}
