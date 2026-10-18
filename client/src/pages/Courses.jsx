import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Clock,
  BookOpen,
  GraduationCap,
  PlayCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { getCourses } from "../api";
import { getLocalCourseQuestions } from "../data/localCourses";
import { getSelectedDomain, setSelectedDomain } from "../utils/learningPath";

export default function Courses() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || getSelectedDomain() || "All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCourses();
      if (res?.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError(err?.message || "Failed to load courses from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Dynamic categories extracted from real course data
  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["All", ...Array.from(set)];
  }, [courses]);

  // Client-side filtering
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery === "" ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.shortDescription &&
          course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.instructorName &&
          course.instructorName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" || course.category === selectedCategory;

      const matchesDifficulty =
        selectedDifficulty === "All" ||
        course.level?.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [courses, searchQuery, selectedCategory, selectedDifficulty]);

  const enrolledCount = useMemo(() => {
    return courses.filter((c) => c.isEnrolled).length;
  }, [courses]);
  const practiceCourse = filteredCourses.find((course) => getLocalCourseQuestions(course.slug).length > 0);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedDomain(category === "All" ? "" : category);
  };

  const completedCount = useMemo(() => {
    return courses.filter((c) => c.enrollmentStatus === "completed").length;
  }, [courses]);

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
                  CareerCraft Academy
                </span>
                <span className="text-xs text-slate-400">Production-Ready Curriculum</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
                Master Modern Computer Science
              </h1>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Structured, hands-on modules designed for engineering students. Learn programming fundamentals, databases, systems, and algorithms with interactive lesson progression and verified CareerCraft XP.
              </p>
            </div>

            {/* Quick Learning Stats */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/80 p-4 text-center">
                <p className="text-2xl font-black text-[#22D3EE]">{courses.length}</p>
                <p className="text-xs text-slate-400">Total Courses</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/80 p-4 text-center">
                <p className="text-2xl font-black text-[#10B981]">{enrolledCount}</p>
                <p className="text-xs text-slate-400">Your Enrollments</p>
              </div>
            </div>
          </div>
        </div>

        {courses.some((course) => course.isLocalCatalog) && (
          <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3 text-xs leading-5 text-cyan-100/80">
            The course API is unavailable, so you are viewing the built-in starter catalog. Course lessons and progress are saved in this browser until the server is connected.
          </div>
        )}

        {selectedCategory !== "All" && (
          <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-violet-300/15 bg-violet-300/[0.04] p-5 sm:flex-row sm:items-center" aria-label="Selected domain learning path">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">Your learning path · {selectedCategory}</p>
              <p className="mt-1 text-sm text-slate-300">Choose a course, practice its questions, then build a project in this domain.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {practiceCourse && <Link to={`/courses/${practiceCourse.slug}/quiz`} className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-300/10">Practice questions</Link>}
              <Link to="/projects" className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08]">Build a related project</Link>
            </div>
          </section>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-rose-400 shrink-0" size={20} />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
            <button
              onClick={fetchCourses}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Category Horizontal Filter */}
        <div className="mt-8 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
          <FilterBar
            options={categories}
            active={selectedCategory}
            onChange={handleCategoryChange}
            size="sm"
          />
        </div>

        {/* Search and Difficulty Filter Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search courses, topics, instructors..."
            className="w-full sm:max-w-md"
          />

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium">Level:</span>
            <FilterBar
              options={["All", "Beginner", "Intermediate", "Advanced"]}
              active={selectedDifficulty}
              onChange={setSelectedDifficulty}
              size="xs"
            />
          </div>
        </div>

        {/* Courses Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{selectedCategory === "All" ? "All Courses" : selectedCategory}</span>
              <span className="text-xs font-normal text-slate-400">
                ({filteredCourses.length} available)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
              <p className="text-sm">Loading course library...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              title="No courses match your criteria"
              description="Try adjusting your search terms or filters to find available curriculums."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery("");
                handleCategoryChange("All");
                setSelectedDifficulty("All");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const levelCapitalized =
                  course.level?.charAt(0).toUpperCase() + course.level?.slice(1) || "Beginner";

                return (
                  <div
                    key={course.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] transition-all duration-300 hover:-translate-y-1 hover:border-[#8B5CF6]/50 hover:bg-[#1E293B]/60 hover:shadow-xl hover:shadow-[#8B5CF6]/10"
                  >
                    <div>
                      {/* Course Image / Visual Banner */}
                      <div className="relative h-44 overflow-hidden bg-slate-900">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-blue-600/30 via-cyan-600/20 to-slate-900 flex items-center justify-center">
                            <BookOpen size={40} className="text-cyan-400/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-black/30" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-white/10">
                            {course.category}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                            course.level === "beginner"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : course.level === "advanced"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}>
                            {levelCapitalized}
                          </span>
                        </div>

                        {course.isEnrolled && (
                          <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/90 px-2 py-0.5 text-[10px] font-bold text-slate-950 backdrop-blur-md shadow-md">
                              <CheckCircle2 size={12} />
                              {course.enrollmentStatus === "completed" ? "Completed" : "Enrolled"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <Link to={`/courses/${course.slug}`}>
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                            {course.title}
                          </h3>
                        </Link>

                        <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {course.shortDescription || course.description}
                        </p>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                          <div>
                            <p className="font-semibold text-white text-xs">{course.instructorName}</p>
                            <p className="text-[10px] text-slate-500">Instructor</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-slate-300 justify-end">
                              <Clock size={12} className="text-cyan-400" />
                              <span>{Math.round(course.durationMinutes / 60)} hrs</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 text-[11px] justify-end">
                              <BookOpen size={11} />
                              <span>{course.lessonCount} lessons</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar if Enrolled */}
                        {course.isEnrolled && (
                          <div className="mt-4">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-400">Progress</span>
                              <span className="font-bold text-cyan-400">{course.progressPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                style={{ width: `${course.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="space-y-2 p-5 pt-0">
                      <Link to={`/courses/${course.slug}`} className="block">
                        <Button
                          variant={course.enrollmentStatus === "completed" ? "outline" : course.isEnrolled ? "primary" : "secondary"}
                          size="sm"
                          className="w-full"
                          icon={ArrowRight}
                          iconPosition="right"
                        >
                          {course.enrollmentStatus === "completed"
                            ? "Review Course"
                            : course.isEnrolled
                            ? "Continue Learning"
                            : "Start Learning"}
                        </Button>
                      </Link>
                      {getLocalCourseQuestions(course.slug).length > 0 && (
                        <Link to={`/courses/${course.slug}/quiz`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-bold text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
                          <Sparkles size={14} /> Practice course questions
                        </Link>
                      )}
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
