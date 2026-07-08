export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-[var(--muted)] mt-1">{subtitle}</p>}
    </div>
  );
}
