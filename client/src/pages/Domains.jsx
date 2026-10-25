import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Braces,
  BriefcaseBusiness,
  Cloud,
  Code2,
  Database,
  GraduationCap,
  HeartPulse,
  Layers3,
  Loader2,
  Megaphone,
  Search,
  Sparkles,
  Terminal,
  Globe2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCourses } from "../api";
import { setSelectedDomain } from "../utils/learningPath";

const DOMAIN_META = {
  "IT & Software": {
    icon: Braces,
    color: "violet",
    eyebrow: "Build digital products",
    description: "Start with web development and Python, then grow into software roles and projects.",
  },
  "Data & Analytics": {
    icon: Database,
    color: "cyan",
    eyebrow: "Turn data into decisions",
    description: "Explore analytics foundations and machine learning through beginner-friendly lessons.",
  },
  "Cloud & Cybersecurity": {
    icon: Layers3,
    color: "blue",
    eyebrow: "Build secure systems",
    description: "Learn cloud concepts and security fundamentals for modern infrastructure teams.",
  },
  "Marketing & Content": {
    icon: Sparkles,
    color: "amber",
    eyebrow: "Reach the right audience",
    description: "Explore digital marketing, content planning, search, and campaign measurement.",
  },
  "Business, Management & Finance": {
    icon: GraduationCap,
    color: "emerald",
    eyebrow: "Plan and deliver value",
    description: "Study project management basics alongside practical finance and budgeting.",
  },
  "Healthcare & Life Sciences": {
    icon: Database,
    color: "blue",
    eyebrow: "Improve care with evidence",
    description: "Explore life-science concepts and data-informed healthcare operations.",
  },
  "Programming Languages": {
    icon: Braces,
    color: "violet",
    eyebrow: "Build your foundation",
    description: "Learn C, Java, Python, and the fundamentals behind writing clear, reliable programs.",
  },
  "Web Development": {
    icon: Globe2,
    color: "cyan",
    eyebrow: "Create for the web",
    description: "Go from semantic HTML and responsive CSS to JavaScript and full web experiences.",
  },
  Databases: {
    icon: Database,
    color: "emerald",
    eyebrow: "Work with real data",
    description: "Model information, write SQL, and understand transactions and performance.",
  },
  "Data Structures & Algorithms": {
    icon: Layers3,
    color: "amber",
    eyebrow: "Think like an engineer",
    description: "Build problem-solving fluency with core data structures and interview patterns.",
  },
};

const DOMAIN_COLORS = {
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  blue: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  rose: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

const CAREER_DIRECTIONS = [
  {
    title: "IT & Software",
    icon: Code2,
    color: "violet",
    description: "Build applications, websites, and digital products with code.",
    roles: ["Software Developer", "Web Developer", "Frontend Engineer"],
    skills: "Java · Python · JavaScript · React",
  },
  {
    title: "Data & Analytics",
    icon: BarChart3,
    color: "cyan",
    description: "Turn raw data into clear findings that help teams make decisions.",
    roles: ["Data Analyst", "Business Analyst", "Data Scientist"],
    skills: "SQL · Spreadsheets · Statistics · Python",
  },
  {
    title: "Cloud & Cybersecurity",
    icon: Cloud,
    color: "blue",
    description: "Help organizations run reliable cloud systems and protect them from threats.",
    roles: ["Cloud Support Associate", "Security Analyst", "Cloud Engineer"],
    skills: "Networking · Linux · Cloud Platforms · Security Basics",
  },
  {
    title: "Business, Management & Finance",
    icon: BriefcaseBusiness,
    color: "amber",
    description: "Coordinate teams, products, customers, and financial operations.",
    roles: ["Product Associate", "Project Coordinator", "Business Development Associate"],
    skills: "Communication · Analysis · Planning · Finance Basics",
  },
  {
    title: "Healthcare & Life Sciences",
    icon: HeartPulse,
    color: "emerald",
    description: "Support healthcare delivery, biomedical innovation, and life-science operations.",
    roles: ["Clinical Data Associate", "Healthcare Operations Analyst", "Biotech Associate"],
    skills: "Research · Data Quality · Biology · Operations",
  },
  {
    title: "Marketing & Content",
    icon: Megaphone,
    color: "rose",
    description: "Grow brands and audiences through useful content and measurable campaigns.",
    roles: ["Digital Marketer", "Content Strategist", "Technical Writer"],
    skills: "SEO · Writing · Social Media · Analytics",
  },
];

export default function Domains() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    getCourses()
      .then((result) => {
        if (active && result?.success && Array.isArray(result.courses)) {
          setCourses(result.courses);
        }
      })
      .catch((error) => console.error("Unable to load learning domains:", error))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const domains = useMemo(() => {
    const counts = courses.reduce((result, course) => {
      if (course.category) result.set(course.category, (result.get(course.category) || 0) + 1);
      return result;
    }, new Map());

    return Array.from(counts, ([name, courseCount]) => ({
      name,
      courseCount,
      ...(DOMAIN_META[name] || {
        icon: GraduationCap,
        color: "blue",
        eyebrow: "Learn by doing",
        description: `Explore focused lessons and practice in ${name.toLowerCase()}.`,
      }),
    })).filter((domain) => `${domain.name} ${domain.description}`.toLowerCase().includes(search.toLowerCase()));
  }, [courses, search]);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827] via-[#0d1424] to-[#080B14] p-7 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1 text-xs font-semibold text-cyan-200">
              <Sparkles size={14} /> Set your learning focus
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">What would you like to <span className="text-violet-300">learn?</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Choose a focus area and CareerCraft will tailor your courses, practice, project ideas, jobs, internships, and freelance opportunities. You can change your focus anytime.
            </p>
            <label className="mt-7 flex max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-400 focus-within:border-cyan-300/40">
              <Search size={17} className="shrink-0 text-cyan-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a domain, like Java or databases"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                aria-label="Search learning domains"
              />
            </label>
          </div>
        </section>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Available course categories</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">Choose a learning domain</h2>
          </div>
          <Link to="/courses" className="hidden items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:flex">
            All courses <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400"><Loader2 size={20} className="animate-spin text-cyan-300" />Loading domains and courses…</div>
        ) : domains.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {domains.map((domain) => {
              const Icon = domain.icon;
              return (
                <Link
                  key={domain.name}
                  to="/courses"
                  onClick={() => setSelectedDomain(domain.name)}
                  className="group rounded-3xl border border-white/[0.08] bg-[#101827]/90 p-6 transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-[#131f31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${DOMAIN_COLORS[domain.color] || DOMAIN_COLORS.blue}`}><Icon size={22} /></span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-slate-300">{domain.courseCount} {domain.courseCount === 1 ? "course" : "courses"}</span>
                  </div>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{domain.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-bold text-white group-hover:text-cyan-200">{domain.name}</h3>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{domain.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Use this domain <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-white/10 bg-[#101827] px-6 py-14 text-center">
            <BookOpen size={28} className="mx-auto text-slate-500" />
            <h3 className="mt-4 text-lg font-bold text-white">No matching domains yet</h3>
            <p className="mt-2 text-sm text-slate-400">Try a different search or browse the full course catalog.</p>
            <Link to="/courses" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Browse courses <ArrowRight size={15} /></Link>
          </div>
        )}

        <section className="mt-14" aria-labelledby="career-directions-heading">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Explore possible paths</p>
              <h2 id="career-directions-heading" className="mt-2 text-2xl font-extrabold text-white">Career domains & example roles</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Compare the work, roles, and skills in each area. A good starting point is where your interests and strengths meet the skills employers seek.</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a href="https://www.mygreatlearning.com/blog/career-guidance-for-freshers-and-experienced-professionals/" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-violet-200 hover:text-white">Career choice guide <ArrowUpRight size={14} /></a>
              <a href="https://upgradpune.org/blog/how-to-choose-the-right-it-domain-as-a-fresher" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-violet-200 hover:text-white">IT domain guide <ArrowUpRight size={14} /></a>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {CAREER_DIRECTIONS.map((direction) => {
              const Icon = direction.icon;
              return (
                <article key={direction.title} className="rounded-3xl border border-white/[0.08] bg-[#101827]/85 p-5 transition hover:border-white/20 hover:bg-[#131f31]">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${DOMAIN_COLORS[direction.color] || DOMAIN_COLORS.blue}`}><Icon size={20} /></span>
                    <h3 className="text-base font-bold text-white">{direction.title}</h3>
                  </div>
                  <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">{direction.description}</p>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Example roles</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {direction.roles.map((role) => <span key={role} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">{role}</span>)}
                  </div>
                  <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-5 text-slate-500"><span className="font-semibold text-slate-400">Skills to explore: </span>{direction.skills}</p>
                </article>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">Role examples are starting points; requirements vary by employer and location. <a href="https://kaushikvikrambalaji.medium.com/domain-wise-tips-to-start-your-career-fresh-a-guaranteed-approach-b384cb2d3bc8" target="_blank" rel="noreferrer" className="text-cyan-300 underline decoration-cyan-300/30 underline-offset-2 hover:text-cyan-200">Explore role-specific project ideas</a>.</p>
        </section>

        <section className="mt-12 grid gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:grid-cols-3 sm:p-8">
          <div><span className="text-xs font-bold uppercase tracking-widest text-violet-300">01 · Learn</span><p className="mt-2 text-sm leading-6 text-slate-300">Take a focused course and build the basics one lesson at a time.</p></div>
          <div><span className="text-xs font-bold uppercase tracking-widest text-cyan-300">02 · Practice</span><p className="mt-2 text-sm leading-6 text-slate-300">Use the online coding workspace to solve questions in your own language.</p><Link to="/coding" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cyan-300">Open Code <Terminal size={13} /></Link></div>
          <div><span className="text-xs font-bold uppercase tracking-widest text-emerald-300">03 · Build</span><p className="mt-2 text-sm leading-6 text-slate-300">Turn what you learn into projects you can share with employers.</p><Link to="/projects" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-300">Build a project <ArrowRight size={13} /></Link></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
