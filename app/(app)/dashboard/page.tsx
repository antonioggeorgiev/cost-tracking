import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default async function DashboardPage() {
  redirect(routes.overview);
}
