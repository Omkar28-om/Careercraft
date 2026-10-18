import { useState, useEffect } from "react";
import {
  FolderGit2,
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  User,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAdminProjects, updateAdminProjectStatus } from "../../services/api";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminProjects({
        search: search.trim() || undefined,
        projectType: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: pagination.limit,
      });
      if (res.success) {
        setProjects(res.data.projects);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast("error", err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
  }, [typeFilter, statusFilter]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleVisibility = async (proj) => {
    const newIsPublic = !proj.isPublic;
    try {
      setActionLoading(true);
      const res = await updateAdminProjectStatus(proj.id, { isPublic: newIsPublic });
      if (res.success) {
        showToast("success", `Project visibility updated to ${newIsPublic ? "Public" : "Private"}`);
        setProjects((prev) =>
          prev.map((p) => (p.id === proj.id ? { ...p, isPublic: newIsPublic } : p))
        );
      }
    } catch (err) {
      showToast("error", err.message || "Failed to moderate project");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Project Moderation"
      subtitle="Inspect student portfolio projects and enforce content moderation and visibility guidelines"
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

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProjects(1);
            }}
            className="relative w-full sm:w-80"
          >
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, student name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </form>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Project Types</option>
              <option value="academic" className="bg-slate-900 text-slate-300">Academic</option>
              <option value="personal" className="bg-slate-900 text-slate-300">Personal</option>
              <option value="hackathon" className="bg-slate-900 text-slate-300">Hackathon</option>
              <option value="freelance" className="bg-slate-900 text-slate-300">Freelance</option>
              <option value="open_source" className="bg-slate-900 text-slate-300">Open Source</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Statuses</option>
              <option value="planned" className="bg-slate-900 text-slate-300">Planned</option>
              <option value="in_progress" className="bg-slate-900 text-slate-300">In Progress</option>
              <option value="completed" className="bg-slate-900 text-slate-300">Completed</option>
            </select>

            <button
              onClick={() => fetchProjects(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                    <div>Loading student projects...</div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No projects found matching criteria.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{p.title}</div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {p.isFeatured ? "Featured Portfolio Item" : "Standard Project"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <User size={12} className="text-cyan-400" />
                        <span>{p.owner?.name}</span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px] pl-4">
                        {p.owner?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] capitalize text-slate-300">
                      {p.projectType.replace(/_/g, " ")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.isPublic
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {p.isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                        {p.isPublic ? "PUBLIC" : "HIDDEN"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleToggleVisibility(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          p.isPublic
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        {p.isPublic ? "Hide Project" : "Unhide Project"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-bold text-white">{pagination.page}</span> of{" "}
              <span className="font-bold text-white">{pagination.totalPages}</span> (
              {pagination.total} projects)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchProjects(pagination.page - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProjects(pagination.page + 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
