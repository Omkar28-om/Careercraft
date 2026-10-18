import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  color = "from-[#8B5CF6] to-[#7C3AED]",
  to,
  tag,
  className = "",
}) {
  const content = (
    <div
      className={`group relative flex flex-col justify-between h-full rounded-2xl border border-white/10 bg-[#111827] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#8B5CF6]/40 hover:shadow-xl hover:shadow-purple-600/10 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg shadow-black/30`}
          >
            <Icon size={22} className="text-white" />
          </div>
          {tag && (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-[#94A3B8] border border-white/10 font-mono">
              {tag}
            </span>
          )}
        </div>

        <h3 className="mt-5 text-lg font-bold text-[#F8FAFC] transition-colors group-hover:text-[#C4B5FD]">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA] group-hover:text-[#C4B5FD] transition-colors">
        <span>Explore {title}</span>
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{content}</Link>;
  }

  return content;
}
