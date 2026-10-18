import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { getSavedJobs, unsaveJob } from "../api";
import { useAuth } from "../context/AuthContext";

export default function SavedJobs() {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSavedJobs();
      if (res?.success && Array.isArray(res.savedJobs)) {
        setSavedJobs(res.savedJobs);
      } else {
        setSavedJobs([]);
      }
    } catch (err) {
      console.error("Failed to load saved jobs:", err);
      setError(err?.message || "Failed to load saved positions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedList();
  }, [fetchSavedList]);

  const handleUnsave = async (jobId) => {
    try {
      const res = await unsaveJob(jobId);
      if (res?.success) {
        setSavedJobs((prev) => prev.filter((item) => item.job.id !== jobId));
      }
    } catch (err) {
      console.error("Failed to unsave job:", err);
      alert(err?.message || "Failed to unsave job.");
    }
  };

  const formatSalary = (job) => {
    if (!job.salaryMin && !job.salaryMax) return "Competitive";
    if (job.jobType === "internship") {
      return `₹${Number(job.salaryMin || 0).toLocaleString()} - ₹${Number(
        job.salaryMax || 0
      ).toLocaleString()} / mo`;
    }
    const minLPA = (job.salaryMin / 100000).toFixed(1);
    const maxLPA = (job.salaryMax / 100000).toFixed(1);
    return `₹${minLPA} - ₹${maxLPA} LPA`;
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-400/20">
                Bookmarks
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
              Saved Jobs & Internships
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Positions you've saved to review or apply for later.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/jobs">
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Explore All Opportunities
              </Button>
            </Link>
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
              onClick={fetchSavedList}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Saved Items */}
        <div className="mt-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
              <p className="text-sm">Loading saved opportunities...</p>
            </div>
          ) : savedJobs.length === 0 ? (
            <EmptyState
              title="No saved opportunities"
              description="Click the bookmark icon on any job card to save it for quick review and application."
              actionLabel="Browse Jobs"
              onAction={() => window.location.assign("/jobs")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedJobs.map(({ job, savedAt }) => {
                const isInternship = job.jobType === "internship";

                return (
                  <div
                    key={job.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-cyan-400/40 hover:bg-white/[0.04]"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {job.companyLogoUrl ? (
                              <img
                                src={job.companyLogoUrl}
                                alt={job.companyName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                                {job.companyName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                              {job.companyName}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              <MapPin size={12} className="text-cyan-400 shrink-0" />
                              <span className="truncate">{job.location}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnsave(job.id)}
                          title="Remove from saved"
                          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Title */}
                      <Link to={`/jobs/${job.id}`}>
                        <h3 className="text-base font-bold text-white hover:text-cyan-300 transition line-clamp-2">
                          {job.title}
                        </h3>
                      </Link>

                      {/* Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            isInternship
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                          }`}
                        >
                          {isInternship ? "Internship" : "Full-Time"}
                        </span>
                        <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-white/10">
                          {job.workMode}
                        </span>
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          {formatSalary(job)}
                        </span>
                      </div>

                      {/* Skills */}
                      {job.skills?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {job.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-white/5"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500">
                        Saved on {new Date(savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <Link to={`/jobs/${job.id}`}>
                        <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
