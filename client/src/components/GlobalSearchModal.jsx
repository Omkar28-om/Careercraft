import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Code2,
  BookOpen,
  BriefcaseBusiness,
  Sparkles,
  ArrowRight,
  Loader2,
  CornerDownLeft,
} from "lucide-react";
import {
  getCourses,
  getCodingProblems,
  getJobs,
  getFreelanceProjects,
} from "../services/api";

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    courses: [],
    problems: [],
    jobs: [],
    freelance: [],
  });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults({ courses: [], problems: [], jobs: [], freelance: [] });
      setHasSearched(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced multi-API search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ courses: [], problems: [], jobs: [], freelance: [] });
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const [cRes, pRes, jRes, fRes] = await Promise.all([
          getCourses({ search: query.trim() }).catch(() => null),
          getCodingProblems({ search: query.trim() }).catch(() => null),
          getJobs({ search: query.trim() }).catch(() => null),
          getFreelanceProjects({ search: query.trim() }).catch(() => null),
        ]);

        setResults({
          courses: (cRes?.courses || []).slice(0, 4),
          problems: (pRes?.problems || []).slice(0, 4),
          jobs: (jRes?.jobs || []).slice(0, 4),
          freelance: (fRes?.projects || []).slice(0, 4),
        });
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url) => {
    onClose();
    navigate(url);
  };

  if (!isOpen) return null;

  const totalResults =
    results.courses.length +
    results.problems.length +
    results.jobs.length +
    results.freelance.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#070d19] text-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-white/10 px-4 py-3.5">
          <Search size={20} className="text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, coding problems, jobs, freelance..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 outline-none"
          />
          {loading ? (
            <Loader2 size={18} className="animate-spin text-cyan-400 shrink-0 ml-2" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-white shrink-0 ml-2 p-1"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-white/10 bg-white/5">
              ESC
            </kbd>
          )}
        </div>

        {/* Search Results / Suggestions */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {!hasSearched && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 px-2">
                Quick Navigation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Learn Courses", path: "/courses", icon: BookOpen, color: "text-blue-400" },
                  { label: "Coding Practice", path: "/coding", icon: Code2, color: "text-emerald-400" },
                  { label: "Career & Jobs", path: "/jobs", icon: BriefcaseBusiness, color: "text-purple-400" },
                  { label: "Freelance", path: "/freelance", icon: Sparkles, color: "text-cyan-400" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleSelect(item.path)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-400/30 transition text-center group cursor-pointer"
                    >
                      <Icon size={18} className={`mb-1.5 ${item.color}`} />
                      <span className="text-xs text-slate-300 font-medium group-hover:text-white">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasSearched && totalResults === 0 && !loading && (
            <div className="py-12 text-center text-slate-400">
              <Search size={32} className="mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-white">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for technologies like Python, React, Algorithms, or Engineering roles.
              </p>
            </div>
          )}

          {/* Courses Results */}
          {results.courses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 px-2">
                <BookOpen size={14} />
                <span>Courses ({results.courses.length})</span>
              </div>
              <div className="space-y-1">
                {results.courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/courses/${c.slug}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition text-left cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {c.category} • {c.level} • {Math.round((c.durationMinutes || 0) / 60)} hrs
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition shrink-0 ml-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Problems Results */}
          {results.problems.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 px-2">
                <Code2 size={14} />
                <span>Coding Problems ({results.problems.length})</span>
              </div>
              <div className="space-y-1">
                {results.problems.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(`/coding/problems/${p.slug}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition text-left cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p.category} • <span className={p.difficulty === "Easy" ? "text-emerald-400" : p.difficulty === "Medium" ? "text-amber-400" : "text-rose-400"}>{p.difficulty}</span>
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition shrink-0 ml-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Jobs Results */}
          {results.jobs.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 px-2">
                <BriefcaseBusiness size={14} />
                <span>Jobs & Internships ({results.jobs.length})</span>
              </div>
              <div className="space-y-1">
                {results.jobs.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => handleSelect(`/jobs/${j.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition text-left cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                        {j.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {j.companyName} • {j.location} • <span className="capitalize">{j.jobType}</span>
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition shrink-0 ml-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Freelance Results */}
          {results.freelance.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 px-2">
                <Sparkles size={14} />
                <span>Freelance Projects ({results.freelance.length})</span>
              </div>
              <div className="space-y-1">
                {results.freelance.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelect(`/freelance/projects/${f.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition text-left cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                        {f.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {f.category} • ₹{Number(f.budgetMin || 0).toLocaleString()} - ₹{Number(f.budgetMax || 0).toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition shrink-0 ml-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 bg-white/[0.02] text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5">ESC</kbd> to exit</span>
            <span className="hidden sm:inline">| Press <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5">Ctrl+K</kbd> anywhere</span>
          </div>
          <span className="text-cyan-400 font-semibold">CareerCraft Global Search</span>
        </div>
      </div>
    </div>
  );
}
