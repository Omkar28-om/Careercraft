import { Link } from "react-router-dom";
import { GithubIcon, TwitterIcon, LinkedinIcon } from "./SocialIcons";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080B14] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src="/careercraft-logo.png"
                alt="CareerCraft"
                className="h-10 w-10 object-contain"
              />
              <div>
                <span className="text-xl font-extrabold tracking-tight">
                  Career<span className="text-[#8B5CF6]">Craft</span>
                </span>
                <p className="text-[9px] font-semibold tracking-[0.25em] text-[#8B5CF6]">
                  SKILLS • OPPORTUNITIES • GROWTH
                </p>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-400">
              The unified career acceleration ecosystem for tech students. Practice coding,
              master modern skills, build real projects, and land internships, jobs, and freelance gigs.
            </p>
            <div className="mt-6 flex items-center gap-3 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/10 p-2 transition hover:border-cyan-400/40 hover:text-cyan-400 hover:bg-white/[0.04]"
                aria-label="GitHub"
              >
                <GithubIcon size={16} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/10 p-2 transition hover:border-cyan-400/40 hover:text-cyan-400 hover:bg-white/[0.04]"
                aria-label="Twitter"
              >
                <TwitterIcon size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/10 p-2 transition hover:border-cyan-400/40 hover:text-cyan-400 hover:bg-white/[0.04]"
                aria-label="LinkedIn"
              >
                <LinkedinIcon size={16} />
              </a>
            </div>
          </div>

          {/* Quick links: Pillars */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Practice & Learn
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/domains" className="hover:text-cyan-300 transition">
                  Explore Learning Domains
                </Link>
              </li>
              <li>
                <Link to="/coding" className="hover:text-cyan-300 transition">
                  Coding Problems
                </Link>
              </li>
              <li>
                <Link to="/coding/problems/two-sum" className="hover:text-cyan-300 transition">
                  Problem Workspace
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-cyan-300 transition">
                  Course Catalog
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-cyan-300 transition">
                  Course Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick links: Work */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Opportunities
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/jobs" className="hover:text-cyan-300 transition">
                  Tech Jobs
                </Link>
              </li>
              <li>
                <Link to="/internships" className="hover:text-cyan-300 transition">
                  Summer & Remote Internships
                </Link>
              </li>
              <li>
                <Link to="/freelance" className="hover:text-cyan-300 transition">
                  Freelance Projects
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-cyan-300 transition">
                  Student Portfolios
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick links: Progression */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Progression
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/dashboard" className="hover:text-cyan-300 transition">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-cyan-300 transition">
                  Student Profile
                </Link>
              </li>
              <li>
                <Link to="/resume" className="hover:text-cyan-300 transition">
                  Resume Builder & Analysis
                </Link>
              </li>
              <li>
                <Link to="/achievements" className="hover:text-cyan-300 transition">
                  XP & Achievements
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-cyan-300 transition">
                  Learning Progress
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CareerCraft. Built for student developers.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="text-slate-400 font-medium">SKILLS • OPPORTUNITIES • GROWTH</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
