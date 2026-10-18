import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Briefcase,
  Code2,
  FolderGit2,
  Sparkles,
  Bell,
  ShieldCheck,
  History,
} from "lucide-react";

export const adminNavItems = [
  { name: "Overview", path: "/admin", icon: LayoutDashboard },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Courses", path: "/admin/courses", icon: BookOpen },
  { name: "Jobs", path: "/admin/jobs", icon: Briefcase },
  { name: "Coding", path: "/admin/coding", icon: Code2 },
  { name: "Projects", path: "/admin/projects", icon: FolderGit2 },
  { name: "Freelance", path: "/admin/freelance", icon: Sparkles },
  { name: "Notifications", path: "/admin/notifications", icon: Bell },
  { name: "Audit Logs", path: "/admin/audit-logs", icon: History },
];

export default function AdminLayout({ children, title, subtitle, actionButton }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 tech-grid-pattern">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck size={12} />
                ADMINISTRATION CONSOLE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {actionButton && <div>{actionButton}</div>}
        </div>

        {/* Sub-nav tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-white/5">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <Icon size={14} className={isActive ? "text-cyan-400" : "text-slate-400"} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Page Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
