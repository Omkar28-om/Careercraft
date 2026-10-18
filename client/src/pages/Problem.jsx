import { useState, useEffect, Component } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Lightbulb,
  Play,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  Clock,
  ThumbsUp,
  Terminal,
  Circle,
  AlertCircle,
  Loader2,
  RotateCcw,
  FileQuestion,
  Sparkles,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import {
  getCodingProblem,
  submitCodingProblem,
  getCodingProgress,
  getCodingSubmissions,
} from "../api";
import { useAuth } from "../context/AuthContext";

class EditorErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Monaco Editor error caught by boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col p-4 bg-[#0a0f1d] text-slate-300">
          <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-semibold">
            <AlertCircle size={14} />
            <span>Standard code editor fallback</span>
          </div>
          <textarea
            className="flex-1 w-full bg-[#080B14] border border-white/10 rounded-lg p-3 text-sm font-mono text-cyan-200 outline-none focus:border-cyan-400/50 resize-none"
            value={this.props.value}
            onChange={(e) => this.props.onChange && this.props.onChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

const DEFAULT_STARTER_CODE = {
  javascript: `/**\n * Solution\n */\nfunction solution() {\n    // Write your code here\n}\n`,
  python: `# Solution\ndef solution():\n    # Write your code here\n    pass\n`,
  java: `class Solution {\n    // Write your code here\n}\n`,
  cpp: `class Solution {\npublic:\n    // Write your code here\n};\n`,
};

const languageMap = {
  java: "java",
  python: "python",
  javascript: "javascript",
  cpp: "cpp",
};

export default function Problem() {
  const { slug: paramSlug, id: paramId } = useParams();
  const slug = paramSlug || paramId || "two-sum";
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("description"); // description | solutions | submissions | discussions
  const [mobileTab, setMobileTab] = useState("problem"); // 'problem' | 'editor' | 'console'
  const [language, setLanguage] = useState("javascript");
  const [sourceCode, setSourceCode] = useState("");
  const [showHint, setShowHint] = useState(false);

  const [consoleResult, setConsoleResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [progress, setProgress] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Load problem from PostgreSQL API
  const fetchProblemData = async () => {
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const data = await getCodingProblem(slug);
      if (data && data.success && data.problem) {
        const prob = data.problem;
        setProblem(prob);

        // Map starter code safely from JSONB
        const starter =
          prob.starterCode?.[language] ||
          DEFAULT_STARTER_CODE[language] ||
          "";
        setSourceCode(starter);
      } else {
        setIsNotFound(true);
        setError(`Problem "${slug}" not found in catalog.`);
      }
    } catch (err) {
      console.error("Failed to load problem:", err);
      const is404 =
        err?.response?.status === 404 ||
        err?.status === 404 ||
        err?.message?.includes("404") ||
        err?.response?.data?.message?.toLowerCase?.()?.includes("not found");

      if (is404) {
        setIsNotFound(true);
        setError(err.response?.data?.message || `Problem "${slug}" could not be found.`);
      } else {
        setIsNotFound(false);
        setError(err.response?.data?.message || err.message || "Unable to load coding problem from the server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblemData();
  }, [slug]);

  // Load user progress for this problem
  useEffect(() => {
    if (problem?.id && user) {
      getCodingProgress(problem.id)
        .then((res) => {
          if (res && res.success && res.progress) {
            setProgress(res.progress);
          }
        })
        .catch(() => {
          setProgress(null);
        });
    } else {
      setProgress(null);
    }
  }, [problem?.id, user]);

  // Load submissions history when tab is clicked
  useEffect(() => {
    if (activeTab === "submissions" && problem?.id && user) {
      setSubmissionsLoading(true);
      getCodingSubmissions({ problemId: problem.id })
        .then((res) => {
          if (res && res.success && Array.isArray(res.submissions)) {
            setSubmissions(res.submissions);
          }
        })
        .catch(() => {
          setSubmissions([]);
        })
        .finally(() => {
          setSubmissionsLoading(false);
        });
    }
  }, [activeTab, problem?.id, user]);

  // Handle language switch and load corresponding starter code
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (problem) {
      const code =
        problem.starterCode?.[newLang] ||
        DEFAULT_STARTER_CODE[newLang] ||
        "";
      setSourceCode(code);
    }
  };

  // Run: Show sample test cases without server-side execution (reserved for Judge0 in STEP 08.3)
  const handleRun = () => {
    setIsEvaluating(true);
    setConsoleResult(null);

    setTimeout(() => {
      setIsEvaluating(false);
      const sampleCases =
        problem?.testCases && problem.testCases.length > 0
          ? problem.testCases
          : (problem?.examples || []).map((ex, i) => ({
              test_order: i + 1,
              input_data: ex.input,
              expected_output: ex.output,
            }));

      setConsoleResult({
        type: "run",
        note: "Sample Test Cases Evaluation",
        testCases: sampleCases,
      });
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setMobileTab("console");
      }
    }, 400);
  };

  // Submit: Send to POST /api/coding/problems/:id/submissions
  const handleSubmit = async () => {
    if (!user) {
      setConsoleResult({
        type: "error",
        message: "Please log in to submit solutions.",
      });
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setMobileTab("console");
      }
      return;
    }

    if (!problem?.id) return;

    setIsSubmitting(true);
    setConsoleResult(null);

    try {
      const res = await submitCodingProblem(problem.id, {
        language,
        sourceCode: sourceCode.trim() || DEFAULT_STARTER_CODE[language] || "// empty",
      });

      if (res && res.success && res.submission) {
        const sub = res.submission;
        setConsoleResult({
          type: "submit",
          status: sub.status,
          testsPassed: sub.testsPassed ?? sub.tests_passed ?? 0,
          testsTotal: sub.testsTotal ?? sub.tests_total ?? 0,
          executionTimeMs: sub.executionTimeMs ?? sub.execution_time_ms ?? 0,
          memoryKb: sub.memoryKb ?? sub.memory_kb ?? 0,
          errorMessage: sub.errorMessage ?? sub.error_message,
          submissionId: sub.id,
          submittedAt: sub.submittedAt ?? sub.submitted_at,
          xpAwarded: res.xpAwarded || 0,
          isFirstSolve: Boolean(res.isFirstSolve),
        });
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          setMobileTab("console");
        }

        // Immediately refresh problem progress to reflect solve/attempt status
        getCodingProgress(problem.id)
          .then((progRes) => {
            if (progRes && progRes.success && progRes.progress) {
              setProgress(progRes.progress);
            }
          })
          .catch(() => {});

        // Refresh submissions history list
        getCodingSubmissions({ problemId: problem.id })
          .then((subListRes) => {
            if (subListRes && subListRes.success && Array.isArray(subListRes.submissions)) {
              setSubmissions(subListRes.submissions);
            }
          })
          .catch(() => {});
      } else {
        setConsoleResult({
          type: "error",
          message: res?.message || "Failed to evaluate submission.",
        });
      }
    } catch (err) {
      setConsoleResult({
        type: "error",
        message: err.message || "Failed to submit solution.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State (Full Skeleton UI)
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[#080B14] text-white">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#070d19] px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/coding"
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-cyan-400"
            >
              <ArrowLeft size={16} />
              <span>Problems</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-cyan-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-white">
                Career<span className="text-cyan-400">Craft</span> Editor
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin text-cyan-400" />
            <span>Loading problem...</span>
          </div>
        </header>

        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden animate-pulse">
          {/* Left Skeleton Panel */}
          <div className="flex flex-1 flex-col border-b lg:border-b-0 lg:border-r border-white/10 p-6 space-y-5 bg-[#070d19]/40">
            <div className="h-8 w-2/3 rounded-lg bg-white/10" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded bg-white/5" />
              <div className="h-5 w-24 rounded bg-white/5" />
            </div>
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-5/6 rounded bg-white/5" />
              <div className="h-4 w-4/6 rounded bg-white/5" />
            </div>
            <div className="h-28 w-full rounded-xl bg-white/5 border border-white/5 mt-6" />
          </div>

          {/* Right Skeleton Panel */}
          <div className="flex flex-1 flex-col p-6 space-y-4 bg-[#020617]">
            <div className="h-9 w-48 rounded bg-white/10" />
            <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-center items-center">
              <Loader2 size={32} className="animate-spin text-cyan-400 mb-3" />
              <p className="text-xs text-slate-400">Preparing workspace for {slug}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Problem Not Found State (404-Style CareerCraft Page)
  if (isNotFound) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080B14] text-white">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#070d19] px-4 sm:px-6">
          <Link
            to="/coding"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-cyan-400 transition"
          >
            <ArrowLeft size={16} />
            <span>Problem Catalog</span>
          </Link>
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              Career<span className="text-cyan-400">Craft</span>
            </span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#070d19] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 mb-4">
              <FileQuestion size={32} />
            </div>
            <div className="inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-bold tracking-wider text-cyan-300 uppercase mb-2">
              404 • Not Found
            </div>
            <h2 className="text-xl font-black text-white">Problem Not Found</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              We couldn&apos;t find a coding challenge with slug &ldquo;<span className="text-cyan-300 font-mono font-semibold">{slug}</span>&rdquo; in the database catalog. It may have been renamed or unpublished.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/coding" className="w-full sm:w-auto">
                <Button variant="primary" size="sm" icon={ArrowLeft} iconPosition="left" className="w-full">
                  Browse All Problems
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                iconPosition="left"
                onClick={fetchProblemData}
                className="w-full sm:w-auto"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. API Error State (Network / Server Error Card)
  if (error || !problem) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080B14] text-white">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#070d19] px-4 sm:px-6">
          <Link
            to="/coding"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-cyan-400 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Problems</span>
          </Link>
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              Career<span className="text-cyan-400">Craft</span>
            </span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-[#070d19] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Failed to Load Problem</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {error || "An unexpected error occurred while communicating with the CareerCraft API."}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                icon={RotateCcw}
                iconPosition="left"
                onClick={fetchProblemData}
                className="w-full sm:w-auto"
              >
                Try Again
              </Button>
              <Link to="/coding" className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" icon={ArrowLeft} iconPosition="left" className="w-full">
                  Back to Problems
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tags = Array.isArray(problem.tags) ? problem.tags : [];
  const examples = Array.isArray(problem.examples) ? problem.examples : [];
  const constraintsList =
    typeof problem.constraints === "string"
      ? problem.constraints.split("\n").filter((c) => c.trim().length > 0)
      : Array.isArray(problem.constraints)
      ? problem.constraints
      : [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#080B14] text-white">
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#070d19] px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/coding"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 transition hover:text-cyan-400"
          >
            <ArrowLeft size={16} />
            <span>Problems</span>
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              Career<span className="text-cyan-400">Craft</span> Editor
            </span>
          </div>

          <Badge variant={problem.difficulty} size="xs">
            {problem.difficulty}
          </Badge>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            icon={Play}
            iconPosition="left"
            onClick={handleRun}
            disabled={isEvaluating || isSubmitting}
          >
            {isEvaluating ? "Inspecting..." : "Run"}
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Send}
            iconPosition="left"
            onClick={handleSubmit}
            disabled={isEvaluating || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </header>
      {/* Mobile Workspace Mode Switcher */}
      <div className="flex lg:hidden items-center border-b border-white/10 bg-[#070d19] px-3 py-1.5 gap-1 shrink-0 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab("problem")}
          className={`flex-1 py-1 px-2.5 text-center font-semibold rounded-lg transition cursor-pointer ${
            mobileTab === "problem"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Description
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={`flex-1 py-1 px-2.5 text-center font-semibold rounded-lg transition cursor-pointer ${
            mobileTab === "editor"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("console")}
          className={`flex-1 py-1 px-2.5 text-center font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileTab === "console"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Console
          {consoleResult && (
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          )}
        </button>
      </div>

      {/* Main Workspace Split View */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Problem Details & Tabs */}
        <div className={`border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden bg-[#070d19]/60 lg:w-[45%] xl:w-[42%] shrink-0 ${
          mobileTab === "problem" ? "flex flex-1 flex-col" : "hidden lg:flex lg:flex-col"
        }`}>
          {/* Tab Bar */}
          <div className="flex items-center border-b border-white/10 bg-[#070d19] px-4 text-xs">
            <button
              onClick={() => setActiveTab("description")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 font-semibold transition cursor-pointer ${
                activeTab === "description"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <FileText size={14} />
              <span>Description</span>
            </button>

            <button
              onClick={() => setActiveTab("solutions")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 font-semibold transition cursor-pointer ${
                activeTab === "solutions"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Lightbulb size={14} />
              <span>Solutions</span>
            </button>

            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 font-semibold transition cursor-pointer ${
                activeTab === "submissions"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Clock size={14} />
              <span>Submissions</span>
            </button>

            <button
              onClick={() => setActiveTab("discussions")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 font-semibold transition cursor-pointer ${
                activeTab === "discussions"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare size={14} />
              <span>Discussions</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin">
            {activeTab === "description" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-black text-white">
                      {problem.title}
                    </h1>

                    {/* Progress Status Badge */}
                    {progress?.status === "solved" ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-400/20 shrink-0">
                        <CheckCircle2 size={14} />
                        <span>Solved</span>
                      </div>
                    ) : progress?.status === "attempted" ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20 shrink-0">
                        <Clock size={14} />
                        <span>
                          Attempted ({progress.attempts} {progress.attempts === 1 ? "attempt" : "attempts"})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white/5 px-2.5 py-1 rounded-md border border-white/10 shrink-0">
                        <Circle size={14} />
                        <span>Unsolved</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {problem.category && <span>Category: {problem.category}</span>}
                    {tags.length > 0 && (
                      <>
                        <span>•</span>
                        <span>Tags: {tags.join(", ")}</span>
                      </>
                    )}
                    <span>•</span>
                    <Badge variant={problem.difficulty} size="xs">
                      {problem.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* Problem Description */}
                <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line space-y-3">
                  {problem.description}
                </div>

                {/* Input & Output Format (if provided) */}
                {problem.inputFormat && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs font-mono">
                    <h4 className="font-bold text-slate-400 mb-1">Input Format:</h4>
                    <p className="text-slate-300 font-sans">{problem.inputFormat}</p>
                  </div>
                )}

                {problem.outputFormat && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs font-mono">
                    <h4 className="font-bold text-slate-400 mb-1">Output Format:</h4>
                    <p className="text-slate-300 font-sans">{problem.outputFormat}</p>
                  </div>
                )}

                {/* Examples */}
                {examples.length > 0 && (
                  <div className="space-y-4">
                    {examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs font-mono"
                      >
                        <p className="font-bold text-slate-400 mb-1">Example {idx + 1}:</p>
                        <p className="text-slate-300">
                          <strong>Input:</strong> {ex.input}
                        </p>
                        <p className="text-slate-300">
                          <strong>Output:</strong> {ex.output}
                        </p>
                        {ex.explanation && (
                          <p className="text-slate-400 mt-1 font-sans">
                            <strong>Explanation:</strong> {ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {constraintsList.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Constraints:
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300 font-mono">
                      {constraintsList.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hint */}
                <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex w-full items-center justify-between text-xs font-semibold text-yellow-400 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb size={16} />
                      <span>Need a Hint?</span>
                    </div>
                    {showHint ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {showHint && (
                    <p className="mt-3 text-xs leading-relaxed text-slate-300">
                      Think about standard algorithmic paradigms (e.g. hash tables for two-sum lookups, fast/slow pointers for linked lists, sliding windows for substrings). Check constraints carefully to choose between O(N) or O(N log N) approaches.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "solutions" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Editorial & Community Solutions</h3>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-cyan-400">Optimal Approach</span>
                    <Badge variant={problem.difficulty} size="xs">Optimal</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Check problem constraints to determine optimal time and space boundaries. Detailed official editorial solutions will unlock after your first accepted submission.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Your Submission History</h3>
                {!user ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                    <p className="text-xs text-slate-400">
                      Please{" "}
                      <Link to="/login" className="text-cyan-400 font-bold hover:underline">
                        log in
                      </Link>{" "}
                      to view your personal submission history.
                    </p>
                  </div>
                ) : submissionsLoading ? (
                  <div className="flex items-center justify-center p-6 text-slate-400">
                    <Loader2 size={20} className="animate-spin text-cyan-400 mr-2" />
                    <span className="text-xs">Loading submission records...</span>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-slate-400">
                    No submissions yet. Write your solution and click <strong>Submit</strong> to record your attempt.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden text-xs">
                    {submissions.map((sub) => {
                      const isPending = sub.status === "pending";
                      const isAccepted = sub.status === "accepted";
                      const isError =
                        sub.status === "wrong_answer" ||
                        sub.status === "runtime_error" ||
                        sub.status === "compilation_error";

                      return (
                        <div
                          key={sub.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5">
                            {isAccepted ? (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            ) : isPending ? (
                              <Clock size={16} className="text-amber-400" />
                            ) : isError ? (
                              <AlertCircle size={16} className="text-rose-400" />
                            ) : (
                              <Circle size={16} className="text-slate-400" />
                            )}
                            <span
                              className={`font-bold capitalize ${
                                isAccepted
                                  ? "text-emerald-400"
                                  : isPending
                                  ? "text-amber-400"
                                  : isError
                                  ? "text-rose-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {sub.status.replace("_", " ")}
                            </span>
                            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 uppercase font-mono">
                              {sub.language}
                            </span>
                            {typeof sub.testCasesTotal === "number" && sub.testCasesTotal > 0 && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                ({sub.testCasesPassed}/{sub.testCasesTotal} passed)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                            {sub.executionTimeMs && <span>{sub.executionTimeMs} ms</span>}
                            <span>
                              {new Date(sub.submittedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                            <span className="font-mono text-slate-500">
                              #{sub.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "discussions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Community Discussions</h3>
                  <Button size="sm" variant="outline">
                    New Post
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      title: `Optimal approaches & discussion for ${problem.title}`,
                      author: "careercraft_community",
                      upvotes: 142,
                      replies: 18,
                    },
                    {
                      title: "Time & Space complexity breakdown with diagrams",
                      author: "dsa_mentor",
                      upvotes: 89,
                      replies: 12,
                    },
                  ].map((post, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 hover:border-cyan-400/30 transition cursor-pointer"
                    >
                      <h4 className="text-xs font-semibold text-white hover:text-cyan-400">
                        {post.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Posted by @{post.author}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-slate-400">
                            <ThumbsUp size={12} /> {post.upvotes}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MessageSquare size={12} /> {post.replies}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Monaco Code Editor & Execution Console */}
        <div className={`flex-1 flex-col overflow-hidden bg-[#020617] ${
          mobileTab !== "problem" ? "flex" : "hidden lg:flex"
        }`}>
          {/* Editor Sub-Header: Language selector & Options */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#070d19] px-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Language:</span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#080B14] px-2.5 py-1 text-xs font-medium text-white outline-none focus:border-cyan-400/50 cursor-pointer"
              >
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="python">Python 3.11</option>
                <option value="java">Java 17</option>
                <option value="cpp">C++ 20</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Database-Backed</span>
              <span>•</span>
              <span className="text-slate-400">Theme: vs-dark</span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className={`flex-1 overflow-hidden ${mobileTab === "console" ? "hidden lg:block" : "block"}`}>
            <EditorErrorBoundary value={sourceCode} onChange={setSourceCode}>
              <Editor
                height="100%"
                language={languageMap[language] || "javascript"}
                value={sourceCode}
                onChange={(val) => setSourceCode(val || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  padding: { top: 16, bottom: 16 },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 4,
                  suggestOnTriggerCharacters: true,
                  bracketPairColorization: { enabled: true },
                }}
              />
            </EditorErrorBoundary>
          </div>

          {/* Console / Output Drawer */}
          {(consoleResult || mobileTab === "console") && (
            <div className={`border-t border-white/10 bg-[#070d19] p-4 text-xs font-mono overflow-y-auto ${
              mobileTab === "console" ? "flex-1 min-h-[300px]" : "max-h-56"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-cyan-400" />
                  <span className="font-bold text-white">Execution Console</span>
                </div>
                {consoleResult && (
                  <button
                    onClick={() => setConsoleResult(null)}
                    className="text-slate-500 hover:text-white"
                  >
                    &times; Close
                  </button>
                )}
              </div>

              {!consoleResult && (
                <div className="py-12 text-center text-slate-400">
                  <Terminal size={24} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-300">No execution results yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Click &quot;Run&quot; above to test sample cases or &quot;Submit&quot; to evaluate against the database test suite.
                  </p>
                </div>
              )}

              {consoleResult.type === "error" && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-rose-300">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertCircle size={15} />
                    <span>Submission Error</span>
                  </div>
                  <p>{consoleResult.message}</p>
                </div>
              )}

              {consoleResult.type === "run" && (
                <div className="space-y-2">
                  <div className="text-cyan-400 font-semibold text-[11px]">
                    {consoleResult.note}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {consoleResult.testCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-black/40 p-2.5 border border-white/5"
                      >
                        <div className="text-cyan-300 font-bold mb-1">
                          Sample Case {tc.test_order || idx + 1}:
                        </div>
                        <div className="text-slate-400 truncate">
                          <strong>Input:</strong> {tc.input_data}
                        </div>
                        <div className="text-slate-300">
                          <strong>Expected:</strong> {tc.expected_output}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {consoleResult.type === "submit" && (
                <div
                  className={`space-y-2 rounded-lg border p-3.5 ${
                    consoleResult.status === "accepted"
                      ? "border-emerald-400/25 bg-emerald-400/5"
                      : consoleResult.status === "wrong_answer"
                      ? "border-rose-400/25 bg-rose-400/5"
                      : consoleResult.status === "time_limit"
                      ? "border-amber-400/25 bg-amber-400/5"
                      : "border-rose-500/25 bg-rose-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base font-bold">
                      {consoleResult.status === "accepted" ? (
                        <>
                          <CheckCircle2 size={18} className="text-emerald-400" />
                          <span className="text-emerald-400">Accepted</span>
                        </>
                      ) : consoleResult.status === "wrong_answer" ? (
                        <>
                          <AlertCircle size={18} className="text-rose-400" />
                          <span className="text-rose-400">Wrong Answer</span>
                        </>
                      ) : consoleResult.status === "compilation_error" ? (
                        <>
                          <AlertCircle size={18} className="text-rose-400" />
                          <span className="text-rose-400">Compilation Error</span>
                        </>
                      ) : consoleResult.status === "runtime_error" ? (
                        <>
                          <AlertCircle size={18} className="text-rose-400" />
                          <span className="text-rose-400">Runtime Error</span>
                        </>
                      ) : consoleResult.status === "time_limit" ? (
                        <>
                          <Clock size={18} className="text-amber-400" />
                          <span className="text-amber-400">Time Limit Exceeded</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={18} className="text-rose-400" />
                          <span className="text-rose-400 capitalize">{consoleResult.status.replace("_", " ")}</span>
                        </>
                      )}
                    </div>

                    {consoleResult.isFirstSolve && consoleResult.xpAwarded > 0 && (
                      <span className="rounded bg-yellow-400/10 px-2.5 py-0.5 text-xs font-bold text-yellow-300 border border-yellow-400/20">
                        +{consoleResult.xpAwarded} XP
                      </span>
                    )}
                  </div>

                  {consoleResult.testsTotal > 0 && (
                    <div className="text-xs text-slate-300">
                      <strong>{consoleResult.testsPassed} / {consoleResult.testsTotal}</strong> test cases passed
                    </div>
                  )}

                  {consoleResult.errorMessage && (
                    <pre className="rounded bg-black/50 p-2.5 text-[11px] text-rose-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {consoleResult.errorMessage}
                    </pre>
                  )}

                  <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div className="flex gap-3">
                      {typeof consoleResult.executionTimeMs === "number" && (
                        <span>Runtime: {consoleResult.executionTimeMs} ms</span>
                      )}
                      {Boolean(consoleResult.memoryKb) && (
                        <span>Memory: {Math.round((consoleResult.memoryKb / 1024) * 10) / 10} MB</span>
                      )}
                    </div>
                    <div>#{consoleResult.submissionId?.slice(0, 8)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}