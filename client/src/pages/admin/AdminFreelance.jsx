import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Search,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  User,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import {
  getAdminFreelanceProjects,
  updateAdminFreelanceProjectStatus,
} from "../../services/api";

export default function AdminFreelance() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { project, newStatus }

  const fetchFreelance = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminFreelanceProjects({
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: pagination.limit,
      });
      if (res.success) {
        setProjects(res.data.projects);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast("error", err.message || "Failed to load freelance projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelance(1);
  }, [categoryFilter, statusFilter]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCancelProject = async (project) => {
    try {
      setActionLoading(true);
      const res = await updateAdminFreelanceProjectStatus(project.id, "cancelled");
      if (res.success) {
        showToast("success", `Project "${project.title}" has been cancelled`);
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, status: "cancelled" } : p))
        );
      }
    } catch (err) {
      showToast("error", err.message || "Failed to cancel project");
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  return (
    <AdminLayout
      title="Freelance Marketplace Moderation"
      subtitle="Monitor client gig requests, review proposal activity, and moderate inappropriate projects"
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
              fetchFreelance(1);
            }}
            className="relative w-full sm:w-80"
          >
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, client name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </form>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Statuses</option>
              <option value="open" className="bg-slate-900 text-slate-300">Open</option>
              <option value="in_progress" className="bg-slate-900 text-slate-300">In Progress</option>
              <option value="completed" className="bg-slate-900 text-slate-300">Completed</option>
              <option value="cancelled" className="bg-slate-900 text-slate-300">Cancelled</option>
            </select>

            <button
              onClick={() => fetchFreelance(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Freelance Projects Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Project Title</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Proposals</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                    <div>Loading freelance projects...</div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No freelance projects found matching criteria.
                  </td>
                </tr>
              ) : (
                projects.map((fp) => (
                  <tr key={fp.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{fp.title}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{fp.budgetType} budget</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <User size={12} className="text-cyan-400" />
                        <span>{fp.client?.name}</span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px] pl-4">
                        {fp.client?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-300">
                      {fp.category}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-bold text-slate-200">
                      {fp.budgetMin ? `₹${Number(fp.budgetMin).toLocaleString()}` : "Open"}
                      {fp.budgetMax ? ` - ₹${Number(fp.budgetMax).toLocaleString()}` : ""}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-bold text-cyan-400">
                      {fp.proposalCount || 0} proposals
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          fp.status === "open"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : fp.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                            : fp.status === "completed"
                            ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {fp.status.toUpperCase().replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {new Date(fp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/freelance/projects/${fp.id}`}
                          target="_blank"
                          title="View project gig"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        >
                          <Eye size={13} />
                        </Link>

                        {fp.status === "open" && (
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ project: fp })}
                            title="Cancel open gig"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
                          >
                            <XCircle size={13} />
                          </button>
                        )}
                      </div>
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
              {pagination.total} freelance gigs)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchFreelance(pagination.page - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchFreelance(pagination.page + 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-400" />
              Cancel Inappropriate Freelance Project
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel the freelance project{" "}
              <span className="font-bold text-white">{confirmModal.project.title}</span>?
              This will close the project to new bids and mark it as cancelled.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleCancelProject(confirmModal.project)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-400 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
