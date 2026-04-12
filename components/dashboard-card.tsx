type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
};

export function DashboardCard({ title, value, description }: DashboardCardProps) {
  return (
    <section className="card rounded-3xl p-5">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </section>
  );
}
