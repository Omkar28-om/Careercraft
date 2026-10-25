import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  BookOpen,
  BriefcaseBusiness,
  Sparkles,
  ArrowRight,
  Compass,
  Trophy,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Send,
  Coffee,
  Terminal,
  Palette,
  ShieldAlert,
  Megaphone,
  BarChart3,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/ProtectedRoute";
import {
  getDashboard,
  getCourses,
  getCodingProblems,
} from "../services/api";
import { isRelatedToDomain, getSelectedDomain } from "../utils/learningPath";

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

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const selectedDomain = user?.career_domain || getSelectedDomain() || "";
  const DomainIcon = DOMAIN_ICONS[selectedDomain] || Compass;

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [dashRes, coursesRes, problemsRes] = await Promise.allSettled([
        getDashboard(),
        getCourses(),
        getCodingProblems(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.dashboard) {
        setDashboardData(dashRes.value.dashboard);
      } else if (dashRes.status === "fulfilled" && dashRes.value?.success) {
        setDashboardData(dashRes.value);
      } else {
        throw new Error("Unable to load dashboard data");
      }

      if (coursesRes.status === "fulfilled") {
        const list = coursesRes.value?.courses || coursesRes.value?.data || [];
        setRecommendedCourses(Array.isArray(list) ? list : []);
      }

      if (problemsRes.status === "fulfilled") {
        const list = problemsRes.value?.problems || problemsRes.value?.data || [];
        setRecommendedProblems(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError(err?.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real filtered recommendations for domain
  const domainFilteredCourses = useMemo(() => {
    return recommendedCourses
      .filter((c) => isRelatedToDomain(c, selectedDomain))
      .slice(0, 3);
  }, [recommendedCourses, selectedDomain]);

  const domainFilteredProblems = useMemo(() => {
    return recommendedProblems
      .filter((p) => isRelatedToDomain(p, selectedDomain))
      .slice(0, 3);
  }, [recommendedProblems, selectedDomain]);

  if (loading) return <LoadingScreen />;

  const progress = dashboardData?.progress || {};
  const enrolledCourses = dashboardData?.enrolledCourses || dashboardData?.enrolled_courses || [];
  const inProgressCourses = enrolledCourses.filter((e) => e.status !== "completed");
  const recentActivities = dashboardData?.recentActivities || dashboardData?.recent_activities || [];
  const appsSummary = dashboardData?.applicationsSummary || dashboardData?.applications?.summary || {};

  const problemsSolved = progress.problemsSolved ?? progress.problems_solved ?? 0;
  const totalXp = progress.totalXp ?? progress.total_xp ?? 0;
  const userLevel = progress.level || 1;
  const totalApplications = appsSummary.totalApplications ?? appsSummary.total_applications ?? 0;

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] tech-grid-pattern flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDashboardData(true)}
              className="rounded-lg bg-rose-500/20 px-3 py-1 hover:bg-rose-500/30 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Top Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {getGreeting()}
              </span>
              {selectedDomain ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
                  <DomainIcon size={12} /> {selectedDomain}
                </span>
              ) : null}
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Student Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Clear, real-time overview of your learning, practice, and job applications.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/domains"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400/30 hover:text-white transition"
            >
              <Compass size={14} className="text-cyan-400" />
              <span>{selectedDomain ? "Change Track" : "Set Track"}</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition disabled:opacity-50"
              title="Refresh dashboard metrics"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </section>

        {/* 1. Essential Metrics Grid (Real Data Only) */}
        <section aria-labelledby="core-metrics-heading">
          <h2 id="core-metrics-heading" className="sr-only">Key Statistics</h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Courses In Progress */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#101827] p-5 transition hover:border-cyan-400/30">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Courses In Progress</span>
                <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
                  <BookOpen size={16} />
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-white">
                {inProgressCourses.length}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {inProgressCourses.length === 1 ? "1 active course" : `${inProgressCourses.length} active courses`}
              </p>
            </div>

            {/* Practice Solved */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#101827] p-5 transition hover:border-emerald-400/30">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Coding Solved</span>
                <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300">
                  <Code2 size={16} />
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-emerald-400">
                {problemsSolved}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Problems completed
              </p>
            </div>

            {/* Job Applications */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#101827] p-5 transition hover:border-amber-400/30">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Applications</span>
                <span className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300">
                  <BriefcaseBusiness size={16} />
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-amber-400">
                {totalApplications}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Submissions tracked
              </p>
            </div>

            {/* Learning Progress & XP */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#101827] p-5 transition hover:border-violet-400/30">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Learning Level</span>
                <span className="rounded-xl border border-violet-400/20 bg-violet-400/10 p-2 text-violet-300">
                  <Trophy size={16} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-black text-violet-400">
                  Lvl {userLevel}
                </p>
                <span className="text-xs text-slate-400">({totalXp} XP)</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Earned via practice
              </p>
            </div>
          </div>
        </section>

        {/* 2. Continue Learning Section */}
        <section aria-labelledby="continue-learning-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="continue-learning-section" className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={18} className="text-cyan-400" />
              Continue Learning
            </h2>
            <Link to="/courses" className="text-xs font-semibold text-cyan-300 hover:underline">
              All Courses
            </Link>
          </div>

          {inProgressCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inProgressCourses.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#101827] p-5 flex flex-col justify-between transition hover:border-cyan-400/40"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      In Progress
                    </span>
                    <h3 className="mt-1 text-sm font-bold text-white line-clamp-1">
                      {item.title}
                    </h3>
                    {item.duration_minutes ? (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11} /> {item.duration_minutes} mins
                      </p>
                    ) : null}

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span>Progress</span>
                        <span className="text-cyan-300">{item.progress_percent || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                          style={{ width: `${Math.max(5, item.progress_percent || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/[0.06]">
                    <Link
                      to={`/courses/${item.slug}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] py-2 text-xs font-semibold text-white hover:bg-cyan-500 hover:text-slate-950 transition"
                    >
                      <span>Resume Course</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.015] p-6 text-center">
              <BookOpen size={24} className="mx-auto text-slate-500" />
              <h3 className="mt-2 text-sm font-bold text-white">No courses currently in progress</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Explore our curated courses to begin learning structured lessons.
              </p>
              <Link
                to="/courses"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:underline"
              >
                Browse course catalog <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </section>

        {/* 3. Small Recommended-Content Section (Domain-Based) */}
        <section aria-labelledby="domain-recommendations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="domain-recommendations" className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-violet-400" />
                Recommended for You
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedDomain
                  ? `Focusing on ${selectedDomain}`
                  : "Based on trending engineering skills"}
              </p>
            </div>
            <Link to="/domains" className="text-xs font-semibold text-violet-300 hover:underline">
              Change Track
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Recommended Course Card */}
            {domainFilteredCourses.length > 0 ? (
              domainFilteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#101827] p-5 flex flex-col justify-between transition hover:border-violet-400/40"
                >
                  <div>
                    <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                      {course.category || selectedDomain || "Course"}
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-white line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                  <Link
                    to={`/courses/${course.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-300 hover:underline"
                  >
                    View course <ChevronRight size={13} />
                  </Link>
                </div>
              ))
            ) : null}

            {/* Recommended Coding Problem Card */}
            {domainFilteredProblems.length > 0 ? (
              domainFilteredProblems.slice(0, 3 - domainFilteredCourses.length).map((prob) => (
                <div
                  key={prob.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#101827] p-5 flex flex-col justify-between transition hover:border-emerald-400/40"
                >
                  <div>
                    <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      {prob.difficulty} Coding
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-white line-clamp-1">
                      {prob.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                      {prob.description}
                    </p>
                  </div>
                  <Link
                    to={`/coding/problems/${prob.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:underline"
                  >
                    Solve challenge <ChevronRight size={13} />
                  </Link>
                </div>
              ))
            ) : null}

            {domainFilteredCourses.length === 0 && domainFilteredProblems.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-white/15 bg-white/[0.015] p-6 text-center text-xs text-slate-400">
                No domain recommendations available right now. Choose a career domain to activate personalized content.
              </div>
            )}
          </div>
        </section>

        {/* 4. Recent Activity (Real Data Only) */}
        <section aria-labelledby="recent-activity-section" className="space-y-4">
          <h2 id="recent-activity-section" className="text-lg font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-emerald-400" />
            Recent Activity
          </h2>

          {recentActivities.length > 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#101827] divide-y divide-white/[0.06] overflow-hidden">
              {recentActivities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-center justify-between p-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                      <CheckCircle2 size={15} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{act.title}</p>
                      <p className="text-slate-400 text-[11px]">{act.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {act.xp_earned > 0 && (
                      <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300 block mb-1">
                        +{act.xp_earned} XP
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {formatRelativeTime(act.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.015] p-6 text-center text-xs text-slate-400">
              No recent activity recorded yet. Start solving problems or complete course lessons to see your progress recorded here.
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
