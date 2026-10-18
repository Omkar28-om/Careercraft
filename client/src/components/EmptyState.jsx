import { SearchX } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = SearchX,
  title = "No results found",
  description = "Try adjusting your search query or filters to find what you're looking for.",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-10 text-center sm:p-14 ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400 border border-white/10">
        <Icon size={26} />
      </div>

      <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>

      <p className="mt-2 max-w-sm text-sm text-slate-400 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
