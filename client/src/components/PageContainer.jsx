
export default function PageContainer({
  children,
  className = "",
  maxWidth = "max-w-7xl",
}) {
  return (
    <div className="relative min-h-screen bg-[#080B14] text-[#F8FAFC] selection:bg-[#8B5CF6]/30 selection:text-[#F8FAFC]">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-[#8B5CF6]/10 blur-[150px]" />
      <div className="pointer-events-none absolute top-1/3 -left-40 -z-10 h-[450px] w-[450px] rounded-full bg-[#22D3EE]/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 -right-40 -z-10 h-[450px] w-[450px] rounded-full bg-[#8B5CF6]/10 blur-[160px]" />

      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 ${maxWidth} ${className}`}>
        {children}
      </div>
    </div>
  );
}
