
export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "right",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#8B5CF6] text-white hover:bg-[#7C3AED] active:scale-[0.98] shadow-lg shadow-purple-600/25 font-semibold",
    secondary:
      "bg-[#1E293B] text-[#F8FAFC] border border-white/10 hover:bg-[#2A374D] hover:border-purple-500/40 active:scale-[0.98]",
    cyan:
      "bg-[#22D3EE] text-slate-950 hover:bg-[#06B6D4] active:scale-[0.98] shadow-lg shadow-cyan-500/20 font-bold",
    outline:
      "bg-transparent border border-[#8B5CF6]/40 text-[#A78BFA] hover:bg-[#8B5CF6]/10 hover:border-[#8B5CF6] active:scale-[0.98]",
    ghost:
      "bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]",
    emerald:
      "bg-[#10B981] text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 font-bold",
    danger:
      "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />}
      <span>{children}</span>
      {Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />}
    </button>
  );
}
