import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CircleHelp, RotateCcw, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { getLocalCourse, getLocalCourseQuestions, saveLocalQuizScore } from "../data/localCourses";

export default function CourseQuiz() {
  const { slug } = useParams();
  const course = useMemo(() => getLocalCourse(slug), [slug]);
  const questions = useMemo(() => getLocalCourseQuestions(slug), [slug]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [savedScore, setSavedScore] = useState(false);
  const score = questions.reduce((total, question) => total + (answers[question.id] === question.correctOptionIndex ? 1 : 0), 0);

  const submitQuiz = () => {
    if (Object.keys(answers).length !== questions.length || !questions.length) return;
    saveLocalQuizScore(course.id, score, questions.length);
    setSubmitted(true);
    setSavedScore(true);
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
    setSavedScore(false);
  };

  if (!course || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 text-center">
          <CircleHelp size={36} className="text-cyan-300" />
          <h1 className="mt-4 text-2xl font-bold">Practice quiz unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">There is no starter quiz for this course yet.</p>
          <Link to="/courses" className="mt-6"><Button variant="secondary" icon={ArrowLeft} iconPosition="left">Back to courses</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"><ArrowLeft size={16} />{course.title}</Link>
        <header className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] to-[#111024] p-6 sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1 text-xs font-semibold text-cyan-200"><Sparkles size={14} /> Course practice</span>
          <h1 className="mt-4 text-3xl font-black">Check your understanding</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{course.title} · {questions.length} multiple-choice questions · Your score is saved in this browser.</p>
          {submitted && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4"><CheckCircle2 size={20} className="text-emerald-300" /><p className="text-sm text-emerald-100">You scored <strong>{score} / {questions.length}</strong> ({Math.round((score / questions.length) * 100)}%). {savedScore ? "Your score was saved locally." : ""}</p></div>}
        </header>

        <div className="mt-6 space-y-4">
          {questions.map((question, questionIndex) => (
            <section key={question.id} className="rounded-2xl border border-white/10 bg-[#101827] p-5 sm:p-6">
              <h2 className="text-sm font-bold leading-6 text-white"><span className="mr-2 text-cyan-300">{questionIndex + 1}.</span>{question.question}</h2>
              <div className="mt-4 grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  const correct = submitted && optionIndex === question.correctOptionIndex;
                  const incorrectSelection = submitted && selected && !correct;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-default ${correct ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100" : incorrectSelection ? "border-rose-300/40 bg-rose-300/10 text-rose-100" : selected ? "border-violet-300/40 bg-violet-300/10 text-white" : "border-white/10 bg-black/10 text-slate-300 hover:border-white/20 hover:bg-white/[0.03]"}`}
                    >
                      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current/20 text-[11px] font-bold">{String.fromCharCode(65 + optionIndex)}</span>{option}
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="mt-4 rounded-xl border border-white/[0.06] bg-black/15 p-3 text-xs leading-5 text-slate-300"><strong className="text-cyan-200">Why:</strong> {question.explanation}</p>}
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:flex-row">
          <p className="text-xs text-slate-400">{submitted ? "Review the explanations, then try again if you like." : `${Object.keys(answers).length} of ${questions.length} answered`}</p>
          {submitted ? <Button variant="secondary" icon={RotateCcw} onClick={retry}>Try again</Button> : <Button variant="primary" disabled={Object.keys(answers).length !== questions.length} onClick={submitQuiz}>Submit answers</Button>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
