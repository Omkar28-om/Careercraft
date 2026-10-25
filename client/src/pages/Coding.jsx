import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Trophy,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Terminal,
  BookOpen,
  RotateCcw,
  Loader2,
  Clock,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { getCodingProblems, getCodingSubmissions } from "../api";
import { useAuth } from "../context/AuthContext";
import { getSelectedDomain } from "../utils/learningPath";

const topicsList = [
  "All",
  "Array",
  "Hash Table",
  "Linked List",
  "String",
  "Tree",
  "Dynamic Programming",
  "Sliding Window",
  "Heap",
  "Stack",
];

export default function Coding() {
  const { user } = useAuth();
  const selectedDomain = getSelectedDomain();
  const [problems, setProblems] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const fetchProblems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCodingProblems();
      if (data && data.success && Array.isArray(data.problems)) {
        setProblems(data.problems);
      } else {
        setProblems([]);
      }
    } catch (err) {
      console.error("Failed to load problems:", err);
      setError("Unable to load coding problems from the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    if (user) {
      getCodingSubmissions()
        .then((res) => {
          if (res && res.success && Array.isArray(res.submissions)) {
            setUserSubmissions(res.submissions);
          }
        })
        .catch(() => {
          // Non-critical, ignore if unauthenticated or error
        });
    } else {
      setUserSubmissions([]);
    }
  }, [user]);

  // Derive per-problem user status
  const problemStatusMap = useMemo(() => {
    const map = {};
    for (const sub of userSubmissions) {
      if (!map[sub.problemId]) {
        map[sub.problemId] = sub.status;
      } else if (sub.status === "accepted") {
        map[sub.problemId] = "accepted";
      }
    }
    return map;
  }, [userSubmissions]);

  const solvedCount = useMemo(() => {
    return Object.values(problemStatusMap).filter((s) => s === "accepted").length;
  }, [problemStatusMap]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const tags = Array.isArray(p.tags) ? p.tags : [];
      const category = p.category || "";

      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        tags.some((t) => t.toLowerCase().includes(q));

      const matchesDifficulty =
        selectedDifficulty === "All" || p.difficulty === selectedDifficulty;

      const matchesTopic =
        selectedTopic === "All" ||
        tags.some((t) => t.toLowerCase() === selectedTopic.toLowerCase()) ||
        category.toLowerCase() === selectedTopic.toLowerCase();

      const userStatus = problemStatusMap[p.id];
      const isSolved = userStatus === "accepted";
      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Solved" && isSolved) ||
        (selectedStatus === "Unsolved" && !isSolved);

      return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
    });
  }, [problems, searchQuery, selectedDifficulty, selectedTopic, selectedStatus, problemStatusMap]);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col selection:bg-[#8B5CF6]/30 selection:text-[#F8FAFC]">
      <Navbar />

      {/* Hero / Stat Banner */}
      <div className="border-b border-white/10 bg-gradient-to-b from-[#111827] to-[#080B14] py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3.5 py-1 text-xs font-semibold text-[#C4B5FD]">
                <Terminal size={14} />
                CareerCraft Coding Engine
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-[#F8FAFC]">
                Problem <span className="text-[#8B5CF6]">Workspace</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#94A3B8] max-w-xl">
                {selectedDomain
                  ? `Build problem-solving skills for ${selectedDomain} with guided practice, code evaluation, and progress tracking.`
                  : "Build problem-solving skills with guided practice, code evaluation, and progress tracking."}
              </p>
              {selectedDomain && <Link to="/domains" className="mt-3 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200">Change learning domain <ArrowRight size={14} className="ml-1" /></Link>}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-center">
                <div className="flex items-center justify-center text-orange-400 mb-1">
                  <Flame size={18} />
                </div>
                <div className="text-xl font-bold text-white">7 Days</div>
                <div className="text-[11px] text-slate-400">Current Streak</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-center">
                <div className="flex items-center justify-center text-yellow-400 mb-1">
                  <Trophy size={18} />
                </div>
                <div className="text-xl font-bold text-white">420 XP</div>
                <div className="text-[11px] text-slate-400">Coding XP</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-center">
                <div className="flex items-center justify-center text-emerald-400 mb-1">
                  <CheckCircle2 size={18} />
                </div>
                <div className="text-xl font-bold text-white">
                  {solvedCount} / {problems.length || 8}
                </div>
                <div className="text-[11px] text-slate-400">Solved</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <div className="flex items-center justify-center text-cyan-400 mb-1">
                  <Sparkles size={18} />
                </div>
                <div className="text-xl font-bold text-white">
                  {problems.length > 0 ? "100%" : "—"}
                </div>
                <div className="text-[11px] text-slate-400">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search problems by title, tag, or algorithm..."
              className="w-full sm:max-w-md"
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <FilterBar
                options={["All", "Solved", "Unsolved"]}
                active={selectedStatus}
                onChange={setSelectedStatus}
                size="xs"
              />
            </div>
          </div>

          {/* Difficulty & Topic Filter Bars */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-y border-white/10 py-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Difficulty:</span>
              <FilterBar
                options={["All", "Easy", "Medium", "Hard"]}
                active={selectedDifficulty}
                onChange={setSelectedDifficulty}
                size="xs"
              />
            </div>

            <div className="hidden sm:block h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs text-slate-400 font-medium shrink-0">Topic:</span>
              <FilterBar
                options={topicsList}
                active={selectedTopic}
                onChange={setSelectedTopic}
                size="xs"
              />
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-cyan-400">
                <Loader2 size={13} className="animate-spin" />
                Loading problems from database...
              </span>
            ) : (
              <>
                Showing <strong className="text-white">{filteredProblems.length}</strong> problems
              </>
            )}
          </span>
          <span className="text-slate-500">Pick any challenge to open the editor</span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-cyan-400" />
            <p className="mt-3 text-sm text-slate-400">Fetching challenges from PostgreSQL...</p>
          </div>
        )}

        {/* Error State with Retry */}
        {!isLoading && error && (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                iconPosition="left"
                onClick={fetchProblems}
              >
                Retry Loading
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredProblems.length === 0 && (
          <EmptyState
            title="No problems found"
            description="No coding challenges match your search filters. Try clearing some criteria."
            actionLabel="Reset All Filters"
            onAction={() => {
              setSearchQuery("");
              setSelectedDifficulty("All");
              setSelectedTopic("All");
              setSelectedStatus("All");
            }}
            className="mt-6"
          />
        )}

        {/* Problem Set Table */}
        {!isLoading && !error && filteredProblems.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-[60px_1fr_130px_110px_120px_130px] items-center border-b border-white/10 bg-white/[0.03] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Status</span>
              <span>Title</span>
              <span>Difficulty</span>
              <span>Category</span>
              <span>Solutions</span>
              <span className="text-right">Action</span>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-white/5">
              {filteredProblems.map((p, idx) => {
                const targetUrl = `/coding/problems/${p.slug}`;
                const tags = Array.isArray(p.tags) ? p.tags : [];
                const userStatus = problemStatusMap[p.id];
                const isSolved = userStatus === "accepted";
                const isAttempted = Boolean(userStatus && userStatus !== "accepted");

                return (
                  <div
                    key={p.id || p.slug}
                    className="group transition-colors duration-150 hover:bg-white/[0.03] p-4 sm:px-6"
                  >
                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-[60px_1fr_130px_110px_120px_130px] items-center">
                      {/* Status */}
                      <div>
                        {isSolved ? (
                          <CheckCircle2 size={18} className="text-emerald-400" />
                        ) : isAttempted ? (
                          <Clock size={18} className="text-amber-400" />
                        ) : (
                          <Circle size={18} className="text-slate-600" />
                        )}
                      </div>

                      {/* Title & Tags */}
                      <div>
                        <Link
                          to={targetUrl}
                          className="font-semibold text-white transition hover:text-cyan-400 flex items-center gap-2"
                        >
                          <span>{idx + 1}. {p.title}</span>
                          {p.slug === "two-sum" && (
                            <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
                              Featured
                            </span>
                          )}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Difficulty */}
                      <div>
                        <Badge variant={p.difficulty}>{p.difficulty}</Badge>
                      </div>

                      {/* Category */}
                      <div className="text-xs text-slate-400 font-medium">
                        {p.category || "General"}
                      </div>

                      {/* Solutions / Status text */}
                      <div className="text-xs text-slate-400">
                        {isSolved ? (
                          <span className="text-emerald-400 font-medium">Solved</span>
                        ) : isAttempted ? (
                          <span className="text-amber-400 font-medium">Attempted</span>
                        ) : (
                          <span>Available</span>
                        )}
                      </div>

                      {/* Action */}
                      <div className="text-right">
                        <Link
                          to={targetUrl}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                        >
                          <span>Solve</span>
                          <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="flex flex-col gap-3 md:hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isSolved ? (
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                          ) : isAttempted ? (
                            <Clock size={16} className="text-amber-400 shrink-0" />
                          ) : (
                            <Circle size={16} className="text-slate-600 shrink-0" />
                          )}
                          <Link
                            to={targetUrl}
                            className="text-sm font-bold text-white hover:text-cyan-400"
                          >
                            {idx + 1}. {p.title}
                          </Link>
                        </div>
                        <Badge variant={p.difficulty} size="xs">
                          {p.difficulty}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs text-slate-400">
                        <span>{p.category || "General"}</span>
                        <Link
                          to={targetUrl}
                          className="inline-flex items-center gap-1 font-semibold text-cyan-400"
                        >
                          Solve <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Learning Roadmap CTA */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-blue-900/20 via-cyan-900/10 to-emerald-900/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Need to brush up on DSA fundamentals first?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Explore curated structured courses in our learning catalog.
              </p>
            </div>
          </div>
          <Link to="/courses" className="shrink-0 w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full sm:w-auto">
              Browse Courses
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
