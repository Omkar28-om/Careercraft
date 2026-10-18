import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Code2,
  Layers,
  Award,
  TrendingUp,
  RefreshCw,
  Loader2,
  ChevronRight,
  BriefcaseBusiness,
  ShieldCheck,
  Check,
  Flame,
  Plus,
  History,
  SlidersHorizontal,
  Clock,
  Laptop,
  Building2,
  Globe,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import {
  getCareerRecommendations,
  regenerateCareerRecommendations,
  getCareerHistory,
  updateCareerPreferences,
  getCareerPaths,
  getCourses,
  getCodingProblems,
} from "../services/api";

const WORK_MODE_OPTIONS = [
  { value: "remote", label: "Remote", icon: Laptop },
  { value: "hybrid", label: "Hybrid", icon: Building2 },
  { value: "onsite", label: "On-site", icon: Building2 },
  { value: "flexible", label: "Flexible", icon: Globe },
];

const EXPERIENCE_GOAL_OPTIONS = [
  { value: "internship", label: "Internship" },
  { value: "entry_level", label: "Entry Level Role" },
  { value: "mid_level", label: "Mid Level Role" },
  { value: "freelance", label: "Freelancing" },
  { value: "transition", label: "Career Transition" },
];

const POPULAR_DOMAINS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Cloud & DevOps",
  "AI & ML",
  "Data Science",
  "Cybersecurity",
  "Mobile Apps",
  "System Architecture",
];

export default function Career() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recommendations data from backend
  const [recommendationData, setRecommendationData] = useState(null);
  const [allCareerPaths, setAllCareerPaths] = useState([]);
  const [selectedPathSlug, setSelectedPathSlug] = useState(null);

  // Fallback / real catalog data
  const [dbCourses, setDbCourses] = useState([]);
  const [dbProblems, setDbProblems] = useState([]);

  // Regeneration states
  const [regenerating, setRegenerating] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [regenSuccessMsg, setRegenSuccessMsg] = useState("");

  // History tab / drawer state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Preferences modal state
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [prefFormData, setPrefFormData] = useState({
    target_roles: [],
    preferred_domains: [],
    preferred_work_mode: "flexible",
    experience_goal: "entry_level",
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefStatus, setPrefStatus] = useState({ state: "idle", message: "" }); // idle, saving, saved, error

  // Main data fetch
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [recRes, pathsRes, coursesRes, problemsRes] = await Promise.all([
        getCareerRecommendations().catch((err) => {
          console.error("Recommendations error:", err);
          return null;
        }),
        getCareerPaths().catch(() => ({ paths: [] })),
        getCourses().catch(() => ({ courses: [] })),
        getCodingProblems().catch(() => ({ problems: [] })),
      ]);

      if (recRes?.success && recRes.recommendation) {
        setRecommendationData(recRes.recommendation);
        const topSlug = recRes.recommendation.topRecommendations?.[0]?.slug;
        if (topSlug && !selectedPathSlug) {
          setSelectedPathSlug(topSlug);
        }

        // Initialize preferences state
        if (recRes.recommendation.preferences) {
          setPrefFormData({
            target_roles: recRes.recommendation.preferences.target_roles || [],
            preferred_domains: recRes.recommendation.preferences.preferred_domains || [],
            preferred_work_mode: recRes.recommendation.preferences.preferred_work_mode || "flexible",
            experience_goal: recRes.recommendation.preferences.experience_goal || "entry_level",
          });
        }
      }

      if (pathsRes?.success && Array.isArray(pathsRes.paths)) {
        setAllCareerPaths(pathsRes.paths);
      }

      if (coursesRes?.success && Array.isArray(coursesRes.courses)) {
        setDbCourses(coursesRes.courses);
      }

      if (problemsRes?.success && Array.isArray(problemsRes.problems)) {
        setDbProblems(problemsRes.problems);
      }
    } catch (err) {
      console.error("Career page data load error:", err);
      setError("Unable to compute career recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedPathSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle countdown timer for regeneration cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Computed pathway list
  const pathways = useMemo(() => {
    if (!recommendationData?.topRecommendations?.length) {
      return allCareerPaths.map((p) => ({
        ...p,
        score: 0,
        skill_gaps: [],
        matched_skills: [],
        missing_skills: p.required_skills || [],
        evidence: [],
      }));
    }
    return recommendationData.topRecommendations;
  }, [recommendationData, allCareerPaths]);

  // Currently active selected pathway
  const activePathway = useMemo(() => {
    if (!pathways.length) return null;
    if (selectedPathSlug) {
      const found = pathways.find((p) => p.slug === selectedPathSlug);
      if (found) return found;
    }
    return pathways[0];
  }, [pathways, selectedPathSlug]);

  // Overall readiness data
  const careerReadiness = useMemo(() => {
    const raw = recommendationData?.careerReadiness || {
      percentage: 0,
      label: "Getting Started",
      breakdown: {},
    };
    return {
      percentage: Number(raw.percentage) || 0,
      label: raw.label || "Getting Started",
      breakdown: raw.breakdown || {},
    };
  }, [recommendationData]);

  // Skill gaps for active pathway
  const activeSkillGaps = useMemo(() => {
    if (!activePathway) return [];
    if (Array.isArray(activePathway.skill_gaps) && activePathway.skill_gaps.length > 0) {
      return activePathway.skill_gaps;
    }
    // Fallback if raw path structure
    const req = activePathway.required_skills || [];
    return req.map((s) => ({
      skill: s,
      status: "missing",
      importance: "high",
      proficiency: 0,
      reason: "Required skill for this career pathway.",
    }));
  }, [activePathway]);

  // Evidence for active pathway
  const activeEvidence = useMemo(() => {
    if (!activePathway) return [];
    if (Array.isArray(activePathway.evidence) && activePathway.evidence.length > 0) {
      return activePathway.evidence;
    }
    if (recommendationData?.evidence?.[activePathway.slug]) {
      return recommendationData.evidence[activePathway.slug];
    }
    return [];
  }, [activePathway, recommendationData]);

  // Next Best Actions from backend snapshot
  const nextActions = useMemo(() => {
    if (Array.isArray(recommendationData?.nextSteps) && recommendationData.nextSteps.length > 0) {
      return recommendationData.nextSteps;
    }
    return [];
  }, [recommendationData]);

  // Recommended courses for active path
  const recommendedCourses = useMemo(() => {
    if (Array.isArray(activePathway?.recommended_courses) && activePathway.recommended_courses.length > 0) {
      return activePathway.recommended_courses;
    }
    if (!dbCourses.length) return [];
    // Match based on category
    const cat = activePathway?.category?.toLowerCase() || "";
    const filtered = dbCourses.filter((c) => (c.category || "").toLowerCase().includes(cat));
    return (filtered.length > 0 ? filtered : dbCourses).slice(0, 3);
  }, [activePathway, dbCourses]);

  // Recommended coding challenges for active path
  const recommendedProblems = useMemo(() => {
    if (Array.isArray(activePathway?.recommended_problems) && activePathway.recommended_problems.length > 0) {
      return activePathway.recommended_problems;
    }
    if (!dbProblems.length) return [];
    return dbProblems.slice(0, 4);
  }, [activePathway, dbProblems]);

  // Recommended jobs and internships for active path
  const recommendedJobs = useMemo(() => {
    if (Array.isArray(activePathway?.recommended_jobs) && activePathway.recommended_jobs.length > 0) {
      return activePathway.recommended_jobs;
    }
    return [];
  }, [activePathway]);

  // Portfolio projects archetypes
  const portfolioProjects = useMemo(() => {
    if (Array.isArray(activePathway?.related_projects) && activePathway.related_projects.length > 0) {
      return activePathway.related_projects;
    }
    return [
      {
        title: "Full-Stack Web Application",
        stack: ["React", "Node.js", "PostgreSQL"],
        description: "Deploy an end-to-end production web service with database migrations and authentication.",
      },
      {
        title: "High-Performance Backend API",
        stack: ["Node.js", "Express", "PostgreSQL", "Redis"],
        description: "Architect rate-limited endpoints with caching and connection pooling.",
      },
    ];
  }, [activePathway]);

  // Handle Regenerate Recommendations
  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setRegenSuccessMsg("");
      setError(null);

      const res = await regenerateCareerRecommendations();

      if (res?.success && res.recommendation) {
        setRecommendationData(res.recommendation);
        setRegenSuccessMsg("Roadmap refreshed with latest verified competencies!");
        setCooldownSeconds(300); // 5 minutes cooldown
        setTimeout(() => setRegenSuccessMsg(""), 6000);
      }
    } catch (err) {
      console.error("Regeneration failed:", err);
      if (err.status === 429 && err.data?.retryAfterSeconds) {
        setCooldownSeconds(err.data.retryAfterSeconds);
        setError(`Regeneration cooldown active. Please wait ${err.data.retryAfterSeconds} seconds.`);
      } else {
        setError(err.message || "Failed to regenerate recommendations. Please try again.");
      }
    } finally {
      setRegenerating(false);
    }
  };

  // Load history snapshots
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      setShowHistoryModal(true);
      const res = await getCareerHistory();
      if (res?.success && Array.isArray(res.history)) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = async (e) => {
    e?.preventDefault();
    try {
      setSavingPrefs(true);
      setPrefStatus({ state: "saving", message: "Saving preferences..." });

      const res = await updateCareerPreferences(prefFormData);

      if (res?.success) {
        setPrefStatus({ state: "saved", message: "Preferences saved successfully!" });
        setTimeout(() => {
          setPrefStatus({ state: "idle", message: "" });
          setShowPrefModal(false);
          fetchData(); // Refresh recommendations with new preference alignment
        }, 1200);
      }
    } catch (err) {
      console.error("Preferences save error:", err);
      setPrefStatus({
        state: "error",
        message: err.message || "Failed to save preferences.",
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleTargetRole = (slug) => {
    setPrefFormData((prev) => {
      const exists = prev.target_roles.includes(slug);
      return {
        ...prev,
        target_roles: exists
          ? prev.target_roles.filter((r) => r !== slug)
          : [...prev.target_roles, slug],
      };
    });
  };

  const toggleDomain = (domain) => {
    setPrefFormData((prev) => {
      const exists = prev.preferred_domains.includes(domain);
      return {
        ...prev,
        preferred_domains: exists
          ? prev.preferred_domains.filter((d) => d !== domain)
          : [...prev.preferred_domains, domain],
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Alerts & Notifications */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-rose-400 shrink-0" size={20} />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {regenSuccessMsg && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
            <p className="text-sm text-emerald-200">{regenSuccessMsg}</p>
          </div>
        )}

        {/* HERO SECTION: CAREER READINESS & ACTIONS */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B14] p-6 sm:p-10 backdrop-blur-xl">
          <div className="absolute right-0 top-0 -z-10 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 -z-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-500/10 px-3 py-0.5 text-xs font-semibold text-violet-300 border border-violet-500/20 flex items-center gap-1.5">
                  <Compass size={13} />
                  <span>Strategic Career Center</span>
                </span>
                <span className="text-xs text-slate-400">PostgreSQL Verified Engine</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                AI Career Recommendation System
              </h1>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Transform your code commits, completed courses, and portfolio projects into clear market readiness.
                Identify skill gaps, track transparent benchmark weights, and accelerate your path to engineering roles.
              </p>

              {/* Action buttons bar */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating || cooldownSeconds > 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                    cooldownSeconds > 0
                      ? "bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20"
                  }`}
                >
                  {regenerating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  <span>
                    {regenerating
                      ? "Analyzing..."
                      : cooldownSeconds > 0
                      ? `Cooldown (${cooldownSeconds}s)`
                      : "Regenerate Analysis"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrefModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition"
                >
                  <SlidersHorizontal size={14} className="text-cyan-400" />
                  <span>Career Preferences</span>
                </button>

                <button
                  type="button"
                  onClick={loadHistory}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition"
                >
                  <History size={14} className="text-purple-400" />
                  <span>Analysis History</span>
                </button>
              </div>
            </div>

            {/* Overall Career Readiness Score Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:w-88 shrink-0 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Career Readiness
                  </span>
                  <span className="text-xs font-semibold text-cyan-300 mt-0.5 inline-block">
                    {careerReadiness.label}
                  </span>
                </div>
                <span className="text-3xl font-black text-cyan-400">
                  {careerReadiness.percentage}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-700"
                  style={{ width: `${careerReadiness.percentage}%` }}
                />
              </div>

              {/* Breakdown Metric Bars */}
              <div className="mt-4 space-y-2 text-[11px] text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Profile Completeness:</span>
                  <span className="font-semibold text-white">
                    {careerReadiness.breakdown.profile ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Verified Skills:</span>
                  <span className="font-semibold text-white">
                    {careerReadiness.breakdown.skills ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Coding Practice:</span>
                  <span className="font-semibold text-white">
                    {careerReadiness.breakdown.coding ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Curricula Completed:</span>
                  <span className="font-semibold text-white">
                    {careerReadiness.breakdown.courses ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Portfolio Projects:</span>
                  <span className="font-semibold text-white">
                    {careerReadiness.breakdown.projects ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Experience Activity:</span>
                  <span className="font-semibold text-white">
                    {careerReadiness.breakdown.experience ?? 0}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500">
                  Platform Readiness Index
                </span>
                <Link
                  to="/profile"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs inline-flex items-center gap-1"
                >
                  <span>Update Profile</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING & EMPTY STATES */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={36} className="animate-spin text-cyan-400 mb-3" />
            <p className="text-sm font-medium">
              Evaluating competencies across engineering benchmarks...
            </p>
          </div>
        ) : pathways.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No career paths catalog available"
              description="We could not find active career paths in the system. Please try again shortly."
            />
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {/* SECTION 1: TARGET CAREER PATHWAYS */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Target size={22} className="text-cyan-400" />
                    <span>Target Career Pathways</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Select any specialization below to examine skill gaps, real evidence, and targeted action items.
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  Showing <strong className="text-white">{pathways.length}</strong> industry paths
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pathways.map((path) => {
                  const isSelected = activePathway?.slug === path.slug;
                  const matchedCount = (path.matched_skills || []).length;
                  const requiredCount = (path.required_skills || []).length;
                  const missingCount = (path.missing_skills || []).length;

                  return (
                    <button
                      key={path.slug || path.id}
                      type="button"
                      onClick={() => setSelectedPathSlug(path.slug)}
                      className={`rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-white/[0.06] border-cyan-500/40 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="rounded-md bg-white/[0.05] border border-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                            {path.category || "Engineering"}
                          </span>
                          <span className="text-base font-black text-cyan-400">
                            {path.score || 0}% Match
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-sm sm:text-base leading-snug">
                          {path.name}
                        </h3>

                        <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {path.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Skills ready:</span>
                          <span className="font-semibold text-emerald-400">
                            {matchedCount} of {requiredCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Missing skills:</span>
                          <span className="font-semibold text-amber-400">
                            {missingCount}
                          </span>
                        </div>
                        <div className="pt-2 flex items-center justify-between border-t border-white/5">
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                              <Check size={13} />
                              <span>Active Focus</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 hover:text-white">
                              Select Pathway &rarr;
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: ACTIVE PATHWAY FOCUS & EVIDENCE */}
            {activePathway && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-8">
                {/* Active Pathway Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-400/20">
                        Active Pathway Focus
                      </span>
                      <span className="text-xs text-slate-400">
                        Category: {activePathway.category}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                      {activePathway.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      {activePathway.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-400">Role Match Score</div>
                      <div className="text-3xl font-black text-cyan-400">
                        {activePathway.score || 0}%
                      </div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <Link to="/profile">
                      <Button variant="secondary" size="sm">
                        Manage Skills
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* AI / COMPETENCY EXPLANATION SYNTHESIS */}
                {activePathway.explanation && (
                  <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 to-blue-950/20 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-cyan-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                          Pathway Fit Assessment
                        </span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border-cyan-500/30">
                        {activePathway.explanationSource === "ai"
                          ? "AI Analysis (Gemini)"
                          : "Verified Competency Synthesis"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {activePathway.explanation}
                    </p>
                  </div>
                )}

                {/* PHASE 24: WHY THIS CAREER MATCHES YOU */}
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-cyan-400" />
                    <span>Why This Pathway Matches You</span>
                  </h4>
                  {activeEvidence.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Add verified skills, solve coding challenges, or link portfolio projects to build evidence for this pathway.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeEvidence.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/5 bg-white/[0.015] p-3.5 flex items-start gap-3"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                            <Check size={12} />
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed">
                            {item.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PHASE 23: SKILL GAP VISUALIZATION */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp size={16} className="text-cyan-400" />
                        <span>Skill Gap Analysis</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Verified competency for required {activePathway.name} skills.
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {(activePathway.matched_skills || []).length} of{" "}
                      {(activePathway.required_skills || []).length} Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSkillGaps.map((item) => (
                      <div
                        key={item.skill}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.035]"
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              {item.skill}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                item.status === "strong"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : item.status === "partial"
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  : "bg-white/5 text-slate-400 border border-white/5"
                              }`}
                            >
                              {item.status === "strong"
                                ? "Strong (80-100%)"
                                : item.status === "partial"
                                ? "Developing (40-60%)"
                                : "Missing (Gap)"}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-300">
                            {item.proficiency || 0}%
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.status === "strong"
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : item.status === "partial"
                                ? "bg-gradient-to-r from-cyan-500 to-blue-400"
                                : "bg-transparent"
                            }`}
                            style={{ width: `${item.proficiency || 0}%` }}
                          />
                        </div>

                        <p className="mt-2 text-[11px] text-slate-400">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PHASE 25: NEXT BEST ACTIONS */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Flame size={16} className="text-amber-400" />
                        <span>Next Best Actions</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Targeted recommendations derived from your detected skill and progress gaps.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nextActions.map((actionItem) => (
                      <div
                        key={actionItem.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 flex flex-col justify-between hover:border-cyan-400/30 hover:bg-white/[0.04] transition"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                              {actionItem.type || "Action"}
                            </span>
                          </div>

                          <h5 className="font-bold text-white text-sm leading-snug">
                            {actionItem.action}
                          </h5>

                          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                            {actionItem.reason}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5">
                          <Link to={actionItem.ctaLink || "/profile"}>
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              {actionItem.ctaText || "Take Action"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: TAILORED LEARNING PLAN */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <BookOpen size={22} className="text-blue-400" />
                    <span>Recommended Learning Plan</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Structured coursework to close skill gaps for {activePathway?.name}.
                  </p>
                </div>
                <Link
                  to="/courses"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {recommendedCourses.length === 0 ? (
                <EmptyState
                  title="No courses found"
                  description="Curriculum tracks for this pathway will be published soon."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendedCourses.map((course) => (
                    <div
                      key={course.id || course.slug}
                      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-5 hover:border-cyan-400/40 hover:bg-white/[0.04] transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-blue-300 font-semibold">
                            {course.category || "Engineering"}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {Math.round((course.durationMinutes || course.duration_minutes || 60) / 60)} hrs
                          </span>
                        </div>

                        <Link to={`/courses/${course.slug}`}>
                          <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition line-clamp-2">
                            {course.title}
                          </h4>
                        </Link>

                        <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {course.short_description || course.shortDescription || course.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 capitalize">
                          Level: <strong className="text-white">{course.level || "Beginner"}</strong>
                        </span>
                        <Link
                          to={`/courses/${course.slug}`}
                          className="text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition inline-flex items-center gap-1"
                        >
                          <span>Start Course</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 4: PORTFOLIO PROJECTS TO BUILD */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Layers size={22} className="text-purple-400" />
                    <span>Portfolio Projects to Build</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Recruiters hire proof of work. Ship these project archetypes to showcase on your portfolio.
                  </p>
                </div>
                <Link
                  to="/profile"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>My Portfolio</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {portfolioProjects.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(item.stack || []).map((s) => (
                          <span
                            key={s}
                            className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <Link
                        to="/profile"
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                      >
                        <span>Add Project to Profile &rarr;</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: TARGETED CODING PRACTICE */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Code2 size={22} className="text-emerald-400" />
                    <span>Targeted Coding Practice</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Solve real interview challenges aligned with {activePathway?.name} technical assessment filters.
                  </p>
                </div>
                <Link
                  to="/coding"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>All Problems</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {recommendedProblems.length === 0 ? (
                <EmptyState
                  title="No problems found"
                  description="Coding challenges for this difficulty level will be available soon."
                />
              ) : (
                <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
                  {recommendedProblems.map((prob) => (
                    <div
                      key={prob.id || prob.slug}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.03] transition"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/coding/problems/${prob.slug}`}
                          className="font-bold text-sm sm:text-base text-white hover:text-cyan-300 transition"
                        >
                          {prob.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Category: {prob.category || "Algorithms"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant={
                            prob.difficulty === "Easy"
                              ? "emerald"
                              : prob.difficulty === "Medium"
                              ? "warning"
                              : "rose"
                          }
                          size="xs"
                        >
                          {prob.difficulty}
                        </Badge>
                        <Link to={`/coding/problems/${prob.slug}`}>
                          <Button variant="outline" size="sm">
                            Solve
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 6: MATCHING INTERNSHIPS & JOB OPPORTUNITIES */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <BriefcaseBusiness size={22} className="text-amber-400" />
                    <span>Matching Internships & Jobs</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Live industry openings and internship roles aligned with {activePathway?.name}.
                  </p>
                </div>
                <Link
                  to="/jobs"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>All Job Openings</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {recommendedJobs.length === 0 ? (
                <EmptyState
                  title="No direct job matches"
                  description="We are regularly syncing new vacancies for this career pathway."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recommendedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-5 hover:border-amber-400/40 hover:bg-white/[0.04] transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-amber-300 font-semibold capitalize">
                            {job.job_type || "Full-time"}
                          </span>
                          <span className="text-slate-400 font-medium capitalize">
                            {job.work_mode || "Remote"}
                          </span>
                        </div>

                        <Link to={`/jobs/${job.id}`}>
                          <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                            {job.title}
                          </h4>
                        </Link>

                        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-500 shrink-0" />
                          <span>{job.company}</span>
                          {job.location && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="truncate">{job.location}</span>
                            </>
                          )}
                        </p>

                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.skills.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                              >
                                {s}
                              </span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="text-[10px] text-slate-500 self-center">
                                +{job.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {job.salary_min && job.salary_max
                            ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                            : "Competitive"}
                        </span>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition inline-flex items-center gap-1"
                        >
                          <span>View Role</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* PHASE 26: CAREER PREFERENCES MODAL */}
      {showPrefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#070e1c] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Career Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrefModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="mt-6 space-y-6">
              {/* Target Roles */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Target Career Roles (Select one or more)
                </label>
                <div className="flex flex-wrap gap-2">
                  {allCareerPaths.map((p) => {
                    const isSelected = prefFormData.target_roles.includes(p.slug);
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => toggleTargetRole(p.slug)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                            : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Domains */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Preferred Domains
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_DOMAINS.map((domain) => {
                    const isSelected = prefFormData.preferred_domains.includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleDomain(domain)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? "bg-purple-500/20 border-purple-400 text-purple-300"
                            : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Work Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Preferred Work Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WORK_MODE_OPTIONS.map((opt) => {
                    const isSelected = prefFormData.preferred_work_mode === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setPrefFormData((prev) => ({
                            ...prev,
                            preferred_work_mode: opt.value,
                          }))
                        }
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                            : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <Icon size={16} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Goal */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Experience Goal
                </label>
                <select
                  value={prefFormData.experience_goal}
                  onChange={(e) =>
                    setPrefFormData((prev) => ({
                      ...prev,
                      experience_goal: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  {EXPERIENCE_GOAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Message */}
              {prefStatus.message && (
                <div
                  className={`text-xs p-3 rounded-xl ${
                    prefStatus.state === "saved"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : prefStatus.state === "error"
                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      : "bg-cyan-500/10 text-cyan-300"
                  }`}
                >
                  {prefStatus.message}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowPrefModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={savingPrefs}
                >
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHASE 27: CAREER HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#070e1c] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <History size={20} className="text-purple-400" />
                <h3 className="text-xl font-bold text-white">Analysis History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-6">
              {historyLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 size={28} className="animate-spin text-purple-400" />
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 text-slate-500" />
                  <p className="text-sm font-medium">No previous snapshots recorded yet.</p>
                  <p className="text-xs mt-1 text-slate-500">
                    Regenerating career analysis stores immutable snapshots over time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {item.topPathway?.name || "Career Assessment"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 font-semibold border border-cyan-400/20">
                            v{item.engineVersion}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Generated on {new Date(item.generatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Readiness</div>
                        <div className="text-lg font-black text-cyan-400">
                          {item.careerReadiness}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
