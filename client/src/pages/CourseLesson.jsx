import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Clock,
  PlayCircle,
  FileText,
  AlertCircle,
  Loader2,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Home,
  Check,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { getCourseLesson, completeCourseLesson, getCourse } from "../api";
import { useAuth } from "../context/AuthContext";

function renderInlineLinks(text) {
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const nodes = [];
  let cursor = 0;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    nodes.push(
      <a
        key={`${match.index}-${match[2]}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-200"
      >
        {match[1]}
      </a>
    );
    cursor = linkPattern.lastIndex;
  }

  if (cursor === 0) return text;
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export default function CourseLesson() {
  const { slug, lessonSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lessonData, setLessonData] = useState(null);
  const [courseOutline, setCourseOutline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionNotice, setCompletionNotice] = useState(null);

  const fetchLesson = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCompletionNotice(null);

      const [lessonRes, courseRes] = await Promise.all([
        getCourseLesson(slug, lessonSlug),
        getCourse(slug),
      ]);

      if (lessonRes?.success && lessonRes?.lesson) {
        setLessonData(lessonRes);
        setCompleted(Boolean(lessonRes.lesson.completed));
      } else {
        setError(lessonRes?.message || "Lesson not found");
      }

      if (courseRes?.success && courseRes?.course) {
        setCourseOutline(courseRes.course);
      }
    } catch (err) {
      console.error("Failed to load lesson:", err);
      setError(err?.message || "Failed to load lesson content.");
    } finally {
      setLoading(false);
    }
  }, [slug, lessonSlug]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const handleComplete = async () => {
    if (!lessonData?.lesson?.id) return;
    if (completed) return; // Prevent repeated action

    try {
      setCompleting(true);
      const res = await completeCourseLesson(lessonData.lesson.id);
      if (res?.success) {
        setCompleted(true);
        if (res.courseNewlyCompleted) {
          setCompletionNotice({
            type: "course",
            title: "Course Completed! 🎉",
            xp: res.awardedXp,
            message: "Congratulations! You have finished all lessons in this course and earned +25 XP bonus!",
          });
        } else {
          setCompletionNotice({
            type: "lesson",
            title: "Lesson Completed! ⭐",
            xp: res.awardedXp,
            message: res.wasAlreadyCompleted
              ? "Lesson was already completed."
              : `Great job! You earned +${res.awardedXp} XP for completing this lesson.`,
          });
        }

        // Refresh outline so checkmark updates in syllabus
        getCourse(slug).then((res) => {
          if (res?.success && res?.course) {
            setCourseOutline(res.course);
          }
        });
      }
    } catch (err) {
      console.error("Failed to complete lesson:", err);
      alert(err?.message || "Failed to complete lesson.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 size={36} className="animate-spin text-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">Loading lesson content...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Lesson Access Error</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {error || "Unable to display this lesson."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to={`/courses/${slug}`}>
              <Button variant="secondary" size="sm" icon={ArrowLeft} iconPosition="left">
                Course Details
              </Button>
            </Link>
            <Link to="/courses">
              <Button variant="outline" size="sm">
                All Courses
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { lesson, course, section, navigation, isEnrolled } = lessonData;

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-white transition flex items-center gap-1">
            <Home size={13} />
            <span>Home</span>
          </Link>
          <span>/</span>
          <Link to="/courses" className="hover:text-white transition">
            Courses
          </Link>
          <span>/</span>
          <Link to={`/courses/${course.slug}`} className="hover:text-cyan-400 transition truncate max-w-xs">
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-white font-medium truncate max-w-xs">{lesson.title}</span>
        </nav>

        {/* 2-Column Learning Layout: Lesson View + Sidebar Syllabus */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Main Lesson Content (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Box */}
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B14] p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                      Module {section.sectionOrder}: {section.title}
                    </span>
                    {lesson.isPreview && !isEnrolled && (
                      <Badge variant="cyan" size="xs">
                        Free Preview
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    {lesson.title}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={14} className="text-cyan-400" />
                    <span>{lesson.durationMinutes} mins</span>
                  </div>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-400 capitalize">{lesson.lessonType}</span>
                </div>
              </div>

              {/* Completion Notification Banner */}
              {completionNotice && (
                <div
                  className={`mt-6 rounded-2xl border p-4 flex items-center justify-between gap-4 animate-in fade-in ${
                    completionNotice.type === "course"
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                      : "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{completionNotice.title}</h4>
                      <p className="text-xs opacity-90">{completionNotice.message}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold text-white shrink-0">
                    +{completionNotice.xp} XP
                  </span>
                </div>
              )}
            </div>

            {/* Video Player if video_url exists */}
            {lesson.videoUrl && (
              <div className="rounded-2xl border border-white/10 bg-black overflow-hidden shadow-2xl">
                <div className="aspect-video w-full">
                  <iframe
                    src={lesson.videoUrl}
                    title={lesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Article Content Display */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-10 shadow-xl">
              <div className="prose prose-invert max-w-none space-y-4 text-slate-300 leading-relaxed text-sm sm:text-base">
                {lesson.content ? (
                  lesson.content.split("\n\n").map((paragraph, index) => {
                    // Headings
                    if (paragraph.startsWith("# ")) {
                      return (
                        <h2 key={index} className="text-2xl font-black text-white pt-4 pb-2 border-b border-white/10">
                          {paragraph.replace("# ", "")}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith("### ")) {
                      return (
                        <h3 key={index} className="text-lg font-bold text-cyan-300 pt-3">
                          {paragraph.replace("### ", "")}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith("## ")) {
                      return (
                        <h3 key={index} className="text-xl font-bold text-white pt-3">
                          {paragraph.replace("## ", "")}
                        </h3>
                      );
                    }
                    // Code Blocks
                    if (paragraph.startsWith("```")) {
                      const lines = paragraph.split("\n");
                      const language = lines[0].replace("```", "").trim();
                      const code = lines.slice(1, -1).join("\n");
                      return (
                        <div key={index} className="my-4 rounded-xl border border-white/10 bg-[#070b14] p-4 overflow-x-auto">
                          {language && (
                            <div className="text-[10px] font-mono text-cyan-400 mb-2 uppercase tracking-wider">
                              {language}
                            </div>
                          )}
                          <pre className="font-mono text-xs sm:text-sm text-cyan-100 leading-relaxed">
                            <code>{code}</code>
                          </pre>
                        </div>
                      );
                    }
                    // Bullet Lists
                    if (paragraph.startsWith("- ")) {
                      const items = paragraph.split("\n").filter((l) => l.startsWith("- "));
                      return (
                        <ul key={index} className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
                          {items.map((item, i) => (
                            <li key={i}>{renderInlineLinks(item.replace("- ", ""))}</li>
                          ))}
                        </ul>
                      );
                    }
                    // Regular paragraph
                    return (
                      <p key={index} className="text-slate-300 leading-relaxed">
                        {renderInlineLinks(paragraph)}
                      </p>
                    );
                  })
                ) : (
                  <p className="text-slate-500 italic">No textual content for this lesson.</p>
                )}
              </div>
            </div>

            {/* Completion & Navigation Controls */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Prev Lesson */}
              {navigation.previousLesson ? (
                <Link
                  to={`/courses/${course.slug}/lessons/${navigation.previousLesson.slug}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    icon={ChevronLeft}
                    iconPosition="left"
                  >
                    Previous Lesson
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {/* Mark Complete CTA */}
              {isEnrolled ? (
                <Button
                  variant={completed ? "outline" : "primary"}
                  size="md"
                  onClick={handleComplete}
                  disabled={completing || completed}
                  className={completed ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 cursor-default" : ""}
                  icon={completed ? Check : Sparkles}
                  iconPosition="left"
                >
                  {completing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Progress...</span>
                    </span>
                  ) : completed ? (
                    "Completed (+2 XP)"
                  ) : (
                    "Mark Lesson Complete"
                  )}
                </Button>
              ) : (
                <Link to={`/courses/${course.slug}`}>
                  <Button variant="primary" size="sm">
                    Enroll to Track Progress
                  </Button>
                </Link>
              )}

              {/* Next Lesson */}
              {navigation.nextLesson ? (
                <Link
                  to={`/courses/${course.slug}/lessons/${navigation.nextLesson.slug}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    Next Lesson
                  </Button>
                </Link>
              ) : (
                <Link to={`/courses/${course.slug}`} className="w-full sm:w-auto">
                  <Button variant="secondary" size="sm">
                    Course Overview
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar Syllabus (1 Col) */}
          <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-[#0B0F19] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen size={16} className="text-cyan-400" />
                <span>Course Syllabus</span>
              </h3>
              {courseOutline && (
                <span className="text-[11px] font-semibold text-cyan-400">
                  {courseOutline.progressPercent}%
                </span>
              )}
            </div>

            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {courseOutline?.sections?.map((sec, sIdx) => (
                <div key={sec.id} className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {sIdx + 1}. {sec.title}
                  </p>

                  <div className="space-y-1">
                    {sec.lessons.map((les) => {
                      const isCurrent = les.slug === lessonSlug;

                      return (
                        <Link
                          key={les.id}
                          to={`/courses/${course.slug}/lessons/${les.slug}`}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                            isCurrent
                              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-semibold"
                              : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {les.completed ? (
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            ) : (
                              <div
                                className={`h-2 w-2 rounded-full shrink-0 ${
                                  isCurrent ? "bg-cyan-400" : "bg-slate-600"
                                }`}
                              />
                            )}
                            <span className="truncate">{les.title}</span>
                          </div>

                          <span className="text-[10px] text-slate-500 shrink-0">
                            {les.durationMinutes}m
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
