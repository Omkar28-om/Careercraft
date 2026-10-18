
export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendPositive = true,
  description,
  className = "",
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.05] ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
            <Icon size={20} />
          </div>
        )}
      </div>

      {(trend || description) && (
        <div className="mt-3.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trendPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trend}
            </span>
          )}
          {description && <span className="text-slate-500">{description}</span>}
        </div>
      )}
    </div>
  );
}
