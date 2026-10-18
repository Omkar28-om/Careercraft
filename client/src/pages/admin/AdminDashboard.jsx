import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  Briefcase,
  Code2,
  FolderGit2,
  Sparkles,
  Bell,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle,
  Clock,
  Layers,
  FileCheck2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  HeartPulse,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAdminStats } from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminStats();
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.message || "Failed to load admin statistics");
      }
    } catch (err) {
      setError(err.message || "Failed to load admin statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Admin Console" subtitle="System metrics, platform statistics, and administrative events">
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="h-10 w-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Aggregating platform metrics from PostgreSQL...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Admin Console" subtitle="System metrics, platform statistics, and administrative events">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold mb-1">Error Loading Statistics</h2>
            <p className="text-xs">{error}</p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Users & Accounts",
      value: stats?.totalUsers || 0,
      sublabel: `${stats?.totalStudents || 0} students • ${stats?.totalAdmins || 0} admins`,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      link: "/admin/users",
    },
    {
      title: "Courses & Curricula",
      value: stats?.totalCourses || 0,
      sublabel: `${stats?.publishedCourses || 0} published`,
      icon: BookOpen,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      link: "/admin/courses",
    },
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      sublabel: `${stats?.totalJobs || 0} total listings`,
      icon: Briefcase,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      link: "/admin/jobs",
    },
    {
      title: "Coding Problems",
      value: stats?.totalCodingProblems || 0,
      sublabel: `${stats?.totalSubmissions || 0} total submissions`,
      icon: Code2,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      link: "/admin/coding",
    },
    {
      title: "Student Projects",
      value: stats?.totalProjects || 0,
      sublabel: "Published portfolios",
      icon: FolderGit2,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      link: "/admin/projects",
    },
    {
      title: "Freelance Projects",
      value: stats?.totalFreelanceProjects || 0,
      sublabel: `${stats?.openFreelanceProjects || 0} open • ${stats?.activeFreelanceContracts || 0} active contracts`,
      icon: Sparkles,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      link: "/admin/freelance",
    },
    {
      title: "Job Applications",
      value: stats?.totalApplications || 0,
      sublabel: "Candidate submissions",
      icon: FileCheck2,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      link: "/admin/jobs",
    },
    {
      title: "Notifications",
      value: stats?.totalNotifications || 0,
      sublabel: `${stats?.unreadNotifications || 0} unread by users`,
      icon: Bell,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      link: "/admin/notifications",
    },
  ];

  return (
    <AdminLayout
      title="Admin Console"
      subtitle="Overview of system metrics, content health, and administrative audit streams"
      actionButton={
        <Link
          to="/admin/audit-logs"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
        >
          <Activity size={14} className="text-cyan-400" />
          <span>Full Audit Log Stream</span>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* ================= KEY METRICS GRID ================= */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              Platform Overview Metrics
            </h2>
            <span className="text-xs text-slate-500 font-mono">100% Real Database Values</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.title}
                  to={c.link}
                  className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${c.bg} ${c.border} border`}>
                      <Icon size={18} className={c.color} />
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition"
                    >
                    </ArrowRight>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {c.value.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-slate-300 mt-0.5">
                    {c.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {c.sublabel}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ================= CONTENT HEALTH & USER GROWTH (PART 9) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Health Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <HeartPulse size={16} className="text-emerald-400" />
              <span>Platform Content Health</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] border border-white/5">
                <span className="text-slate-300">Courses Published</span>
                <span className="font-bold text-white">
                  {stats?.publishedCourses || 0} / {stats?.totalCourses || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] border border-white/5">
                <span className="text-slate-300">Jobs Active</span>
                <span className="font-bold text-white">
                  {stats?.activeJobs || 0} / {stats?.totalJobs || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] border border-white/5">
                <span className="text-slate-300">Coding Challenges Published</span>
                <span className="font-bold text-white">{stats?.totalCodingProblems || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] border border-white/5">
                <span className="text-slate-300">Student Projects in Portfolio</span>
                <span className="font-bold text-white">{stats?.totalProjects || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] border border-white/5">
                <span className="text-slate-300">Freelance Projects (Total)</span>
                <span className="font-bold text-white">{stats?.totalFreelanceProjects || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] border border-white/5">
                <span className="text-slate-300">Open Freelance Projects</span>
                <span className="font-bold text-cyan-400">{stats?.openFreelanceProjects || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] border border-white/5">
                <span className="text-slate-300">Active Contracts</span>
                <span className="font-bold text-emerald-400">{stats?.activeFreelanceContracts || 0}</span>
              </div>
            </div>
          </div>

          {/* User Growth & Platform Velocity */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-400" />
                <span>User Growth & Trends</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tracking real registered students, admins, and submission activity over time.
              </p>
            </div>

            <div className="my-6 rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-400">
              <TrendingUp size={24} className="mx-auto text-slate-600 mb-2" />
              <p className="font-medium text-slate-300">No historical trend chart data available yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Currently tracking {stats?.totalUsers || 0} registered user accounts with {stats?.totalSubmissions || 0} total code evaluations.
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>PostgreSQL Accounts: {stats?.totalUsers || 0}</span>
              <Link to="/admin/users" className="text-cyan-400 font-semibold hover:underline">
                Inspect Users &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            Quick Management Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Manage Users", path: "/admin/users", icon: Users },
              { label: "Manage Courses", path: "/admin/courses", icon: BookOpen },
              { label: "Manage Jobs", path: "/admin/jobs", icon: Briefcase },
              { label: "Manage Coding", path: "/admin/coding", icon: Code2 },
              { label: "Moderate Projects", path: "/admin/projects", icon: FolderGit2 },
              { label: "Moderate Freelance", path: "/admin/freelance", icon: Sparkles },
            ].map((btn) => {
              const Icon = btn.icon;
              return (
                <Link
                  key={btn.label}
                  to={btn.path}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition text-center group"
                >
                  <Icon size={20} className="mb-2 text-slate-400 group-hover:text-cyan-400 transition" />
                  <span className="text-xs font-semibold">{btn.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Admin Activity Feed (From real audit logs) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              <span>Recent Administrative Activity</span>
            </h2>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Full Audit Logs</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="divide-y divide-white/5">
              {stats.recentActivity.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <ShieldCheck size={14} />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {act.action.replace(/_/g, " ")}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Target: <span className="text-slate-400 font-mono">{act.entityType}</span> • Executed by{" "}
                        <span className="text-slate-300 font-medium">{act.adminName || act.adminEmail}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(act.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              No recent administrative actions recorded.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
