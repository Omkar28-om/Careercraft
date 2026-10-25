import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getJobs, applyToJob, saveJob, unsaveJob } from "../services/api";
import { getSelectedDomain, isRelatedToDomain } from "../utils/learningPath";

export default function Internships() {
  const { user } = useAuth();
  const selectedDomain = getSelectedDomain();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkMode, setSelectedWorkMode] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [applyModalItem, setApplyModalItem] = useState(null);
  const [coverNote, setCoverNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState("");

  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { jobType: "internship" };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedWorkMode !== "All") params.workMode = selectedWorkMode.toLowerCase();
      if (selectedCategory !== "All") params.category = selectedCategory;

      const res = await getJobs(params);
      if (res?.success && Array.isArray(res.jobs)) {
        setInternships(res.jobs);
      } else {
        setInternships([]);
      }
    } catch (err) {
      console.error("Failed to load internships:", err);
      setError(err?.message || "Failed to load internship opportunities.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedWorkMode, selectedCategory]);

  const visibleInternships = useMemo(
    () => internships.filter((internship) => isRelatedToDomain(internship, selectedDomain)),
    [internships, selectedDomain],
  );

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const categories = useMemo(() => {
    const set = new Set();
    internships.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ["All", ...Array.from(set)];
  }, [internships]);

  const handleOpenApplyModal = (item) => {
    setApplyModalItem(item);
    setCoverNote("");
    setApplyError("");
    setApplySuccess(false);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to submit applications.");
      return;
    }
    if (!applyModalItem) return;

    try {
      setApplying(true);
      setApplyError("");
      const res = await applyToJob(applyModalItem.id, {
        coverNote: coverNote.trim() || null,
      });

      if (res?.success) {
        setApplySuccess(true);
        setInternships((prev) =>
          prev.map((i) =>
            i.id === applyModalItem.id ? { ...i, hasApplied: true, applicationStatus: "applied" } : i
          )
        );
        setTimeout(() => {
          setApplyModalItem(null);
          setApplySuccess(false);
        }, 1500);
      } else {
        setApplyError(res?.message || "Application submission failed.");
      }
    } catch (err) {
      setApplyError(err?.message || "An error occurred while submitting.");
    } finally {
      setApplying(false);
    }
  };

  const formatStipend = (item) => {
    if (!item.salaryMin && !item.salaryMax) return "Competitive Stipend";
    return `₹${Number(item.salaryMin || 0).toLocaleString()} - ₹${Number(item.salaryMax || 0).toLocaleString()} / mo`;
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B14] p-8 sm:p-10 backdrop-blur-xl">
          <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 -z-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-violet-500/10 px-3 py-0.5 text-xs font-semibold text-violet-300 border border-violet-500/20">
                  Student Internships
                </span>
                <span className="text-xs text-slate-400">Software & Engineering Roles</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
                Software Engineering Internships
              </h1>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Gain hands-on industry experience before graduating. Explore CareerCraft summer internships and part-time developer roles with transparent stipends and skill criteria.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link to="/jobs">
                <Button variant="secondary" size="sm">
                  View Full-Time Jobs
                </Button>
              </Link>
              <Link to="/applications">
                <Button variant="outline" size="sm">
                  My Applications
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-rose-400 shrink-0" size={20} />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
            <button
              onClick={fetchInternships}
              className="text-xs font-semibold text-rose-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search internships by role, company, or skills..."
            className="w-full md:max-w-md"
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Work Mode:</span>
              <FilterBar
                options={["All", "Remote", "Hybrid", "Onsite"]}
                active={selectedWorkMode}
                onChange={setSelectedWorkMode}
                size="xs"
              />
            </div>
          </div>
        </div>

        {/* Internship Listings */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap size={20} className="text-cyan-400" />
              <span>Available Internships</span>
              <span className="text-xs font-normal text-slate-400">
                ({visibleInternships.length} listings{selectedDomain ? ` · ${selectedDomain}` : ""})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-cyan-400 mb-2" />
              <p className="text-sm">Loading CareerCraft internships from PostgreSQL...</p>
            </div>
          ) : visibleInternships.length === 0 ? (
            <EmptyState
              title={selectedDomain ? `No ${selectedDomain} internships match these filters` : "No internships match your criteria"}
              description="Try broadening your search or change your learning domain to see other student opportunities."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchQuery("");
                setSelectedWorkMode("All");
                setSelectedCategory("All");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleInternships.map((item) => {
                const isDemo =
                  item.applicationUrl?.includes("careercraft.local") ||
                  item.isDemo ||
                  item.companyName === "Microsoft" ||
                  item.companyName === "Google";

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-6 hover:border-cyan-400/40 hover:bg-white/[0.04] transition"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                              {item.companyName}
                            </h4>
                            {isDemo ? (
                              <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                Demo Opportunity
                              </span>
                            ) : (
                              (item.isVerified || item.verified) && (
                                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                                  Verified Employer
                                </span>
                              )
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <MapPin size={12} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{item.location} • <span className="capitalize">{item.workMode}</span></span>
                          </div>
                        </div>

                        {item.hasApplied && (
                          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Applied
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <Link to={`/jobs/${item.id}`}>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>

                      <div className="mt-3">
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          {formatStipend(item)}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Skills */}
                      {Array.isArray(item.skills) && item.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {item.skills.slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] text-slate-400"
                            >
                              {s}
                            </span>
                          ))}
                          {item.skills.length > 4 && (
                            <span className="text-[10px] text-slate-500 py-0.5">
                              +{item.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <Link
                        to={`/jobs/${item.id}`}
                        className="text-slate-400 hover:text-white font-medium text-xs"
                      >
                        Details &rarr;
                      </Link>

                      <button
                        onClick={() => handleOpenApplyModal(item)}
                        disabled={item.hasApplied}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          item.hasApplied
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                        }`}
                      >
                        {item.hasApplied ? "Applied" : "Apply Now"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Application Modal */}
      {applyModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#070d19] p-6 text-white shadow-2xl">
            <h3 className="text-base font-bold">Apply for Internship</h3>
            <p className="text-xs text-slate-400 mt-1">
              {applyModalItem.title} at {applyModalItem.companyName}
            </p>

            {applySuccess ? (
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center">
                <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-2" />
                <p className="font-bold">Application Submitted Successfully!</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Track progress in your CareerCraft Applications portal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="mt-4 space-y-4 text-xs">
                {applyError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {applyError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Applicant Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || "Student"}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-slate-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cover Note (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Briefly explain your technical background and why you are interested in this internship..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setApplyModalItem(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={applying}
                  >
                    {applying ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
