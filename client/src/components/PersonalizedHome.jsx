import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Trophy,
  Flame,
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  FileText,
  AlertCircle,
  Loader2,
  Send,
  Building2,
  MapPin,
  Coffee,
  Terminal,
  Palette,
  ShieldAlert,
  Megaphone,
  BarChart3,
} from "lucide-react";
import {
  getCourses,
  getCodingProblems,
  getProjects,
  getJobs,
  getDashboard,
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

export default function PersonalizedHome({ user }) {
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [codingProblems, setCodingProblems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);

  const selectedDomain = user?.career_domain || getSelectedDomain() || "";
  const DomainIcon = DOMAIN_ICONS[selectedDomain] || Compass;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      getDashboard(),
      getCourses(),
      getCodingProblems(),
      getProjects(),
      getJobs(),
    ])
      .then(([dashRes, courseRes, codingRes, projRes, jobsRes]) => {
        if (!isMounted) return;

        if (dashRes.status === "fulfilled" && dashRes.value?.success) {
          setDashboardData(dashRes.value);
        }
        if (courseRes.status === "fulfilled") {
          const list = courseRes.value?.courses || courseRes.value?.data || [];
          setCourses(Array.isArray(list) ? list : []);
        }
        if (codingRes.status === "fulfilled") {
          const list = codingRes.value?.problems || codingRes.value?.data || [];
          setCodingProblems(Array.isArray(list) ? list : []);
        }
        if (projRes.status === "fulfilled") {
          const list = projRes.value?.projects || projRes.value?.data || [];
          setProjects(Array.isArray(list) ? list : []);
        }
        if (jobsRes.status === "fulfilled") {
          const list = jobsRes.value?.jobs || jobsRes.value?.data || [];
          setJobs(Array.isArray(list) ? list : []);
        }
      })
      .catch((err) => {
        console.error("Failed to load personalized home data:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter recommendations by selected domain
  const domainCourses = useMemo(() => {
    return courses.filter((c) => isRelatedToDomain(c, selectedDomain)).slice(0, 4);
  }, [courses, selectedDomain]);

  const domainProblems = useMemo(() => {
    return codingProblems.filter((p) => isRelatedToDomain(p, selectedDomain)).slice(0, 4);
  }, [codingProblems, selectedDomain]);

  const domainProjects = useMemo(() => {
    return projects.filter((p) => isRelatedToDomain(p, selectedDomain)).slice(0, 3);
  }, [projects, selectedDomain]);

  const domainJobs = useMemo(() => {
    return jobs.filter((j) => isRelatedToDomain(j, selectedDomain)).slice(0, 4);
  }, [jobs, selectedDomain]);

  const enrolledCourses = dashboardData?.enrolled_courses || [];
  const inProgressCourses = enrolledCourses.filter((e) => e.status !== "completed");
  const stats = dashboardData?.progress || {};
  const appSummary = dashboardData?.applications?.summary || {};

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* 1. Personalized Welcome Header Banner */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827] via-[#0d1424] to-[#080B14] p-6 sm:p-10 shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Sparkles size={13} /> Student Portal
              </span>
              {selectedDomain ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300">
                  <DomainIcon size={13} /> {selectedDomain}
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Welcome back, <span className="bg-gradient-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">{user?.name || "Student"}</span>!
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              {selectedDomain
                ? `Your personalized track for ${selectedDomain}. Pick up where you left off or explore targeted recommendations below.`
                : "Select a career domain to unlock customized lessons, practice questions, and job opportunities."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/domains"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400/30 hover:text-white transition"
              >
                <Compass size={14} className="text-cyan-400" />
                {selectedDomain ? "Change Career Track" : "Choose Career Domain"}
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 transition"
              >
                <LayoutDashboard size={14} />
                View Full Dashboard
              </Link>
            </div>
          </div>

          {/* Real Metrics Strip */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-black text-white">
                {inProgressCourses.length}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                In Progress
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-black text-emerald-400">
                {stats.problems_solved ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Solved
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-black text-cyan-400">
                {appSummary.total_applications ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Applied
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-black text-violet-400">
                {stats.total_xp ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total XP
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Selection Prompt Banner if no domain is selected */}
      {!selectedDomain && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Career Track Not Selected</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Choose one of the 8 career domains to get tailored courses, coding exercises, and student job openings.
              </p>
            </div>
          </div>
          <Link
            to="/domains"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition shrink-0"
          >
            <span>Select Domain</span>
            <ArrowRight size={14} />
          </Link>
        </section>
      )}

      {/* 2. Continue Learning Section (Real Data + Honest Empty State) */}
      <section aria-labelledby="continue-learning-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="continue-learning-heading" className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-cyan-400" />
              Continue Learning
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Resume your enrolled courses where you left off.
            </p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 transition"
          >
            View all courses <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <Loader2 size={22} className="animate-spin text-cyan-400" />
          </div>
        ) : inProgressCourses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgressCourses.map((enrollment) => (
              <div
                key={enrollment.id}
                className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#101827] p-5 transition hover:border-cyan-400/40 hover:bg-[#131f31]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10px]">
                      Course In Progress
                    </span>
                    {enrollment.duration_minutes ? (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock size={12} /> {enrollment.duration_minutes}m
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 transition line-clamp-2">
                    {enrollment.title}
                  </h3>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                      <span>Progress</span>
                      <span className="text-cyan-300">{enrollment.progress_percent || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300"
                        style={{ width: `${Math.max(5, enrollment.progress_percent || 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06]">
                  <Link
                    to={`/courses/${enrollment.slug}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] py-2 text-xs font-semibold text-white transition hover:bg-cyan-500 hover:text-slate-950"
                  >
                    <span>Resume Course</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Honest Empty State */
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.015] p-8 text-center">
            <BookOpen size={32} className="mx-auto text-slate-500" />
            <h3 className="mt-3 text-sm font-bold text-white">No courses in progress</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              {selectedDomain
                ? `You have not enrolled in any ${selectedDomain} courses yet. Browse our catalog and start your learning journey.`
                : "You have not enrolled in any courses yet. Browse our catalog and start learning."}
            </p>
            <Link
              to="/courses"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
            >
              <span>Explore Courses</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </section>

      {/* 3. Recommended for You Section (Domain-Filtered) */}
      <section aria-labelledby="recommended-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="recommended-heading" className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-violet-400" />
              Recommended for You
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDomain
                ? `Curated modules, coding challenges, projects, and job openings for ${selectedDomain}.`
                : "Curated learning and career opportunities across top tech tracks."}
            </p>
          </div>

          {/* Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-1 text-xs">
            {[
              { id: "all", label: "Overview" },
              { id: "courses", label: `Courses (${domainCourses.length})` },
              { id: "practice", label: `Practice (${domainProblems.length})` },
              { id: "projects", label: `Projects (${domainProjects.length})` },
              { id: "jobs", label: `Jobs (${domainJobs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <Loader2 size={24} className="animate-spin text-violet-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview / All view */}
            {(activeTab === "all" || activeTab === "courses") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BookOpen size={16} className="text-cyan-400" /> Recommended Courses
                  </h3>
                  <Link to="/courses" className="text-xs font-medium text-cyan-300 hover:underline">
                    All Courses
                  </Link>
                </div>
                {domainCourses.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {domainCourses.map((course) => (
                      <Link
                        key={course.id}
                        to={`/courses/${course.slug}`}
                        className="group rounded-2xl border border-white/[0.08] bg-[#101827] p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-[#131f31]"
                      >
                        <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          {course.category || selectedDomain || "Course"}
                        </span>
                        <h4 className="mt-2 text-xs font-bold text-white group-hover:text-cyan-200 transition line-clamp-2">
                          {course.title}
                        </h4>
                        <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 font-semibold">
                          <span>{course.level || "Beginner"}</span>
                          <span className="text-cyan-300 group-hover:translate-x-0.5 transition inline-flex items-center gap-0.5">
                            Start <ArrowRight size={10} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4 text-center text-xs text-slate-400">
                    No courses matching {selectedDomain || "this domain"} found in current catalog.
                  </div>
                )}
              </div>
            )}

            {/* Practice Problems */}
            {(activeTab === "all" || activeTab === "practice") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Code2 size={16} className="text-emerald-400" /> Recommended Coding Challenges
                  </h3>
                  <Link to="/coding" className="text-xs font-medium text-emerald-300 hover:underline">
                    Open Coding Platform
                  </Link>
                </div>
                {domainProblems.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {domainProblems.map((prob) => {
                      const diffColor =
                        prob.difficulty === "Easy"
                          ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                          : prob.difficulty === "Medium"
                            ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
                            : "text-rose-300 bg-rose-500/10 border-rose-500/20";
                      return (
                        <Link
                          key={prob.id}
                          to={`/coding/problems/${prob.slug}`}
                          className="group rounded-2xl border border-white/[0.08] bg-[#101827] p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-[#131f31]"
                        >
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${diffColor}`}>
                            {prob.difficulty}
                          </span>
                          <h4 className="mt-2 text-xs font-bold text-white group-hover:text-emerald-200 transition line-clamp-1">
                            {prob.title}
                          </h4>
                          <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                            {prob.description}
                          </p>
                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 font-semibold">
                            <span>{prob.category || "Algorithms"}</span>
                            <span className="text-emerald-300 group-hover:translate-x-0.5 transition inline-flex items-center gap-0.5">
                              Solve <ArrowRight size={10} />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4 text-center text-xs text-slate-400">
                    No coding questions found for {selectedDomain || "this domain"} currently.
                  </div>
                )}
              </div>
            )}

            {/* Projects & Blueprints */}
            {(activeTab === "all" || activeTab === "projects") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers size={16} className="text-violet-400" /> Portfolio Projects
                  </h3>
                  <Link to="/projects" className="text-xs font-medium text-violet-300 hover:underline">
                    View Project Hub
                  </Link>
                </div>
                {domainProjects.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {domainProjects.map((proj) => (
                      <div
                        key={proj.id}
                        className="rounded-2xl border border-white/[0.08] bg-[#101827] p-4 flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                            {proj.difficulty || "Project"}
                          </span>
                          <h4 className="mt-1 text-xs font-bold text-white line-clamp-1">
                            {proj.title}
                          </h4>
                          <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-2">
                            {proj.description}
                          </p>
                          {Array.isArray(proj.tech_stack) && proj.tech_stack.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {proj.tech_stack.slice(0, 3).map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-300"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Link
                          to="/projects"
                          className="mt-4 text-[11px] font-bold text-violet-300 hover:underline inline-flex items-center gap-1"
                        >
                          Explore Project <ArrowRight size={11} />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4 text-center text-xs text-slate-400">
                    No portfolio projects tagged with {selectedDomain || "this domain"} yet.
                  </div>
                )}
              </div>
            )}

            {/* Jobs & Internships */}
            {(activeTab === "all" || activeTab === "jobs") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BriefcaseBusiness size={16} className="text-amber-400" /> Matched Opportunities
                  </h3>
                  <Link to="/jobs" className="text-xs font-medium text-amber-300 hover:underline">
                    Browse All Jobs
                  </Link>
                </div>
                {domainJobs.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {domainJobs.map((job) => (
                      <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="group rounded-2xl border border-white/[0.08] bg-[#101827] p-4 transition hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-[#131f31]"
                      >
                        <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          {job.employment_type || job.job_type || "Opportunity"}
                        </span>
                        <h4 className="mt-2 text-xs font-bold text-white group-hover:text-amber-200 transition line-clamp-1">
                          {job.title}
                        </h4>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                          <Building2 size={11} className="shrink-0 text-slate-500" />
                          <span className="truncate">{job.company_name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                          <MapPin size={11} className="shrink-0 text-slate-500" />
                          <span className="truncate">{job.location || "Remote"}</span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-end text-[10px] font-bold text-amber-300">
                          <span>Apply <ArrowRight size={10} className="inline ml-0.5" /></span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4 text-center text-xs text-slate-400">
                    No active job listings matching {selectedDomain || "this domain"} right now.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Quick Platform Hub / Core Tools */}
      <section aria-labelledby="platform-hub-heading" className="space-y-4">
        <h2 id="platform-hub-heading" className="text-xl font-bold text-white">
          Explore Platform Modules
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Online Coding Workspace",
              description: "Write and execute real test cases in Java, Python, C++, and JavaScript.",
              path: "/coding",
              icon: Code2,
              color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
            },
            {
              title: "Course Catalog",
              description: "Structured computer science, backend, and development curriculums.",
              path: "/courses",
              icon: BookOpen,
              color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
            },
            {
              title: "Jobs & Internships",
              description: "Curated student software engineering and tech job openings.",
              path: "/jobs",
              icon: BriefcaseBusiness,
              color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
            },
            {
              title: "Portfolio Project Hub",
              description: "Build, deploy, and verify full-stack projects for your resume.",
              path: "/projects",
              icon: Layers,
              color: "text-violet-400 border-violet-500/20 bg-violet-500/10",
            },
            {
              title: "Student Dashboard",
              description: "Track problem solving metrics, application stages, and XP milestones.",
              path: "/dashboard",
              icon: LayoutDashboard,
              color: "text-blue-400 border-blue-500/20 bg-blue-500/10",
            },
            {
              title: "Resume Studio",
              description: "Design ATS-ready engineering resumes with live previews.",
              path: "/resume",
              icon: FileText,
              color: "text-pink-400 border-pink-500/20 bg-pink-500/10",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.path}
                className="group rounded-2xl border border-white/[0.08] bg-[#101827] p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-[#131f31]"
              >
                <div className="flex items-start justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.color}`}>
                    <Icon size={20} />
                  </span>
                  <ChevronRight size={16} className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-slate-300" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-white group-hover:text-cyan-200 transition">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
