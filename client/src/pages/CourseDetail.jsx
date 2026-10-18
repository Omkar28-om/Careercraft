import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  FileText,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  GraduationCap,
  Layers,
  ArrowLeft,
  Share2,
  CircleHelp,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { getCourse, enrollCourse } from "../api";
import { getLocalCourseQuestions } from "../data/localCourses";
import { useAuth } from "../context/AuthContext";

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // Accordion open/close state for sections
  const [expandedSections, setExpandedSections] = useState({});

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCourse(slug);
      if (res?.success && res?.course) {
        setCourse(res.course);
        // Expand all sections by default
        const initExpanded = {};
        res.course.sections?.forEach((sec) => {
          initExpanded[sec.id] = true;
        });
        setExpandedSections(initExpanded);
      } else {
        setError(res?.message || "Course not found");
      }
    } catch (err) {
      console.error("Failed to load course details:", err);
      setError(err?.message || "Failed to load course details.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/courses/${course.slug}` } });
      return;
    }
    if (!course?.id) return;

    try {
      setEnrolling(true);
      const res = await enrollCourse(course.id);
      if (res?.success) {
        setEnrollSuccess(true);
        // Refresh course to get authenticated enrollment status
        await fetchCourseData();
        setTimeout(() => setEnrollSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
      alert(err?.message || "Failed to enroll in this course.");
    } finally {
      setEnrolling(false);
    }
  };

  // Find next lesson to continue
  const nextLessonSlug = useMemo(() => {
    if (!course?.sections) return null;
    let firstIncomplete = null;
    let firstEver = null;

    for (const sec of course.sections) {
      for (const les of sec.lessons) {
        if (!firstEver) firstEver = les.slug;
        if (!les.completed && !firstIncomplete) {
          firstIncomplete = les.slug;
          break;
        }
      }
      if (firstIncomplete) break;
    }
    return firstIncomplete || firstEver;
  }, [course]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 size={36} className="animate-spin text-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">Loading course curriculum...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Course Not Found</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {error || "The requested course could not be located in our learning library."}
          </p>
          <Link to="/courses" className="mt-6">
            <Button variant="primary" size="sm" icon={ArrowLeft} iconPosition="left">
              Back to Course Catalog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const levelCapitalized =
    course.level?.charAt(0).toUpperCase() + course.level?.slice(1) || "Beginner";

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#22D3EE] transition"
          >
            <ArrowLeft size={14} />
            <span>Back to All Courses</span>
          </Link>
        </div>

        {/* Course Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B14] p-6 sm:p-10 backdrop-blur-xl">
          <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Cols: Course Overview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-400/20">
                  {course.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    course.level === "beginner"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : course.level === "advanced"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {levelCapitalized}
                </span>
                {course.isEnrolled && (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {course.status === "completed" ? "Completed" : "Enrolled"}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {course.description}
              </p>

              {/* Course Meta Ribbon */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 text-xs">
                    {course.instructorName ? course.instructorName.charAt(0) : "I"}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{course.instructorName}</p>
                    <p className="text-[10px] text-slate-500">Instructor</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="text-cyan-400" />
                  <span>{Math.round((course.durationMinutes || 0) / 60)} Hours Total</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <BookOpen size={15} className="text-cyan-400" />
                  <span>{course.lessonCount} Structured Lessons</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Layers size={15} className="text-cyan-400" />
                  <span>{course.sections?.length || 0} Modules</span>
                </div>
              </div>

              {/* Enrolled Progress Bar */}
              {course.isEnrolled && (
                <div className="pt-4 mt-2">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">Your Course Progress</span>
                    <span className="font-bold text-cyan-400">{course.progressPercent}% Completed</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Enrollment Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-6 backdrop-blur-xl shadow-2xl space-y-4">
              {course.thumbnailUrl && (
                <div className="relative h-40 rounded-xl overflow-hidden mb-4 border border-white/10">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
              )}

              {enrollSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Enrolled successfully! Ready to start learning.</span>
                </div>
              )}

              {course.isEnrolled ? (
                <div className="space-y-3">
                  <Link
                    to={nextLessonSlug ? `/courses/${course.slug}/lessons/${nextLessonSlug}` : "#"}
                    className="block"
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      {course.status === "completed" ? "Review All Lessons" : "Continue Learning"}
                    </Button>
                  </Link>
                  <p className="text-[11px] text-center text-slate-400">
                    {course.status === "completed"
                      ? "Course 100% completed. +25 XP awarded!"
                      : "Pick up where you left off."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Enrolling...</span>
                      </span>
                    ) : (
                      "Enroll Now (Free)"
                    )}
                  </Button>
                  <p className="text-[11px] text-center text-slate-400">
                    Instant access to all modules, lesson materials & XP.
                  </p>
                </div>
              )}

              <div className="border-t border-white/5 pt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Access:</span>
                  <span className="font-semibold text-white">Full Lifetime Access</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CareerCraft XP:</span>
                  <span className="font-semibold text-cyan-400">+2 XP / lesson + 25 XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Certificate:</span>
                  <span className="font-semibold text-white">Earned on Completion</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Curriculum / Syllabus */}
        <div className="mt-10">
          <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen size={20} className="text-cyan-400" />
                <span>Course Curriculum</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {course.sections?.length || 0} sections • {course.lessonCount} total lessons
              </p>
            </div>
            {getLocalCourseQuestions(course.slug).length > 0 && (
              <Link to={`/courses/${course.slug}/quiz`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2.5 text-sm font-bold text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
                <CircleHelp size={16} /> Practice course quiz
              </Link>
            )}
          </div>

          <div className="space-y-4">
            {course.sections?.map((section, sIndex) => {
              const isExpanded = Boolean(expandedSections[section.id]);
              const completedInSection = section.lessons.filter((l) => l.completed).length;

              return (
                <div
                  key={section.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition"
                >
                  {/* Section Accordion Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 font-bold text-xs">
                        {sIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-white">
                          {section.title}
                        </h3>
                        {section.description && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {section.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">
                        {completedInSection} / {section.lessons.length} done
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={18} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Section Lessons List */}
                  {isExpanded && (
                    <div className="border-t border-white/5 divide-y divide-white/5 bg-black/20">
                      {section.lessons.map((lesson, lIndex) => {
                        const canAccess = course.isEnrolled || lesson.isPreview;

                        const LessonContent = (
                          <div className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.03] transition group">
                            <div className="flex items-center gap-3.5 min-w-0">
                              {lesson.completed ? (
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                              ) : canAccess ? (
                                <PlayCircle size={16} className="text-cyan-400 shrink-0" />
                              ) : (
                                <Lock size={15} className="text-slate-600 shrink-0" />
                              )}

                              <div className="min-w-0">
                                <p
                                  className={`text-xs sm:text-sm font-semibold truncate ${
                                    lesson.completed
                                      ? "text-slate-300 line-through decoration-slate-600"
                                      : canAccess
                                      ? "text-white group-hover:text-cyan-300"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {lesson.lessonOrder}. {lesson.title}
                                </p>
                                <span className="text-[10px] text-slate-500 capitalize">
                                  {lesson.lessonType} • {lesson.durationMinutes} mins
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              {lesson.isPreview && !course.isEnrolled && (
                                <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-400/20">
                                  Preview
                                </span>
                              )}

                              {canAccess ? (
                                <span className="text-xs text-cyan-400 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
                                  <span>{lesson.completed ? "Review" : "Start"}</span>
                                  <ArrowRight size={12} />
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">Locked</span>
                              )}
                            </div>
                          </div>
                        );

                        return canAccess ? (
                          <Link
                            key={lesson.id}
                            to={`/courses/${course.slug}/lessons/${lesson.slug}`}
                            className="block"
                          >
                            {LessonContent}
                          </Link>
                        ) : (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              alert("Please enroll in this course to access this lesson.");
                            }}
                            className="cursor-pointer"
                          >
                            {LessonContent}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
