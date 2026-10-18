import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Lock,
  CheckCircle2,
  Sparkles,
  Award,
  Flame,
  Code2,
  BookOpen,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import FilterBar from "../components/FilterBar";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/ProtectedRoute";
import { getAchievements, getDashboard } from "../services/api";

const ICON_MAP = {
  Sparkles: Sparkles,
  Award: Award,
  CheckCircle2: CheckCircle2,
  Trophy: Trophy,
  Flame: Flame,
  Code2: Code2,
  BookOpen: BookOpen,
};

function formatUnlockDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Achievements() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [achievements, setAchievements] = useState([]);
  const [summary, setSummary] = useState({ unlocked: 0, total: 0 });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [achRes, dashRes] = await Promise.all([
        getAchievements(),
        getDashboard(),
      ]);

      if (achRes && achRes.achievements) {
        setAchievements(achRes.achievements);
        setSummary(achRes.summary || { unlocked: 0, total: achRes.achievements.length });
      }

      if (dashRes && dashRes.dashboard) {
        setDashboardData(dashRes.dashboard);
      }
    } catch (err) {
      console.error("Failed to load achievements data:", err);
      setError(err.message || "Failed to load achievements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  const progress = dashboardData?.progress || {
    totalXp: 0,
    level: 1,
    levelTitle: "Novice Coder",
    levelProgress: 0,
    xpForNextLevel: 100,
    xpForCurrentLevel: 0,
  };

  const levelInfo = {
    currentLevel: progress.level || 1,
    title: progress.levelTitle || "Novice Coder",
    currentXp: progress.totalXp || 0,
    nextLevelXp: progress.xpForNextLevel || 100,
    progressPercent: progress.levelProgress ?? 0,
  };

  const filterOptions = ["All", "Unlocked", "Locked"];

  const filteredBadges = achievements.filter((b) => {
    if (selectedFilter === "Unlocked") return b.unlocked;
    if (selectedFilter === "Locked") return !b.unlocked;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      {/* Header Banner */}
      <section className="border-b border-white/[0.08] bg-gradient-to-b from-[#0F172A] to-[#080B14] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3.5 py-1 text-xs font-semibold text-yellow-300">
                <Trophy size={15} />
                Student Gamification Center
              </div>
              <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white">
                Achievements & <span className="text-cyan-400">Career XP</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-400 max-w-2xl">
                Earn experience points for consistency, skill additions, profile milestones,
                and problem solving. Level up your student developer profile.
              </p>
            </div>

            {/* Level Progression Card */}
            <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-[#0b1329] to-[#070d19] p-6 lg:w-96 shrink-0 shadow-xl shadow-cyan-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Current Level
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    Level {levelInfo.currentLevel}
                  </h3>
                  <p className="text-xs text-slate-400">{levelInfo.title}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
                  {levelInfo.currentLevel}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{levelInfo.currentXp} XP</span>
                  <span className="text-cyan-400 font-bold">{levelInfo.nextLevelXp} XP (Level {levelInfo.currentLevel + 1})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500 text-right">
                  {Math.max(0, levelInfo.nextLevelXp - levelInfo.currentXp)} XP needed for Level {levelInfo.currentLevel + 1}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Badges Section */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">CareerCraft Badges</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unlocked {summary.unlocked} of {summary.total} badges
            </p>
          </div>

          <FilterBar
            options={filterOptions}
            active={selectedFilter}
            onChange={setSelectedFilter}
            size="xs"
          />
        </div>

        {/* Badges Grid */}
        {filteredBadges.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <Trophy className="mx-auto text-slate-600 mb-3" size={36} />
            <h3 className="text-base font-bold text-white">No achievements found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {selectedFilter === "Unlocked"
                ? "You haven't unlocked any badges in this category yet. Add skills or complete your profile to earn badges!"
                : "No badges match your selected filter."}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBadges.map((badge) => {
              const IconComponent = ICON_MAP[badge.icon] || Trophy;

              return (
                <div
                  key={badge.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                    badge.unlocked
                      ? "border-white/10 bg-white/[0.025] hover:border-cyan-400/40 hover:bg-white/[0.04]"
                      : "border-white/5 bg-white/[0.01] opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                          badge.unlocked
                            ? "bg-cyan-400/10 border border-cyan-400/20 text-cyan-400"
                            : "bg-white/5 border border-white/5 text-slate-600"
                        }`}
                      >
                        <IconComponent size={24} />
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white">{badge.title}</h4>
                        <Badge
                          size="xs"
                          variant={badge.unlocked ? "cyan" : "default"}
                          className="mt-1"
                        >
                          {badge.requirementType === "skill_count"
                            ? "Skills"
                            : badge.requirementType === "profile_complete"
                            ? "Profile"
                            : "Milestone"}
                        </Badge>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-cyan-400">
                      +{badge.rewardXp} XP
                    </span>
                  </div>

                  <p className="mt-3.5 text-xs text-slate-400 leading-relaxed">
                    {badge.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                    {badge.unlocked ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 size={13} />
                        <span>
                          {badge.unlockedAt
                            ? `Unlocked on ${formatUnlockDate(badge.unlockedAt)}`
                            : "Unlocked"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Lock size={13} />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Gamification Rules Summary */}
        <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <h3 className="font-bold text-base text-white">How to Earn XP on CareerCraft</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="font-bold text-cyan-400 mb-1">Add Skills</p>
              <p className="text-slate-300">+5 XP per skill</p>
              <p className="text-slate-500 mt-1">Build out your verified technical skill stack on your profile.</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="font-bold text-cyan-400 mb-1">First Step Badge</p>
              <p className="text-slate-300">+10 XP bonus</p>
              <p className="text-slate-500 mt-1">Unlock your very first achievement by adding your first skill.</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="font-bold text-cyan-400 mb-1">Skill Builder Badge</p>
              <p className="text-slate-300">+25 XP bonus</p>
              <p className="text-slate-500 mt-1">Expand your verified toolkit to 5 technical skills.</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="font-bold text-cyan-400 mb-1">Profile Complete</p>
              <p className="text-slate-300">+25 XP bonus</p>
              <p className="text-slate-500 mt-1">Complete your bio, college, and degree to stand out to recruiters.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
