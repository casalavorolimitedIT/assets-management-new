
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
    className={`rounded-2xl p-4 border ${accent} flex flex-col gap-2 shadow-sm overflow-hidden`}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider opacity-60 truncate mr-2">
        {label}
      </span>
      <span className="opacity-70 shrink-0">{icon}</span>
    </div>
    <p className="text-lg font-bold tracking-tight leading-tight break-all sm:text-xl">{value}</p>
    {sub && <p className="text-xs opacity-55 truncate">{sub}</p>}
  </div>
);