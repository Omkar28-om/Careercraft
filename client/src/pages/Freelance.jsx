import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  DollarSign,
  Clock,
  Send,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Plus,
  Search,
  Filter,
  Layers,
  Award,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  getFreelanceProjects,
  createFreelanceProject,
  saveFreelanceProject,
  unsaveFreelanceProject,
} from "../api";
import { getSelectedDomain, isRelatedToDomain } from "../utils/learningPath";

const CATEGORIES = [
  "All",
  "Frontend",
  "Full Stack",
  "Mobile App",
  "AI & Automation",
  "Backend API",
  "Cloud & DevOps",
  "Data & Analytics",
  "Marketing & Content",
  "Business, Management & Finance",
  "Healthcare & Life Sciences",
  "Design & Accessibility",
];

const BUDGET_TYPES = [
  { label: "All Rates", value: "all" },
  { label: "Fixed Price", value: "fixed" },
  { label: "Hourly Rate", value: "hourly" },
];

const EXPERIENCE_LEVELS = [
  { label: "All Levels", value: "all" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
];

export default function Freelance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const selectedDomain = getSelectedDomain();

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBudgetType, setSelectedBudgetType] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");

  // Projects & Pagination States
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Post Project Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [postError, setPostError] = useState("");
  const [postFormData, setPostFormData] = useState({
    title: "",
    description: "",
    category: "Full Stack",
    skills: "",
    budgetType: "fixed",
    budgetMin: "",
    budgetMax: "",
    durationDays: "14",
    experienceLevel: "intermediate",
  });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFreelanceProjects({
        search: search.trim() || undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        budgetType: selectedBudgetType !== "all" ? selectedBudgetType : undefined,
        experienceLevel: selectedExperience !== "all" ? selectedExperience : undefined,
        status: "open",
        page,
        limit: selectedDomain ? 50 : 9,
      });

      if (res?.success) {
        const fetchedProjects = res.projects || [];
        const relevantProjects = selectedDomain
          ? fetchedProjects.filter((project) => isRelatedToDomain(project, selectedDomain))
          : fetchedProjects;
        setProjects(relevantProjects);
        setTotalPages(selectedDomain ? 1 : (res.pagination?.totalPages || 1));
        setTotalCount(selectedDomain ? relevantProjects.length : (res.pagination?.total || 0));
      }
    } catch (err) {
      console.error("Failed to load freelance projects:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedBudgetType, selectedExperience, page, selectedDomain]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleToggleSave = async (e, projectId, isCurrentlySaved) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login", { state: { from: "/freelance" } });
      return;
    }

    try {
      if (isCurrentlySaved) {
        await unsaveFreelanceProject(projectId);
      } else {
        await saveFreelanceProject(projectId);
      }
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, isSaved: !isCurrentlySaved } : p
        )
      );
    } catch (err) {
      console.error("Failed to toggle save project:", err);
    }
  };

  const handlePostProjectSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: "/freelance" } });
      return;
    }

    setSubmittingProject(true);
    setPostError("");

    try {
      const skillsArray = postFormData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: postFormData.title.trim(),
        description: postFormData.description.trim(),
        category: postFormData.category,
        skills: skillsArray,
        budgetType: postFormData.budgetType,
        budgetMin: postFormData.budgetMin ? Number(postFormData.budgetMin) : null,
        budgetMax: postFormData.budgetMax ? Number(postFormData.budgetMax) : null,
        durationDays: postFormData.durationDays ? Number(postFormData.durationDays) : null,
        experienceLevel: postFormData.experienceLevel,
      };

      const res = await createFreelanceProject(payload);
      if (res?.success && res.project) {
        setIsPostModalOpen(false);
        setPostFormData({
          title: "",
          description: "",
          category: "Full Stack",
          skills: "",
          budgetType: "fixed",
          budgetMin: "",
          budgetMax: "",
          durationDays: "14",
          experienceLevel: "intermediate",
        });
        navigate(`/freelance/projects/${res.project.id}`);
      }
    } catch (err) {
      setPostError(err.message || "Failed to create freelance project");
    } finally {
      setSubmittingProject(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Marketplace Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B14] p-6 sm:p-10 mb-8">
          <div className="absolute top-0 right-1/4 -z-10 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 -z-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                  <Sparkles size={13} className="text-violet-400" />
                  <span>Student & Developer Marketplace</span>
                </span>
                <span className="text-xs text-slate-400">
                  {totalCount} {selectedDomain ? `${selectedDomain} ` : "Active "}Project{totalCount === 1 ? "" : "s"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Find Freelance Gigs or Hire Talent
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
                Connect with clients, build high-impact production contracts, gain real-world experience, and earn +5 XP per proposal and +25 XP upon completion.
              </p>
            </div>

            {/* Quick Actions & Navigation */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="primary"
                icon={Plus}
                iconPosition="left"
                onClick={() => {
                  if (!user) {
                    navigate("/login", { state: { from: "/freelance" } });
                  } else {
                    setIsPostModalOpen(true);
                  }
                }}
              >
                Post a Project
              </Button>

              {user && (
                <>
                  <Link to="/freelance/proposals">
                    <Button variant="secondary" icon={FileText} iconPosition="left">
                      Proposals
                    </Button>
                  </Link>
                  <Link to="/freelance/contracts">
                    <Button variant="secondary" icon={CheckCircle2} iconPosition="left">
                      Contracts
                    </Button>
                  </Link>
                  <Link to="/freelance/earnings">
                    <Button variant="outline" icon={TrendingUp} iconPosition="left">
                      Earnings
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search gigs by title, skills, keywords, or client..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedBudgetType}
                onChange={(e) => {
                  setSelectedBudgetType(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-white/10 bg-[#070d19] px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:border-cyan-400/50 focus:outline-none cursor-pointer"
              >
                {BUDGET_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedExperience}
                onChange={(e) => {
                  setSelectedExperience(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-white/10 bg-[#070d19] px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:border-cyan-400/50 focus:outline-none cursor-pointer"
              >
                {EXPERIENCE_LEVELS.map((exp) => (
                  <option key={exp.value} value={exp.value}>
                    {exp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin text-cyan-400 mb-3" />
            <p className="text-sm">Loading freelance opportunities...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4">
              <Briefcase size={28} />
            </div>
            <h3 className="text-lg font-bold text-white">No projects found</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your search criteria, selecting a different category, or be the first to post a new project!
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                  setSelectedBudgetType("all");
                  setSelectedExperience("all");
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/freelance/projects/${proj.id}`)}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-cyan-400/40 hover:bg-white/[0.04] transition-all cursor-pointer shadow-lg shadow-black/20"
              >
                <div>
                  {/* Top Bar: Category & Save */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-md border border-white/5 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                      {proj.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {proj.hasProposed && (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          Proposed
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(e, proj.id, proj.isSaved)}
                        title={proj.isSaved ? "Saved" : "Save project"}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition"
                      >
                        {proj.isSaved ? (
                          <BookmarkCheck size={16} className="text-cyan-400 fill-cyan-400/20" />
                        ) : (
                          <Bookmark size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition line-clamp-2">
                    {proj.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>

                  {/* Skills Chips */}
                  {Array.isArray(proj.skills) && proj.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {proj.skills.slice(0, 4).map((sk, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-mono text-cyan-300"
                        >
                          {sk}
                        </span>
                      ))}
                      {proj.skills.length > 4 && (
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                          +{proj.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <div>
                    <span className="font-bold text-sm text-emerald-400 block">
                      {proj.budgetType === "fixed" ? (
                        <>
                          {proj.budgetMax
                            ? `₹${proj.budgetMin?.toLocaleString()} - ₹${proj.budgetMax?.toLocaleString()}`
                            : proj.budgetMin
                            ? `₹${proj.budgetMin?.toLocaleString()}`
                            : "Fixed Price"}
                        </>
                      ) : (
                        <>
                          {proj.budgetMax
                            ? `₹${proj.budgetMin} - ₹${proj.budgetMax} / hr`
                            : proj.budgetMin
                            ? `₹${proj.budgetMin} / hr`
                            : "Hourly Rate"}
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {proj.budgetType} • {proj.experienceLevel || "All levels"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-white font-semibold text-xs">
                      {proj.proposalCount} proposal{proj.proposalCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {proj.durationDays ? `${proj.durationDays}d est.` : "Flexible"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span className="text-xs text-slate-400 px-2 font-mono">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>

      {/* Post Project Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#070d19] p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Briefcase size={20} className="text-cyan-400" />
                  <span>Post a Freelance Project</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Describe the project to hire talented student developers and freelancers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {postError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{postError}</span>
              </div>
            )}

            <form onSubmit={handlePostProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build Modern Next.js E-Commerce UI with Tailwind"
                  value={postFormData.title}
                  onChange={(e) =>
                    setPostFormData({ ...postFormData, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe project deliverables, scope, wireframes, and tech stack details..."
                  value={postFormData.description}
                  onChange={(e) =>
                    setPostFormData({ ...postFormData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={postFormData.category}
                    onChange={(e) =>
                      setPostFormData({ ...postFormData, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0c1427] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Experience Level *
                  </label>
                  <select
                    value={postFormData.experienceLevel}
                    onChange={(e) =>
                      setPostFormData({
                        ...postFormData,
                        experienceLevel: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0c1427] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Next.js, Node.js, PostgreSQL"
                  value={postFormData.skills}
                  onChange={(e) =>
                    setPostFormData({ ...postFormData, skills: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rate Type *
                  </label>
                  <select
                    value={postFormData.budgetType}
                    onChange={(e) =>
                      setPostFormData({ ...postFormData, budgetType: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0c1427] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="fixed">Fixed Price (₹)</option>
                    <option value="hourly">Hourly Rate (₹/hr)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Min Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15000"
                    value={postFormData.budgetMin}
                    onChange={(e) =>
                      setPostFormData({ ...postFormData, budgetMin: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 30000"
                    value={postFormData.budgetMax}
                    onChange={(e) =>
                      setPostFormData({ ...postFormData, budgetMax: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estimated Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 14"
                  value={postFormData.durationDays}
                  onChange={(e) =>
                    setPostFormData({
                      ...postFormData,
                      durationDays: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPostModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submittingProject}
                >
                  {submittingProject ? "Publishing..." : "Publish Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
