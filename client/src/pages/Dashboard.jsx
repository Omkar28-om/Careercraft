import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, animate } from "framer-motion";
import {
  Code2,
  BookOpen,
  BriefcaseBusiness,
  Briefcase,
  Sparkles,
  Flame,
  Trophy,
  ArrowRight,
  Compass,
  Award,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell,
  Layers,
  Send,
  Lock,
  GraduationCap,
  ChevronRight,
  Target,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/ProtectedRoute";
import {
  getDashboard,
  getNotifications,
  getAchievements,
  getSkills,
  getCareerRecommendations,
} from "../services/api";

// Animated Numeric Counter with full reduced-motion support
function AnimatedCounter({ value, duration = 1.0 }) {
  const shouldReduceMotion = useReducedMotion();
  const numValue = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? numValue : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(numValue);
      return;
    }
    const controls = animate(0, numValue, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [numValue, duration, shouldReduceMotion]);

  return <span>{displayValue}</span>;
}

// Activity visual styling helper
function getActivityIconAndColor(type) {
  switch (type) {
    case "skill_added":
      return {
        icon: Sparkles,
        iconColor: "text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30",
        badge: "Skill",
      };
    case "profile_update":
      return {
        icon: CheckCircle2,
        iconColor: "text-[#22D3EE] bg-[#22D3EE]/15 border-[#22D3EE]/30",
        badge: "Profile",
      };
    case "problem_solved":
      return {
        icon: Code2,
        iconColor: "text-[#10B981] bg-[#10B981]/15 border-[#10B981]/30",
        badge: "Coding",
      };
    case "course_completed":
      return {
        icon: BookOpen,
        iconColor: "text-[#38BDF8] bg-[#38BDF8]/15 border-[#38BDF8]/30",
        badge: "Course",
      };
    case "freelance_proposal_submitted":
      return {
        icon: Send,
        iconColor: "text-[#22D3EE] bg-[#22D3EE]/15 border-[#22D3EE]/30",
        badge: "Proposal",
      };
    case "freelance_contract_completed":
      return {
        icon: Trophy,
        iconColor: "text-[#10B981] bg-[#10B981]/15 border-[#10B981]/30",
        badge: "Contract",
      };
    default:
      return {
        icon: Activity,
        iconColor: "text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30",
        badge: "Activity",
      };
  }
}

// Relative timestamp formatter
function formatActivityTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Time-of-day greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Skill proficiency metadata mapping
function getProficiencyMeta(proficiency) {
  const p = (proficiency || "").toLowerCase();
  switch (p) {
    case "expert":
      return {
        percentage: 100,
        label: "Expert",
        badgeStyle: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        barGradient: "from-emerald-500 to-teal-400",
        nextAction: "Explore Matching Jobs",
        nextRoute: "/jobs",
      };
    case "advanced":
      return {
        percentage: 75,
        label: "Advanced",
        badgeStyle: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        barGradient: "from-cyan-500 to-blue-400",
        nextAction: "Build Portfolio Project",
        nextRoute: "/projects",
      };
    case "intermediate":
      return {
        percentage: 50,
        label: "Intermediate",
        badgeStyle: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        barGradient: "from-purple-500 to-indigo-400",
        nextAction: "Practice Coding Problems",
        nextRoute: "/coding",
      };
    case "beginner":
    default:
      return {
        percentage: 25,
        label: "Beginner",
        badgeStyle: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        barGradient: "from-amber-500 to-yellow-400",
        nextAction: "Enroll in Academy Track",
        nextRoute: "/courses",
      };
  }
}

export default function Dashboard() {
  const { user: authUser, loading: authLoading } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [dashboardData, setDashboardData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [careerInfo, setCareerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, notifRes, achRes, skillsRes, careerRes] = await Promise.all([
        getDashboard(),
        getNotifications({ limit: 4 }).catch(() => null),
        getAchievements().catch(() => ({ achievements: [] })),
        getSkills().catch(() => ({ skills: [] })),
        getCareerRecommendations().catch(() => null),
      ]);

      if (dashRes && dashRes.dashboard) {
        setDashboardData(dashRes.dashboard);
      }
      if (notifRes && notifRes.notifications) {
        setRecentNotifications(notifRes.notifications);
      }
      if (achRes && Array.isArray(achRes.achievements)) {
        setAchievements(achRes.achievements);
      }
      if (skillsRes && Array.isArray(skillsRes.skills)) {
        setUserSkills(skillsRes.skills);
      }
      if (careerRes?.success && careerRes.recommendation) {
        setCareerInfo(careerRes.recommendation);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Deterministic Career Readiness calculation from real PostgreSQL data
  const careerReadiness = useMemo(() => {
    const profileCompleteness = dashboardData?.profileCompleteness?.percentage || 0;
    const problemsSolved = dashboardData?.progress?.problemsSolved || 0;
    const coursesCompleted = dashboardData?.progress?.coursesCompleted || 0;
    const projectsCompleted = dashboardData?.progress?.projectsCompleted || 0;
    const skillsCount = userSkills.length;

    const problemScore = Math.min(100, (problemsSolved / 20) * 100);
    const courseScore = Math.min(100, (coursesCompleted / 2) * 100);
    const projectScore = Math.min(100, (projectsCompleted / 2) * 100);
    const skillScore = Math.min(100, (skillsCount / 6) * 100);

    const total = Math.round(
      profileCompleteness * 0.2 +
        problemScore * 0.25 +
        courseScore * 0.25 +
        projectScore * 0.2 +
        skillScore * 0.1
    );

    return {
      total: Math.min(100, Math.max(0, total)),
      profileCompleteness,
      problemScore: Math.round(problemScore),
      courseScore: Math.round(courseScore),
      projectScore: Math.round(projectScore),
      skillScore: Math.round(skillScore),
      problemsSolved,
      coursesCompleted,
      projectsCompleted,
      skillsCount,
    };
  }, [dashboardData, userSkills]);

  // 7-day activity visualizer derived exclusively from recent user activities
  const weeklyActivity = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();

    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return {
        date: d,
        dayName: days[d.getDay()],
        dateStr: d.toISOString().split("T")[0],
        count: 0,
        xp: 0,
      };
    });

    const recentActs = dashboardData?.recentActivities || [];
    if (Array.isArray(recentActs)) {
      recentActs.forEach((act) => {
        const rawDate = act.createdAt || act.created_at;
        if (!rawDate) return;
        const actDate = new Date(rawDate);
        const actDateStr = actDate.toISOString().split("T")[0];
        const match = past7Days.find((d) => d.dateStr === actDateStr);
        if (match) {
          match.count += 1;
          match.xp += Number(act.xpEarned || act.xp_earned || 0);
        }
      });
    }

    const maxCount = Math.max(...past7Days.map((d) => d.count), 1);
    const totalWeekActivities = past7Days.reduce((sum, d) => sum + d.count, 0);

    return { past7Days, maxCount, totalWeekActivities };
  }, [dashboardData]);

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  const progress = dashboardData?.progress || {
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    problemsSolved: 0,
    coursesCompleted: 0,
    projectsCompleted: 0,
    level: 1,
    levelTitle: "Novice Coder",
    levelProgress: 0,
    xpForNextLevel: 100,
  };

  const profile = dashboardData?.profile || {};
  const userName = dashboardData?.user?.name || authUser?.name?.trim() || "Student";
  const userEmail = dashboardData?.user?.email || authUser?.email || "";
  const userRole = (dashboardData?.user?.role || authUser?.role || "student").toUpperCase();

  const activeCourses = dashboardData?.enrolledCourses || [];
  const applicationsSummary = dashboardData?.applicationsSummary || {
    total: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
  };

  const recentApplications = dashboardData?.recentApplications || [];
  const recentActivities = dashboardData?.recentActivities || [];
  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

  // The 4 Primary Statistic Cards
  const primaryStatCards = [
    {
      id: "problems-solved",
      title: "Problems Solved",
      value: progress.problemsSolved,
      suffix: "",
      icon: Code2,
      accentColor: "#10B981",
      iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      supportingText:
        progress.currentStreak > 0
          ? `${progress.currentStreak} day streak active`
          : `Level ${progress.level} • ${progress.levelTitle}`,
      link: "/coding",
    },
    {
      id: "skills-tracked",
      title: "Skills Tracked",
      value: userSkills.length,
      suffix: "",
      icon: Sparkles,
      accentColor: "#8B5CF6",
      iconBg: "bg-[#8B5CF6]/10 border-[#8B5CF6]/20 text-[#A78BFA]",
      supportingText:
        userSkills.length > 0
          ? `${userSkills.filter((s) => s.proficiency === "Advanced" || s.proficiency === "Expert").length} Advanced or Expert`
          : "Add skills in Profile",
      link: "/profile",
    },
    {
      id: "courses-completed",
      title: "Courses Completed",
      value: progress.coursesCompleted,
      suffix: "",
      icon: BookOpen,
      accentColor: "#22D3EE",
      iconBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      supportingText:
        activeCourses.length > 0
          ? `${activeCourses.length} currently enrolled`
          : "Explore academy catalog",
      link: "/courses",
    },
    {
      id: "career-readiness",
      title: "Career Readiness",
      value: careerInfo?.careerReadiness?.percentage ?? careerReadiness.total,
      suffix: "%",
      icon: Compass,
      accentColor: "#F59E0B",
      iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      supportingText:
        careerInfo?.topRecommendations?.[0]?.name ||
        careerInfo?.recommendedRole ||
        "Engineering Benchmark",
      link: "/career",
    },
  ];

  // The 6 Quick Action Cards
  const quickActions = [
    {
      id: "action-coding",
      title: "Practice Coding",
      description: "Solve algorithmic challenges & climb levels",
      icon: Code2,
      to: "/coding",
      accent: "#10B981",
      badge: `${progress.problemsSolved} Solved`,
    },
    {
      id: "action-courses",
      title: "Continue Learning",
      description: "Explore tech roadmaps & video lessons",
      icon: BookOpen,
      to: "/courses",
      accent: "#22D3EE",
      badge: `${activeCourses.length} Enrolled`,
    },
    {
      id: "action-projects",
      title: "Build a Project",
      description: "Showcase verified full-stack applications",
      icon: Layers,
      to: "/projects",
      accent: "#8B5CF6",
      badge: `${progress.projectsCompleted} Completed`,
    },
    {
      id: "action-jobs",
      title: "Explore Jobs",
      description: "Discover curated software engineer openings",
      icon: Briefcase,
      to: "/jobs",
      accent: "#F59E0B",
      badge: `${applicationsSummary.total} Applied`,
    },
    {
      id: "action-internships",
      title: "Explore Internships",
      description: "Apply for student & graduate internships",
      icon: GraduationCap,
      to: "/internships",
      accent: "#38BDF8",
      badge: "Verified",
    },
    {
      id: "action-career",
      title: "Career Guidance",
      description: "AI-matched role roadmaps & skill gaps",
      icon: Compass,
      to: "/career",
      accent: "#EC4899",
      badge: `${careerReadiness.total}% Ready`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col selection:bg-[#8B5CF6]/30 selection:text-[#F8FAFC]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-rose-400 shrink-0" size={20} />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-rose-400 focus:outline-none"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* ======================================================
            STEP 1 — POLISHED WELCOME HERO
            ====================================================== */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
        >
          {/* Restrained Purple & Cyan Ambient Lighting */}
          <div className="pointer-events-none absolute -right-20 -top-20 -z-10 h-80 w-80 rounded-full bg-[#8B5CF6]/12 blur-3xl" />
          <div className="pointer-events-none absolute left-1/4 -bottom-20 -z-10 h-72 w-72 rounded-full bg-[#22D3EE]/10 blur-3xl" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/15 px-3 py-1 text-xs font-bold text-[#C4B5FD] border border-[#8B5CF6]/30">
                  <Award size={13} className="text-[#A78BFA]" />
                  <span>
                    Level {progress.level} • {progress.levelTitle}
                  </span>
                </span>

                {progress.currentStreak > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                    <Flame size={13} className="text-amber-400 fill-amber-400" />
                    <span>{progress.currentStreak} Day Streak</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-[#94A3B8] border border-white/10">
                    <span>{userRole}</span>
                  </span>
                )}

                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#22D3EE]/10 px-3 py-1 text-xs font-medium text-[#22D3EE] border border-[#22D3EE]/25 hover:bg-[#22D3EE]/20 transition focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus:outline-none"
                >
                  <CheckCircle2 size={13} />
                  <span>
                    Profile {dashboardData?.profileCompleteness?.percentage || 0}% Complete
                  </span>
                </Link>
              </div>

              {/* Title & Personalized Greeting */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
                {getGreeting()},{" "}
                <span className="bg-gradient-to-r from-[#F8FAFC] via-[#E2E8F0] to-[#C4B5FD] bg-clip-text text-transparent">
                  {userName}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl leading-relaxed">
                Welcome to your CareerCraft development workspace. Track verified skill progress,
                solve algorithmic challenges, and prepare for high-impact technical opportunities.
              </p>

              {/* Student info tags */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#94A3B8] pt-1">
                <span>{userEmail}</span>
                {profile.college && (
                  <>
                    <span className="text-white/20">•</span>
                    <span>{profile.college}</span>
                  </>
                )}
                {profile.degree && (
                  <>
                    <span className="text-white/20">•</span>
                    <span>{profile.degree}</span>
                  </>
                )}
                {profile.graduation_year && (
                  <>
                    <span className="text-white/20">•</span>
                    <span>Class of {profile.graduation_year}</span>
                  </>
                )}
              </div>
            </div>

            {/* Level & XP Widget */}
            <div className="rounded-2xl border border-white/10 bg-[#1E293B]/70 p-5 lg:w-80 shrink-0 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Trophy size={14} className="text-[#F59E0B]" />
                  <span>Experience Points</span>
                </span>
                <span className="font-extrabold text-[#F59E0B] text-sm">
                  <AnimatedCounter value={progress.totalXp} /> XP
                </span>
              </div>

              {/* Progress bar towards next level */}
              <div className="h-2 w-full rounded-full bg-[#080B14] overflow-hidden">
                <motion.div
                  initial={shouldReduceMotion ? false : { width: 0 }}
                  animate={{ width: `${Math.min(100, progress.levelProgress || 0)}%` }}
                  transition={{ duration: 1.0, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#22D3EE]"
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#94A3B8]">
                <span>Level {progress.level}</span>
                <span>{progress.levelProgress}% into next level</span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#94A3B8]">
                  {progress.currentStreak > 0
                    ? `Active streak: ${progress.currentStreak}d`
                    : "Solve daily code to build streak"}
                </span>
                <Link
                  to="/achievements"
                  className="inline-flex items-center gap-1 font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition text-xs focus-visible:ring-1 focus-visible:ring-[#8B5CF6] focus:outline-none rounded"
                >
                  <span>Badges ({unlockedAchievementsCount})</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ======================================================
            STEP 2 — POLISHED FOUR PRIMARY STATISTIC CARDS
            ====================================================== */}
        <section aria-label="Key Statistics" className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {primaryStatCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : idx * 0.08,
                    ease: "easeOut",
                  }}
                  whileHover={shouldReduceMotion ? {} : { y: -3, transition: { duration: 0.2 } }}
                  className="group relative rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg transition-all duration-300 hover:border-[#8B5CF6]/40 hover:shadow-xl hover:shadow-[#8B5CF6]/5 min-h-[148px] flex flex-col justify-between"
                >
                  <Link
                    to={card.link}
                    className="flex flex-col justify-between h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#94A3B8] tracking-wider uppercase">
                        {card.title}
                      </span>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.iconBg} transition-transform duration-300 group-hover:scale-105`}
                      >
                        <Icon size={18} />
                      </div>
                    </div>

                    <div className="my-3 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#F8FAFC]">
                        <AnimatedCounter value={card.value} />
                      </span>
                      {card.suffix && (
                        <span className="text-xl font-bold text-[#94A3B8]">{card.suffix}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1 border-t border-white/5">
                      <span className="truncate pr-2">{card.supportingText}</span>
                      <ChevronRight
                        size={14}
                        className="text-[#94A3B8] opacity-60 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0"
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ======================================================
            STEP 3 — POLISHED QUICK ACTIONS
            ====================================================== */}
        <section aria-label="Quick Actions" className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sparkles size={16} className="text-[#8B5CF6]" />
              <span>Quick Actions</span>
            </h2>
            <span className="text-xs text-[#94A3B8]">Jump directly into your workspace</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {quickActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <motion.div
                  key={action.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: shouldReduceMotion ? 0 : idx * 0.05,
                  }}
                  whileHover={shouldReduceMotion ? {} : { y: -3, transition: { duration: 0.15 } }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  className="group h-full"
                >
                  <Link
                    to={action.to}
                    className="flex flex-col justify-between h-full rounded-2xl border border-white/10 bg-[#111827] p-4 sm:p-5 text-left transition-all duration-200 hover:border-[#8B5CF6]/50 hover:bg-[#1E293B] hover:shadow-lg hover:shadow-[#8B5CF6]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#F8FAFC] group-hover:border-[#22D3EE]/40 transition-colors"
                          style={{ color: action.accent }}
                        >
                          <ActionIcon size={18} />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-[#94A3B8] border border-white/5">
                          {action.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors line-clamp-1">
                        {action.title}
                      </h3>
                      <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                        {action.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-semibold text-[#8B5CF6] group-hover:text-[#22D3EE] transition-colors">
                      <span>Launch</span>
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ======================================================
            MAIN WORKSPACE CONTENT (2 COLUMNS)
            ====================================================== */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ================= LEFT 2 COLUMNS ================= */}
          <div className="lg:col-span-2 space-y-8">
            {/* ======================================================
                STEP 4 — POLISHED SKILL DEVELOPMENT SECTION
                ====================================================== */}
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#F8FAFC] text-base sm:text-lg">
                      Skill Development & Proficiency
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      Verified technical proficiencies and actionable next steps
                    </p>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-1 text-xs font-semibold text-[#22D3EE] hover:text-[#38BDF8] transition focus-visible:ring-1 focus-visible:ring-[#22D3EE] focus:outline-none rounded"
                >
                  <span>Manage in Profile</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {userSkills.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#1E293B]/20 p-8 sm:p-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/20 mb-3">
                    <Sparkles size={22} />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                    No technical skills tracked yet
                  </h3>
                  <p className="mt-1.5 max-w-sm text-xs text-[#94A3B8] leading-relaxed">
                    Add your programming languages, frameworks, and databases in your profile to unlock
                    skill gap analysis and role match calculations.
                  </p>
                  <Link to="/profile" className="mt-4">
                    <Button variant="primary" size="sm">
                      Add Skills in Profile
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {userSkills.map((skill, index) => {
                    const meta = getProficiencyMeta(skill.proficiency || skill.level);
                    return (
                      <div
                        key={skill.id || index}
                        className="rounded-xl border border-white/10 bg-[#1E293B]/50 p-4 transition-all duration-200 hover:border-[#8B5CF6]/30 hover:bg-[#1E293B]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0 flex-1 mr-2">
                            <h3 className="font-bold text-sm text-[#F8FAFC] truncate">
                              {skill.name}
                            </h3>
                            {skill.category && (
                              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                                {skill.category}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeStyle} shrink-0`}
                          >
                            {meta.label}
                          </span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-1">
                            <span>Proficiency</span>
                            <span className="font-semibold text-[#F8FAFC]">{meta.percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#080B14] overflow-hidden">
                            <motion.div
                              initial={shouldReduceMotion ? false : { width: 0 }}
                              animate={{ width: `${meta.percentage}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r ${meta.barGradient}`}
                            />
                          </div>
                        </div>

                        {/* Next Action Link */}
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#94A3B8]">Next milestone:</span>
                          <Link
                            to={meta.nextRoute}
                            className="inline-flex items-center gap-1 font-semibold text-[#22D3EE] hover:text-[#38BDF8] transition text-[11px] focus-visible:ring-1 focus-visible:ring-[#22D3EE] focus:outline-none rounded"
                          >
                            <span>{meta.nextAction}</span>
                            <ArrowRight size={11} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ======================================================
                STEP 6 — WEEKLY LEARNING & CODING ACTIVITY
                ====================================================== */}
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#F8FAFC] text-base sm:text-lg">
                      Weekly Learning & Coding Activity
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      7-day timeline based on verified platform submissions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
                    <Flame size={14} className="fill-amber-400 text-amber-400" />
                    <span>
                      {progress.currentStreak > 0
                        ? `${progress.currentStreak} Day Streak`
                        : "0 Day Streak"}
                    </span>
                  </div>
                  <span className="text-xs text-[#94A3B8]">
                    (Longest: {progress.longestStreak || 0}d)
                  </span>
                </div>
              </div>

              {weeklyActivity.totalWeekActivities === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <Activity size={24} className="mx-auto text-[#94A3B8] mb-2" />
                  <p className="text-sm font-semibold text-[#F8FAFC]">
                    No activity recorded in the past 7 days
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8] max-w-sm mx-auto">
                    Solve a coding problem or complete an academy lesson today to build your streak.
                  </p>
                  <Link to="/coding" className="mt-4 inline-block">
                    <Button variant="primary" size="sm">
                      Solve Today&apos;s Problem
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 7-Day Activity Bar Chart */}
                  <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-4 pb-2 items-end h-36">
                    {weeklyActivity.past7Days.map((d, i) => {
                      const heightPercent =
                        d.count > 0 ? Math.max(18, Math.round((d.count / weeklyActivity.maxCount) * 100)) : 6;
                      const isToday = i === 6;

                      return (
                        <div key={d.dateStr} className="flex flex-col items-center h-full justify-end group">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#F8FAFC] font-semibold bg-[#1E293B] px-1.5 py-0.5 rounded border border-white/10 mb-1 whitespace-nowrap pointer-events-none">
                            {d.count} action{d.count === 1 ? "" : "s"}
                            {d.xp > 0 ? ` (+${d.xp} XP)` : ""}
                          </div>

                          {/* Bar */}
                          <div className="w-full max-w-[36px] bg-[#080B14] rounded-lg overflow-hidden flex flex-col justify-end p-0.5 h-24">
                            <motion.div
                              initial={shouldReduceMotion ? false : { height: 0 }}
                              animate={{ height: `${heightPercent}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                              className={`w-full rounded-md transition-colors ${
                                d.count > 0
                                  ? isToday
                                    ? "bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE]"
                                    : "bg-gradient-to-t from-[#10B981] to-[#22D3EE]"
                                  : "bg-white/5"
                              }`}
                            />
                          </div>

                          {/* Day Label */}
                          <div className="mt-2 text-center">
                            <span
                              className={`text-[11px] font-semibold block ${
                                isToday ? "text-[#22D3EE]" : "text-[#94A3B8]"
                              }`}
                            >
                              {d.dayName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-2 border-t border-white/5">
                    <span>
                      Total this week:{" "}
                      <strong className="text-[#F8FAFC]">{weeklyActivity.totalWeekActivities}</strong>{" "}
                      actions completed
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                      <span>Active Day</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================
                ENROLLED COURSES PROGRESS
                ====================================================== */}
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#F8FAFC] text-base sm:text-lg">
                      Academy Course Enrollments
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      Interactive tracks and lessons in progress
                    </p>
                  </div>
                </div>

                <Link
                  to="/courses"
                  className="flex items-center gap-1 text-xs font-semibold text-[#22D3EE] hover:text-[#38BDF8] transition"
                >
                  <span>Explore Courses</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {activeCourses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <BookOpen size={28} className="mx-auto text-[#94A3B8] mb-2" />
                  <p className="text-sm font-semibold text-[#F8FAFC]">No active course enrollments</p>
                  <p className="mt-1 text-xs text-[#94A3B8] max-w-sm mx-auto">
                    Enroll in software engineering tracks to advance your algorithmic and system design
                    foundations.
                  </p>
                  <Link to="/courses" className="mt-4 inline-block">
                    <Button variant="primary" size="sm">
                      Browse Academy
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeCourses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-xl border border-white/10 bg-[#1E293B]/50 p-4 transition-all duration-200 hover:border-[#22D3EE]/30 hover:bg-[#1E293B]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-3">
                          <h3 className="font-semibold text-sm text-[#F8FAFC] truncate">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] mt-0.5">
                            <span className="capitalize">
                              Status:{" "}
                              <span
                                className={
                                  course.status === "completed"
                                    ? "text-[#10B981] font-semibold"
                                    : "text-[#22D3EE]"
                                }
                              >
                                {course.status}
                              </span>
                            </span>
                            {course.durationMinutes > 0 && (
                              <>
                                <span>•</span>
                                <span>{Math.round(course.durationMinutes / 60)} hrs content</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#22D3EE] shrink-0">
                          {course.progress}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#080B14] overflow-hidden">
                        <motion.div
                          initial={shouldReduceMotion ? false : { width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#22D3EE]"
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-end text-xs">
                        <Link
                          to={`/courses/${course.slug}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#22D3EE] hover:text-[#38BDF8] transition text-xs"
                        >
                          <span>{course.status === "completed" ? "Review Track" : "Continue Track"}</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ======================================================
                APPLICATION PIPELINE & STATUS
                ====================================================== */}
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
                    <BriefcaseBusiness size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#F8FAFC] text-base sm:text-lg">
                      Application Pipeline & Status
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      Live tracking of verified job submissions
                    </p>
                  </div>
                </div>

                <Link
                  to="/applications"
                  className="flex items-center gap-1 text-xs font-semibold text-[#22D3EE] hover:text-[#38BDF8] transition"
                >
                  <span>All ({applicationsSummary.total})</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
                <div className="rounded-xl border border-white/5 bg-[#1E293B]/40 p-3 text-center">
                  <p className="text-xs text-[#94A3B8]">Applied</p>
                  <p className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                    {applicationsSummary.applied || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#1E293B]/40 p-3 text-center">
                  <p className="text-xs text-amber-400">Under Review</p>
                  <p className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                    {applicationsSummary.underReview || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#1E293B]/40 p-3 text-center">
                  <p className="text-xs text-purple-400">Shortlisted</p>
                  <p className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                    {applicationsSummary.shortlisted || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#1E293B]/40 p-3 text-center">
                  <p className="text-xs text-cyan-400">Interview</p>
                  <p className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                    {applicationsSummary.interview || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#1E293B]/40 p-3 text-center col-span-2 sm:col-span-1">
                  <p className="text-xs text-emerald-400">Selected</p>
                  <p className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                    {applicationsSummary.selected || 0}
                  </p>
                </div>
              </div>

              {recentApplications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <BriefcaseBusiness size={24} className="mx-auto text-[#94A3B8] mb-2" />
                  <p className="text-xs font-semibold text-[#F8FAFC]">No active job applications</p>
                  <p className="mt-1 text-[11px] text-[#94A3B8]">
                    Explore junior and full-time software engineering roles to start interviewing.
                  </p>
                  <Link to="/jobs" className="mt-3 inline-block">
                    <Button variant="primary" size="sm">
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5 rounded-xl border border-white/5 overflow-hidden">
                  {recentApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.02] transition"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <Link
                          to={`/jobs/${app.jobId}`}
                          className="font-semibold text-xs sm:text-sm text-[#F8FAFC] hover:text-[#22D3EE] transition truncate block"
                        >
                          {app.role}
                        </Link>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
                          {app.company} {app.location ? `• ${app.location}` : ""} •{" "}
                          {new Date(app.appliedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          app.status === "selected"
                            ? "emerald"
                            : app.status === "rejected"
                            ? "rose"
                            : "cyan"
                        }
                        size="xs"
                      >
                        {app.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN (1/3 WIDTH) ================= */}
          <div className="space-y-6">
            {/* ======================================================
                STEP 5 — POLISHED CAREER ROADMAP PANEL
                ====================================================== */}
            <div className="rounded-2xl border border-[#22D3EE]/30 bg-gradient-to-br from-[#1E293B] via-[#111827] to-[#080B14] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
                  <Compass size={16} />
                  <span>Career Roadmap</span>
                </div>
                <Link
                  to="/career"
                  className="text-xs text-[#22D3EE] hover:text-[#38BDF8] font-semibold flex items-center gap-1 focus-visible:ring-1 focus-visible:ring-[#22D3EE] focus:outline-none rounded"
                >
                  <span>Full Plan</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

              {/* Overall Readiness Gauge */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#F8FAFC]">Overall Readiness</span>
                  <span className="font-bold text-[#22D3EE] text-sm">{careerReadiness.total}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#080B14] overflow-hidden">
                  <motion.div
                    initial={shouldReduceMotion ? false : { width: 0 }}
                    animate={{ width: `${careerReadiness.total}%` }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#22D3EE]"
                  />
                </div>
              </div>

              {/* Recommended Role Card */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs mb-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#94A3B8] block">
                  Recommended Path
                </span>
                <p className="font-bold text-sm text-[#F8FAFC] mt-0.5">
                  {careerInfo?.topRecommendations?.[0]?.name ||
                    careerInfo?.recommendedRole ||
                    "Full-Stack Software Engineer"}
                </p>
                <p className="mt-1 text-[11px] text-[#94A3B8] leading-relaxed">
                  {careerReadiness.skillsCount < 4
                    ? "Add core programming languages in your profile to refine your exact match."
                    : "Benchmark aligns with standard industry technical interviews."}
                </p>
              </div>

              {/* Concrete Factor Milestones */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span className="flex items-center gap-1.5">
                    <Code2 size={12} className="text-[#10B981]" />
                    <span>Coding Practice (25% wt)</span>
                  </span>
                  <span className="text-[#F8FAFC] font-semibold">
                    {progress.problemsSolved} / 20 solved ({careerReadiness.problemScore}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={12} className="text-[#22D3EE]" />
                    <span>Courses (25% wt)</span>
                  </span>
                  <span className="text-[#F8FAFC] font-semibold">
                    {progress.coursesCompleted} / 2 done ({careerReadiness.courseScore}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span className="flex items-center gap-1.5">
                    <Layers size={12} className="text-[#8B5CF6]" />
                    <span>Projects (20% wt)</span>
                  </span>
                  <span className="text-[#F8FAFC] font-semibold">
                    {progress.projectsCompleted} / 2 done ({careerReadiness.projectScore}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-amber-400" />
                    <span>Profile (20% wt)</span>
                  </span>
                  <span className="text-[#F8FAFC] font-semibold">
                    {careerReadiness.profileCompleteness}%
                  </span>
                </div>
              </div>

              {/* Dynamic Next Step */}
              <div className="mt-3.5 pt-3 border-t border-white/5">
                <p className="text-[11px] text-[#94A3B8] mb-2.5">
                  <strong className="text-[#22D3EE]">Recommended next step: </strong>
                  {progress.problemsSolved < 5
                    ? "Solve algorithmic problems in the coding workspace to boost interview readiness."
                    : progress.coursesCompleted < 1
                    ? "Complete an academy track to strengthen your core software engineering foundations."
                    : "Review curated engineering positions and submit applications."}
                </p>
                <Link
                  to="/career"
                  className="block w-full text-center py-2 px-3 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] hover:bg-[#22D3EE]/20 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus:outline-none"
                >
                  View AI Career Guidance &rarr;
                </Link>
              </div>
            </div>

            {/* ======================================================
                STEP 6 — ACHIEVEMENTS & XP SHOWCASE
                ====================================================== */}
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-[#F59E0B]" />
                  <h3 className="font-bold text-sm text-[#F8FAFC]">Achievements</h3>
                </div>
                <Link
                  to="/achievements"
                  className="text-xs font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition"
                >
                  View All &rarr;
                </Link>
              </div>

              {achievements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
                  <Trophy size={20} className="mx-auto text-[#94A3B8] mb-1.5" />
                  <p className="text-xs font-semibold text-[#F8FAFC]">No badges registered</p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">
                    Complete milestones to earn platform badges.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[11px] text-[#94A3B8] flex items-center justify-between mb-1">
                    <span>Unlocked Badges</span>
                    <span className="font-bold text-[#F8FAFC]">
                      {unlockedAchievementsCount} / {achievements.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {achievements.slice(0, 4).map((ach) => (
                      <div
                        key={ach.id}
                        className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                          ach.unlocked
                            ? "bg-amber-500/[0.06] border-amber-500/30 text-[#F8FAFC]"
                            : "bg-white/[0.015] border-white/5 text-[#94A3B8] opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Award
                            size={16}
                            className={ach.unlocked ? "text-amber-400" : "text-slate-600"}
                          />
                          {ach.unlocked ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                              Unlocked
                            </span>
                          ) : (
                            <Lock size={11} className="text-slate-600" />
                          )}
                        </div>
                        <h4 className="text-[11px] font-bold truncate text-[#F8FAFC]">{ach.title}</h4>
                        <span className="text-[10px] font-bold text-amber-400 mt-1">
                          +{ach.rewardXp} XP
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================
                STEP 6 — RECENT ACTIVITY FEED
                ====================================================== */}
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-[#F8FAFC] flex items-center gap-2">
                  <Activity size={15} className="text-[#22D3EE]" />
                  <span>Recent Activity</span>
                </h3>
                <span className="text-[11px] text-[#94A3B8]">Latest events</span>
              </div>

              {recentActivities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-[#94A3B8]">
                  <Activity size={20} className="mx-auto text-[#94A3B8] mb-1.5" />
                  <p className="font-semibold text-[#F8FAFC]">No activity logged yet</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Solve problems or complete courses to see activity updates here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((act) => {
                    const meta = getActivityIconAndColor(act.activityType || act.activity_type);
                    const ActIcon = meta.icon;

                    return (
                      <div key={act.id} className="flex items-start gap-2.5 text-xs">
                        <div
                          className={`p-1.5 rounded-lg border ${meta.iconColor} shrink-0 mt-0.5`}
                        >
                          <ActIcon size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#F8FAFC] truncate text-[11px] sm:text-xs">
                            {act.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] mt-0.5">
                            <span>{meta.badge}</span>
                            <span>•</span>
                            <span>{formatActivityTime(act.createdAt || act.created_at)}</span>
                            {act.xpEarned > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-[#22D3EE] font-semibold">
                                  +{act.xpEarned} XP
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ======================================================
                NOTIFICATIONS WIDGET
                ====================================================== */}
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-[#F8FAFC] flex items-center gap-2">
                  <Bell size={15} className="text-[#8B5CF6]" />
                  <span>Notifications</span>
                </h3>
                <Link
                  to="/notifications"
                  className="text-xs text-[#22D3EE] hover:text-[#38BDF8] transition font-semibold"
                >
                  View all &rarr;
                </Link>
              </div>

              {recentNotifications.length === 0 ? (
                <p className="text-xs text-[#94A3B8] py-3 text-center">
                  You&apos;re completely caught up.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentNotifications.slice(0, 3).map((n) => (
                    <Link
                      key={n.id}
                      to={n.link || "/notifications"}
                      className="block p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#8B5CF6]/30 text-xs transition"
                    >
                      <p className="font-medium text-[#F8FAFC] truncate">{n.title}</p>
                      <p className="text-[10px] text-[#94A3B8] line-clamp-1 mt-0.5">
                        {n.message}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
