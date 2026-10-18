import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { getEnrollments, getProfile, getProjects, getSkills } from "../api";
import "./ResumeStudio.css";

const savedResume = (() => {
  try {
    return JSON.parse(localStorage.getItem("careercraft-resume-draft") || "{}");
  } catch {
    return {};
  }
})();

const valueOr = (value, fallback) => (typeof value === "string" && value.trim() ? value.trim() : fallback);

function buildProfileSummary(profile, skills, projects) {
  const degree = [profile?.degree, profile?.college].filter(Boolean).join(" student from ");
  const specialties = skills.map((skill) => skill.name).filter(Boolean).slice(0, 4).join(", ");
  const projectNames = projects.slice(0, 2).map((project) => project.title).filter(Boolean).join(" and ");
  const opening = valueOr(profile?.bio, degree ? `${degree} focused on building a strong foundation in software development.` : "Student developer focused on building a strong foundation in software development.");
  const skillsLine = specialties ? ` Skilled in ${specialties}.` : " Growing practical skills through structured learning and regular practice.";
  const projectLine = projectNames ? ` Built projects including ${projectNames}.` : " Looking for opportunities to turn coursework into useful projects.";
  return `${opening}${skillsLine}${projectLine}`;
}

export default function ResumeStudio() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    summary: savedResume.summary || "",
    targetRole: savedResume.targetRole || "",
  });
  const [saved, setSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setDraft((current) => current.summary.trim()
        ? current
        : { ...current, summary: buildProfileSummary(null, [], []) });
      setLoading(false);
      return;
    }

    const [profileResult, skillsResult, projectsResult, coursesResult] = await Promise.allSettled([
      getProfile(), getSkills(), getProjects(), getEnrollments(),
    ]);

    const nextProfile = profileResult.status === "fulfilled" ? profileResult.value?.profile || null : null;
    const nextSkills = skillsResult.status === "fulfilled" ? skillsResult.value?.skills || [] : [];
    const nextProjects = projectsResult.status === "fulfilled" ? projectsResult.value?.projects || [] : [];
    if (profileResult.status === "fulfilled") setProfile(nextProfile);
    if (skillsResult.status === "fulfilled") setSkills(nextSkills);
    if (projectsResult.status === "fulfilled") setProjects(nextProjects);
    if (coursesResult.status === "fulfilled") setEnrollments(coursesResult.value?.enrollments || []);
    setDraft((current) => current.summary.trim()
      ? current
      : { ...current, summary: buildProfileSummary(nextProfile, nextSkills, nextProjects) });
    setLoading(false);
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const fullName = valueOr(profile?.name, user?.name || "Your name");
  const email = valueOr(profile?.email, user?.email || "Add your email in Profile");
  const education = [profile?.degree, profile?.college].filter(Boolean).join(" · ");
  const skillNames = useMemo(() => skills.map((skill) => skill.name).filter(Boolean), [skills]);
  const completedCourses = useMemo(() => enrollments.filter((course) => course.status === "completed" || course.enrollmentStatus === "completed"), [enrollments]);
  const publicProjects = useMemo(() => projects.filter((project) => project.isPublic !== false && project.is_public !== false), [projects]);

  const makeSummary = useCallback(
    () => buildProfileSummary(profile, skills, publicProjects),
    [profile, skills, publicProjects]
  );

  const checklist = useMemo(() => [
    { label: "Contact details", complete: Boolean(profile?.email || user?.email) && Boolean(profile?.phone) },
    { label: "Professional summary", complete: Boolean(draft.summary.trim()) },
    { label: "Education", complete: Boolean(education) },
    { label: "Relevant skills", complete: skillNames.length >= 3 },
    { label: "Projects or experience", complete: publicProjects.length > 0 },
  ], [profile, user, draft.summary, education, skillNames.length, publicProjects.length]);

  const score = Math.round((checklist.filter((item) => item.complete).length / checklist.length) * 100);
  const insightItems = [
    !profile?.phone && "Add a phone number so recruiters can contact you.",
    !education && "Add your degree and college in your profile to complete your education section.",
    skillNames.length < 3 && "Add at least three skills to make your technical strengths easier to scan.",
    publicProjects.length === 0 && "Add a project with a short outcome and a GitHub or live link.",
    !draft.targetRole.trim() && "Choose a target role to tailor your summary and skills for each application.",
  ].filter(Boolean);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const saveDraft = () => {
    localStorage.setItem("careercraft-resume-draft", JSON.stringify(draft));
    setSaved(true);
  };

  const handleProfileDraft = () => {
    setDraft((current) => ({ ...current, summary: makeSummary() }));
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-9 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1 text-xs font-semibold text-violet-200"><Sparkles size={14} /> Profile-powered resume studio</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Turn your learning into a <span className="text-violet-300">strong resume.</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Your profile, skills, courses, and projects are gathered into a resume you can refine and print as a PDF.</p>
            {!user && <p className="mt-3 inline-flex rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-2 text-xs leading-5 text-cyan-100/80">You can build and save a draft in this browser now. Sign in later to pull in your CareerCraft profile, skills, and projects.</p>}
          </div>
          <button type="button" onClick={saveDraft} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400">
            <CheckCircle2 size={16} /> {saved ? "Saved" : "Save draft"}
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-slate-400"><Loader2 size={20} className="animate-spin text-cyan-300" />Loading your profile for the resume…</div>
        ) : (
          <div className="mt-8 grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="space-y-5" data-resume-ui>
              <div className="rounded-3xl border border-white/10 bg-[#101827] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Resume analysis</p><h2 className="mt-2 text-xl font-bold text-white">Profile readiness</h2></div>
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07]"><span className="text-xl font-black text-cyan-200">{score}</span><span className="text-[9px] font-bold uppercase text-slate-400">Score</span></div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all" style={{ width: `${score}%` }} /></div>
                <div className="mt-5 space-y-3">
                  {checklist.map((item) => <div key={item.label} className="flex items-center gap-3 text-sm"><CheckCircle2 size={16} className={item.complete ? "text-emerald-300" : "text-slate-600"} /><span className={item.complete ? "text-slate-200" : "text-slate-400"}>{item.label}</span><span className="ml-auto text-xs text-slate-500">{item.complete ? "Ready" : "Add details"}</span></div>)}
                </div>
                <p className="mt-5 rounded-xl border border-white/[0.07] bg-black/15 p-3 text-[11px] leading-5 text-slate-500">Analysis uses profile completeness and project/skill data available in CareerCraft. It is a practical checklist, not an external ATS or generative AI score.</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#101827] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Builder</p><h2 className="mt-2 text-xl font-bold text-white">Shape your story</h2></div><button type="button" onClick={handleProfileDraft} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-300/30 hover:text-white"><RefreshCw size={13} /> Draft from profile</button></div>
                <label className="mt-5 block text-xs font-semibold text-slate-300">Target role
                  <input value={draft.targetRole} onChange={(event) => updateDraft("targetRole", event.target.value)} placeholder="e.g. Junior Java Developer" className="mt-2 w-full rounded-xl border border-white/10 bg-[#080B14] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10" />
                </label>
                <label className="mt-4 block text-xs font-semibold text-slate-300">Professional summary
                  <textarea value={draft.summary} onChange={(event) => updateDraft("summary", event.target.value)} rows={6} placeholder="Describe what you are learning, the skills you use, and the work you want to do." className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#080B14] px-3.5 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10" />
                </label>
                <p className="mt-2 text-[11px] text-slate-500">Your draft is stored in this browser. Your CareerCraft profile stays unchanged.</p>
              </div>

              <div className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.04] p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-white"><Lightbulb size={17} className="text-amber-300" /> What to improve</h2>
                {insightItems.length ? <ul className="mt-4 space-y-3">{insightItems.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-slate-300"><ArrowRight size={14} className="mt-0.5 shrink-0 text-amber-300" />{item}</li>)}</ul> : <p className="mt-3 text-sm text-emerald-200">Your key profile sections are filled in. Tailor your target role before applying.</p>}
              </div>
            </section>

            <section className="resume-preview rounded-3xl border border-white/10 bg-[#131b2a] p-4 sm:p-6" aria-label="Live resume preview">
              <div className="mb-4 flex items-center justify-between gap-3" data-resume-ui>
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Live preview</p><p className="mt-1 text-xs text-slate-400">Updates from your profile and draft</p></div>
                <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-300/30 hover:text-white"><ArrowDownToLine size={14} /> Print / Save PDF</button>
              </div>
              <article className="resume-paper min-h-[760px] rounded-2xl bg-white p-7 text-slate-800 shadow-2xl sm:p-10" data-resume-paper>
                <header className="border-b-2 border-slate-800 pb-5">
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">{fullName}</h2>
                  <p className="mt-2 text-sm font-semibold text-violet-700">{valueOr(draft.targetRole, "Student Developer")}</p>
                  <p className="mt-3 text-xs text-slate-600">{email}{profile?.phone ? ` · ${profile.phone}` : ""}{profile?.location ? ` · ${profile.location}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-700">
                    {profile?.github_url && <span>{profile.github_url}</span>}{profile?.linkedin_url && <span>{profile.linkedin_url}</span>}{profile?.portfolio_url && <span>{profile.portfolio_url}</span>}
                  </div>
                </header>

                <ResumeSection icon={UserRound} title="Profile"><p className="text-sm leading-6 text-slate-700">{valueOr(draft.summary, "Add a summary in the builder to describe your strengths and goals.")}</p></ResumeSection>
                <ResumeSection icon={GraduationCap} title="Education">
                  {education ? <><p className="font-bold text-slate-900">{profile.degree}</p><p className="mt-1 text-sm text-slate-600">{profile.college}{profile.graduation_year ? ` · Class of ${profile.graduation_year}` : ""}</p></> : <p className="text-sm text-slate-500">Add your degree and college in your profile.</p>}
                </ResumeSection>
                <ResumeSection icon={Sparkles} title="Skills">
                  {skillNames.length ? <div className="flex flex-wrap gap-2">{skillNames.map((name) => <span key={name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{name}</span>)}</div> : <p className="text-sm text-slate-500">Add your skills to your CareerCraft profile.</p>}
                </ResumeSection>
                <ResumeSection icon={BriefcaseBusiness} title="Projects">
                  {publicProjects.length ? <div className="space-y-4">{publicProjects.slice(0, 4).map((project) => <div key={project.id || project.title}><p className="font-bold text-slate-900">{project.title}</p>{project.description && <p className="mt-1 text-sm leading-5 text-slate-600">{project.description}</p>}<p className="mt-1 text-xs text-slate-500">{(Array.isArray(project.technologies) ? project.technologies : []).join(" · ")}</p></div>)}</div> : <p className="text-sm text-slate-500">Add a project to your portfolio to show what you can build.</p>}
                </ResumeSection>
                {completedCourses.length > 0 && <ResumeSection icon={CheckCircle2} title="Relevant learning"><ul className="space-y-1 text-sm text-slate-700">{completedCourses.slice(0, 5).map((course) => <li key={course.id || course.courseId || course.title}>{course.title || course.courseTitle || "Completed course"}</li>)}</ul></ResumeSection>}
                {!profile?.phone && <p className="mt-8 text-[10px] text-slate-400" data-resume-ui>Tip: add missing contact details in your profile before sharing this resume.</p>}
              </article>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500" data-resume-ui><FileText size={14} /> Preview uses your CareerCraft profile data</div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ResumeSection({ icon: Icon, title, children }) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-800"><Icon size={14} className="text-violet-600" />{title}</h3>
      {children}
    </section>
  );
}
