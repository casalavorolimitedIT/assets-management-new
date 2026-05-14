
export const StatCard = ({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) => (
  <div
    className={`rounded-2xl p-4 border ${accent} flex flex-col gap-2 shadow-sm`}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
        {label}
      </span>
      <span className="opacity-70">{icon}</span>
    </div>
    <p className="text-2xl font-bold tracking-tight">{value}</p>
    {sub && <p className="text-xs opacity-55">{sub}</p>}
  </div>
);