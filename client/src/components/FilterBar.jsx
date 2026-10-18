
export default function FilterBar({
  options = [],
  active,
  onChange,
  className = "",
  size = "sm",
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const count = typeof opt === "object" ? opt.count : undefined;
        const isActive = active === val;

        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition cursor-pointer select-none ${
              size === "xs"
                ? "px-2.5 py-1 text-xs"
                : "px-3.5 py-1.5 text-xs sm:text-sm"
            } ${
              isActive
                ? "bg-cyan-400 font-bold text-slate-950 shadow-md shadow-cyan-400/20"
                : "border border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive
                    ? "bg-slate-900/20 text-slate-950"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
