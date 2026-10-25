import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BriefcaseBusiness,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Search,
  Building2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { getJobs, saveJob, unsaveJob } from "../api";
import { useAuth } from "../context/AuthContext";
import { getSelectedDomain, isRelatedToDomain } from "../utils/learningPath";

export default function Jobs() {
  const { user } = useAuth();
  const selectedDomain = getSelectedDomain();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypeTab, setActiveTypeTab] = useState(
    searchParams.get("jobType") ? searchParams.get("jobType") : "All"
  );
  const [selectedWorkMode, setSelectedWorkMode] = useState("All");
  const [selectedExperience, setSelectedExperience] = useState("All");

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (activeTypeTab !== "All") {
        params.jobType = activeTypeTab === "Internships" ? "internship" : "job";
      }
      if (selectedWorkMode !== "All") {
        params.workMode = selectedWorkMode.toLowerCase();
      }
      if (selectedExperience !== "All") {
        params.experienceLevel = selectedExperience.toLowerCase();
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await getJobs(params);
      if (res?.success && Array.isArray(res.jobs)) {
        setJobs(res.jobs);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError(err?.message || "Failed to load job listings.");
    } finally {
      setLoading(false);
    }
  }, [activeTypeTab, selectedWorkMode, selectedExperience, searchQuery]);

  const visibleJobs = useMemo(
    () => jobs.filter((job) => isRelatedToDomain(job, selectedDomain)),
    [jobs, selectedDomain],
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleToggleSave = async (e, job) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please log in to save jobs to your profile.");
      return;
    }

    try {
      if (job.isSaved) {
        await unsaveJob(job.id);
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isSaved: false } : j))
        );
      } else {
        await saveJob(job.id);
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isSaved: true } : j))
        );
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
      alert(err?.message || "Action failed.");
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
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B14] p-8 sm:p-10 backdrop-blur-xl">
          <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 -z-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-violet-500/10 px-3 py-0.5 text-xs font-semibold text-violet-300 border border-violet-500/20">
                  CareerCraft Placements
                </span>
                <span className="text-xs text-slate-400">CareerCraft Opportunities</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
                Discover Tech Jobs & Internships
              </h1>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Connect your skills, projects, and coding track record directly to software engineering roles and student internships.
              </p>
            </div>

            {/* Quick Links Nav */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/applications">
                <Button variant="outline" size="sm" icon={BriefcaseBusiness} iconPosition="left">
                  My Applications
                </Button>
              </Link>
              <Link to="/jobs/saved">
                <Button variant="secondary" size="sm" icon={BookmarkCheck} iconPosition="left">
                  Saved Jobs
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
              onClick={fetchJobs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Type Filter Tabs */}
        <div className="mt-8 border-b border-white/10 pb-4">
          <FilterBar
            options={["All", "Jobs", "Internships"]}
            active={activeTypeTab}
            onChange={(val) => {
              setActiveTypeTab(val);
              if (val === "All") {
                searchParams.delete("jobType");
              } else {
                searchParams.set("jobType", val === "Internships" ? "internship" : "job");
              }
              setSearchParams(searchParams);
            }}
            size="sm"
          />
        </div>

        {/* Search & Secondary Filter Controls */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search role title, company name, skills..."
            className="w-full md:max-w-md"
          />

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Work Mode:</span>
              <FilterBar
                options={["All", "Remote", "Hybrid", "Onsite"]}
                active={selectedWorkMode}
                onChange={setSelectedWorkMode}
                size="xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Level:</span>
              <FilterBar
                options={["All", "Fresher", "Junior", "Mid"]}
                active={selectedExperience}
                onChange={setSelectedExperience}
                size="xs"
              />
            </div>
          </div>
        </div>

        {/* Opportunity Listings Grid */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{activeTypeTab === "All" ? "All Positions" : activeTypeTab}</span>
              <span className="text-xs font-normal text-slate-400">
                ({visibleJobs.length} open positions{selectedDomain ? ` · ${selectedDomain}` : ""})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
              <p className="text-sm">Loading CareerCraft opportunities from PostgreSQL...</p>
            </div>
          ) : visibleJobs.length === 0 ? (
            <EmptyState
              title={selectedDomain ? `No ${selectedDomain} opportunities match these filters` : "No opportunities match your current filters"}
              description="Try broadening your search or change your learning domain to see more relevant roles."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchQuery("");
                setActiveTypeTab("All");
                setSelectedWorkMode("All");
                setSelectedExperience("All");
                searchParams.delete("jobType");
                setSearchParams(searchParams);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleJobs.map((job) => {
                const workModeCapitalized =
                  job.workMode?.charAt(0).toUpperCase() + job.workMode?.slice(1) || "Remote";
                const isInternship = job.jobType === "internship";

                return (
                  <div
                    key={job.id}
                    className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-xl hover:shadow-cyan-500/5"
                  >
                    <div>
                      {/* Card Header: Company Logo, Badges & Save */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {job.companyLogoUrl ? (
                              <img
                                src={job.companyLogoUrl}
                                alt={job.companyName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm">
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
                          onClick={(e) => handleToggleSave(e, job)}
                          title={job.isSaved ? "Saved" : "Save Job"}
                          className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                            job.isSaved
                              ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400"
                              : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {job.isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                      </div>

                      {/* Job Title */}
                      <Link to={`/jobs/${job.id}`}>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                      </Link>

                      {/* Badges: Work Mode, Job Type, Level */}
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
                          {workModeCapitalized}
                        </span>

                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          {formatSalary(job)}
                        </span>

                        {(job.applicationUrl?.includes("careercraft.local") ||
                          job.applicationUrl?.includes("demo") ||
                          job.isDemo ||
                          job.companyName === "Google" ||
                          job.companyName === "Microsoft" ||
                          job.companyName === "Amazon") ? (
                          <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                            Demo Opportunity
                          </span>
                        ) : (
                          (job.isVerified || job.verified) && (
                            <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                              Verified Employer
                            </span>
                          )
                        )}
                      </div>

                      {/* Description Snippet */}
                      <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {job.description}
                      </p>

                      {/* Skills Chips */}
                      {job.skills?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {job.skills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-white/5"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="text-[10px] text-slate-500 py-0.5">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Deadline, Status & CTA */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                      {job.applicationDeadline ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Calendar size={13} className="text-slate-500" />
                          <span>Apply by {new Date(job.applicationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Actively hiring</span>
                      )}

                      <Link to={`/jobs/${job.id}`}>
                        <Button
                          variant={job.hasApplied ? "outline" : "primary"}
                          size="sm"
                          icon={job.hasApplied ? CheckCircle2 : ArrowRight}
                          iconPosition="right"
                          className={job.hasApplied ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" : ""}
                        >
                          {job.hasApplied ? "Applied" : "View Details"}
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
