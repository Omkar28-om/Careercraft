import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Code2,
  Coffee,
  Database,
  Layers,
  Loader2,
  Megaphone,
  Palette,
  Search,
  ShieldAlert,
  Sparkles,
  Terminal,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { OFFICIAL_DOMAINS, getSelectedDomain, setSelectedDomain } from "../utils/learningPath";

const DOMAIN_ICONS = {
  "Full Stack Development": Layers,
  "AI & Machine Learning": Sparkles,
  "Data Science & Analytics": BarChart3,
  "Java Development": Coffee,
  "Python Development": Terminal,
  "UI/UX & Product Design": Palette,
  "Cybersecurity": ShieldAlert,
  "Digital Marketing": Megaphone,
};

const DOMAIN_STYLES = {
  violet: {
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    border: "hover:border-violet-500/50 hover:shadow-violet-500/10",
    button: "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20",
    activeRing: "ring-2 ring-violet-500 border-violet-500/60 bg-violet-950/20",
  },
  purple: {
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    border: "hover:border-purple-500/50 hover:shadow-purple-500/10",
    button: "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20",
    activeRing: "ring-2 ring-purple-500 border-purple-500/60 bg-purple-950/20",
  },
  cyan: {
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    border: "hover:border-cyan-500/50 hover:shadow-cyan-500/10",
    button: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20",
    activeRing: "ring-2 ring-cyan-400 border-cyan-400/60 bg-cyan-950/20",
  },
  amber: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    border: "hover:border-amber-500/50 hover:shadow-amber-500/10",
    button: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20",
    activeRing: "ring-2 ring-amber-500 border-amber-500/60 bg-amber-950/20",
  },
  emerald: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    border: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
    button: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20",
    activeRing: "ring-2 ring-emerald-500 border-emerald-500/60 bg-emerald-950/20",
  },
  pink: {
    badge: "border-pink-500/30 bg-pink-500/10 text-pink-300",
    border: "hover:border-pink-500/50 hover:shadow-pink-500/10",
    button: "bg-pink-600 hover:bg-pink-500 text-white shadow-pink-500/20",
    activeRing: "ring-2 ring-pink-500 border-pink-500/60 bg-pink-950/20",
  },
  rose: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    border: "hover:border-rose-500/50 hover:shadow-rose-500/10",
    button: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20",
    activeRing: "ring-2 ring-rose-500 border-rose-500/60 bg-rose-950/20",
  },
  orange: {
    badge: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    border: "hover:border-orange-500/50 hover:shadow-orange-500/10",
    button: "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20",
    activeRing: "ring-2 ring-orange-500 border-orange-500/60 bg-orange-950/20",
  },
};

export default function Domains() {
  const { user, saveCareerDomain } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [savingDomain, setSavingDomain] = useState("");
  const [selectedDomain, setCurrentSelectedDomain] = useState(
    user?.career_domain || getSelectedDomain() || ""
  );

  useEffect(() => {
    if (user?.career_domain) {
      setCurrentSelectedDomain(user.career_domain);
      setSelectedDomain(user.career_domain);
    }
  }, [user]);

  const handleSelectDomain = async (domainName) => {
    setSavingDomain(domainName);
    try {
      if (saveCareerDomain) {
        await saveCareerDomain(domainName);
      } else {
        setSelectedDomain(domainName);
      }
      setCurrentSelectedDomain(domainName);
      // Seamlessly navigate to personalized home
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 400);
    } catch (err) {
      console.error("Failed to save career domain:", err);
      setSelectedDomain(domainName);
      setCurrentSelectedDomain(domainName);
      navigate("/", { replace: true });
    } finally {
      setSavingDomain("");
    }
  };

  const filteredDomains = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return OFFICIAL_DOMAINS;
    return OFFICIAL_DOMAINS.filter((domain) => {
      const matchName = domain.name.toLowerCase().includes(q);
      const matchDesc = domain.description.toLowerCase().includes(q);
      const matchSkills = domain.skills.some((s) => s.toLowerCase().includes(q));
      const matchRoles = domain.roles.some((r) => r.toLowerCase().includes(q));
      return matchName || matchDesc || matchSkills || matchRoles;
    });
  }, [search]);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827] via-[#0d1424] to-[#080B14] p-7 sm:p-10 lg:p-12 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1 text-xs font-semibold text-cyan-200">
              <Sparkles size={14} /> Career Personalization
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Choose your <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">career domain</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Select your target engineering or digital discipline. CareerCraft will immediately tailor your course roadmap, algorithmic practice, portfolio projects, and job & internship matches.
            </p>

            {selectedDomain && (
              <div className="mt-5 inline-flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={15} />
                <span>Current selection: <strong>{selectedDomain}</strong></span>
                <span className="text-slate-400 font-normal">· Select another below anytime</span>
              </div>
            )}

            <label className="mt-7 flex max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-slate-400 focus-within:border-cyan-300/40">
              <Search size={17} className="shrink-0 text-cyan-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search domain, role, or skill (e.g. React, Java, Security, Python)"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                aria-label="Search career domains"
              />
            </label>
          </div>
        </section>

        {/* Section Header */}
        <div className="mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Personalized Career Tracks
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">
              8 Official Career Tracks
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose one track to activate your personalized student homepage.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Browse all courses <ArrowRight size={16} />
          </Link>
        </div>

        {/* Grid of 8 Domains */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredDomains.map((domain) => {
            const Icon = DOMAIN_ICONS[domain.name] || Code2;
            const style = DOMAIN_STYLES[domain.color] || DOMAIN_STYLES.violet;
            const isCurrent = selectedDomain.toLowerCase() === domain.name.toLowerCase();
            const isSaving = savingDomain === domain.name;

            return (
              <div
                key={domain.id}
                className={`domain-card group relative flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#101827]/90 p-6 transition duration-200 hover:-translate-y-1 hover:shadow-xl ${style.border} ${
                  isCurrent ? style.activeRing : ""
                }`}
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${style.badge}`}
                    >
                      <Icon size={24} />
                    </span>
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-extrabold text-emerald-300">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
                        {domain.shortName}
                      </span>
                    )}
                  </div>

                  {/* Eyebrow & Title */}
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {domain.eyebrow}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white group-hover:text-cyan-200 transition">
                    {domain.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {domain.description}
                  </p>

                  {/* Skills tags */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Core Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {domain.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Target Roles */}
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Example Roles
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {domain.roles.join(", ")}
                    </p>
                  </div>
                </div>

                {/* Select Button */}
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    data-domain-select={domain.name}
                    disabled={isSaving}
                    onClick={() => handleSelectDomain(domain.name)}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition shadow-sm ${
                      isCurrent
                        ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                        : style.button
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving…</span>
                      </>
                    ) : isCurrent ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Selected · Go to Home</span>
                      </>
                    ) : (
                      <>
                        <span>Select Track</span>
                        <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDomains.length === 0 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#101827] px-6 py-14 text-center">
            <BookOpen size={28} className="mx-auto text-slate-500" />
            <h3 className="mt-4 text-lg font-bold text-white">No matching career tracks</h3>
            <p className="mt-2 text-sm text-slate-400">
              Try searching for something else like &quot;React&quot;, &quot;Java&quot;, or &quot;Cybersecurity&quot;.
            </p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:underline"
            >
              Clear search filter
            </button>
          </div>
        )}

        {/* Value Proposition Callouts */}
        <section className="mt-14 grid gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:grid-cols-3 sm:p-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-violet-300">
              01 · Tailored Learning
            </span>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Structured course modules and hands-on lessons mapped to your chosen track.
            </p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              02 · Practice & Projects
            </span>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Domain-aligned algorithmic problems with in-browser execution and verified portfolio ideas.
            </p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              03 · Opportunities
            </span>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Student job and internship openings matched directly with your active career domain.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
