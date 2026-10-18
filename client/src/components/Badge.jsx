export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}) {
  const sizeStyles = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3 py-1.5 text-xs",
  };

  const variantStyles = {
    default: "bg-white/5 text-slate-300 border border-white/10",
    primary: "bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30",
    violet: "bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30",
    cyan: "bg-cyan-400/10 text-cyan-300 border border-cyan-400/25",
    emerald: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
    blue: "bg-blue-500/10 text-blue-300 border border-blue-500/25",
    purple: "bg-purple-500/10 text-purple-300 border border-purple-500/25",
    indigo: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/25",
    amber: "bg-amber-400/10 text-amber-300 border border-amber-400/25",
    warning: "bg-amber-400/10 text-amber-300 border border-amber-400/25",
    rose: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
    red: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
    danger: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
    // Difficulties
    Easy: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/25 font-semibold",
    Medium: "bg-amber-400/10 text-amber-300 border border-amber-400/25 font-semibold",
    Hard: "bg-rose-500/10 text-rose-300 border border-rose-500/25 font-semibold",
  };

  const style = variantStyles[children] || variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-lg tracking-wide ${
        sizeStyles[size] || sizeStyles.sm
      } ${style} ${className}`}
    >
      {children}
    </span>
  );
}
