import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  GraduationCap,
  MapPin,
  Phone,
  Trophy,
  Zap,
  Code2,
  BookOpen,
  Briefcase,
  Sparkles,
  Shield,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAdminUserDetail, updateAdminUserStatus } from "../../services/api";

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await getAdminUserDetail(id);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleStatus = async () => {
    if (!data?.user) return;
    const newStatus = data.user.status === "active" ? "suspended" : "active";
    try {
      setActionLoading(true);
      const res = await updateAdminUserStatus(id, newStatus);
      if (res.success) {
        showToast("success", `User status changed to ${newStatus}`);
        setData((prev) => ({
          ...prev,
          user: { ...prev.user, status: newStatus },
        }));
      }
    } catch (err) {
      showToast("error", err.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="User Profile" subtitle="Loading administrative record...">
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="h-10 w-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Fetching user data...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="User Profile" subtitle="Error loading profile">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} />
            <h2 className="text-base font-bold">Failed to load user</h2>
          </div>
          <p className="text-xs">{error || "User record not found."}</p>
          <Link
            to="/admin/users"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
          >
            <ArrowLeft size={14} />
            <span>Return to User Directory</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { user, profile, skills, progress, achievements, projects, courses, applications, freelance } = data;

  return (
    <AdminLayout
      title={user.name}
      subtitle={`Account ID: ${user.id} • Joined: ${new Date(user.createdAt).toLocaleDateString()}`}
      actionButton={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Users</span>
          </Link>
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleToggleStatus}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
              user.status === "active"
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            {user.status === "active" ? (
              <>
                <UserX size={14} />
                <span>Suspend Account</span>
              </>
            ) : (
              <>
                <UserCheck size={14} />
                <span>Reactivate Account</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {toast && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
              toast.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* User Badges Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <User size={20} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Account Role</div>
              <div className="text-sm font-bold text-white capitalize">{user.role}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${
              user.status === "active"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              {user.status === "active" ? <CheckCircle2 size={20} /> : <UserX size={20} />}
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Status</div>
              <div className="text-sm font-bold text-white uppercase">{user.status}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Total XP</div>
              <div className="text-sm font-bold text-white">{(progress.totalXp || 0).toLocaleString()} XP</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Achievements</div>
              <div className="text-sm font-bold text-white">{achievements?.length || 0} Unlocked</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {[
            { id: "overview", label: "Profile & Skills", icon: User },
            { id: "learning", label: "Courses & Coding", icon: BookOpen },
            { id: "projects", label: "Projects & Portfolio", icon: Code2 },
            { id: "career", label: "Jobs & Freelance", icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <User size={16} className="text-cyan-400" />
                Profile Information
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail size={14} className="text-slate-500" />
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-white">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <GraduationCap size={14} className="text-slate-500" />
                  <span className="text-slate-400">College:</span>
                  <span>{profile?.college || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-400 pl-5">Degree:</span>
                  <span>{profile?.degree || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin size={14} className="text-slate-500" />
                  <span className="text-slate-400">Location:</span>
                  <span>{profile?.location || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone size={14} className="text-slate-500" />
                  <span className="text-slate-400">Phone:</span>
                  <span>{profile?.phone || "Not specified"}</span>
                </div>
                {profile?.bio && (
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[11px] text-slate-500 mb-1">Bio</div>
                    <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-cyan-400" />
                Skills & Competencies
              </h2>
              {skills && skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-1 rounded-xl text-xs bg-white/5 border border-white/10 text-slate-200"
                    >
                      {s.name}{" "}
                      <span className="text-[10px] text-cyan-400 font-semibold ml-1">
                        • {s.proficiency}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">No skills added yet.</div>
              )}

              <h3 className="text-xs font-bold text-slate-400 pt-4 border-t border-white/5 uppercase tracking-wider">
                Achievements ({achievements?.length || 0})
              </h3>
              <div className="space-y-2">
                {achievements?.slice(0, 5).map((a) => (
                  <div
                    key={a.code}
                    className="p-2.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200">{a.title}</span>
                    <span className="text-amber-400 font-bold">+{a.reward_xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Learning */}
        {activeTab === "learning" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-400" />
                Course Enrollments ({courses?.length || 0})
              </h2>
              <div className="space-y-2">
                {courses && courses.length > 0 ? (
                  courses.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{c.course_title}</div>
                        <div className="text-[11px] text-slate-500">
                          Enrolled: {new Date(c.enrolled_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.progress_percent}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">No active course enrollments.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 size={16} className="text-amber-400" />
                Coding Activity
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-slate-400">Problems Solved</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {progress.problemsSolved || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-slate-400">Current Streak</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {progress.currentStreak || 0} days
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Projects */}
        {activeTab === "projects" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 size={16} className="text-cyan-400" />
              User Projects ({projects?.length || 0})
            </h2>
            <div className="divide-y divide-white/5 text-xs">
              {projects && projects.length > 0 ? (
                projects.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{p.title}</div>
                      <div className="text-[11px] text-slate-500">
                        Type: {p.project_type} • Status: {p.status}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {p.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-slate-500">No projects added yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Career */}
        {activeTab === "career" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase size={16} className="text-purple-400" />
                Job Applications ({applications?.length || 0})
              </h2>
              <div className="space-y-2 text-xs">
                {applications && applications.length > 0 ? (
                  applications.map((app, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{app.job_title}</div>
                        <div className="text-[11px] text-slate-500">{app.company_name}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {app.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">No job applications submitted.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" />
                Freelancing Activity
              </h2>
              <div className="space-y-2 text-xs">
                <div className="text-slate-400">
                  Client Projects Created:{" "}
                  <span className="text-white font-bold">
                    {freelance?.clientProjects?.length || 0}
                  </span>
                </div>
                <div className="text-slate-400">
                  Proposals Submitted:{" "}
                  <span className="text-white font-bold">
                    {freelance?.proposals?.length || 0}
                  </span>
                </div>
                <div className="text-slate-400">
                  Contracts Executed:{" "}
                  <span className="text-white font-bold">
                    {freelance?.contracts?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
