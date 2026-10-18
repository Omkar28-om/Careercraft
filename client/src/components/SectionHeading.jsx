
export default function SectionHeading({
  pill,
  title,
  highlight,
  subtitle,
  align = "center",
  className = "",
}) {
  const alignClasses = {
    center: "text-center mx-auto items-center",
    left: "text-left items-start",
    right: "text-right items-end",
  };

  return (
    <div className={`flex flex-col max-w-3xl ${alignClasses[align]} ${className}`}>
      {pill && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-xs font-semibold uppercase tracking-[0.2em] text-[#C4B5FD] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
          <span>{pill}</span>
        </div>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F8FAFC] leading-[1.15]">
        {title}{" "}
        {highlight && (
          <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent">
            {highlight}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#94A3B8] font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
