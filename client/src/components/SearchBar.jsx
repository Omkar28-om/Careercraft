import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  onClear,
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={17}
        className="pointer-events-none absolute left-3.5 text-slate-500"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-9 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else onChange("");
          }}
          className="absolute right-3 rounded p-0.5 text-slate-500 hover:text-white"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
