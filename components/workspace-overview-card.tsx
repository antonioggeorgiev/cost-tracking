type WorkspaceOverviewCardProps = {
  label: string;
  value: string;
  help: string;
};

export function WorkspaceOverviewCard({ label, value, help }: WorkspaceOverviewCardProps) {
  return (
    <section className="card rounded-3xl p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-muted">{help}</p>
    </section>
  );
}
