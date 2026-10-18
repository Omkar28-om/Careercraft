import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Building,
  MapPin,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAdminJobs, updateAdminJobStatus } from "../../services/api";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { job, newActive }

  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminJobs({
        search: search.trim() || undefined,
        jobType: typeFilter || undefined,
        isActive: statusFilter || undefined,
        page,
        limit: pagination.limit,
      });
      if (res.success) {
        setJobs(res.data.jobs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast("error", err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
  }, [typeFilter, statusFilter]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleStatus = async (job, newActive) => {
    try {
      setActionLoading(true);
      const res = await updateAdminJobStatus(job.id, { isActive: newActive });
      if (res.success) {
        showToast("success", `Listing successfully ${newActive ? "activated" : "deactivated"}`);
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isActive: newActive } : j))
        );
      }
    } catch (err) {
      showToast("error", err.message || "Failed to update job status");
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  return (
    <AdminLayout
      title="Job & Internship Management"
      subtitle="Inspect recruitment postings, monitor candidate volume, and toggle active status"
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
              fetchJobs(1);
            }}
            className="relative w-full sm:w-80"
          >
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title or company..."
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
              <option value="" className="bg-slate-900 text-slate-300">All Types</option>
              <option value="job" className="bg-slate-900 text-slate-300">Jobs</option>
              <option value="internship" className="bg-slate-900 text-slate-300">Internships</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Status</option>
              <option value="true" className="bg-slate-900 text-slate-300">Active</option>
              <option value="false" className="bg-slate-900 text-slate-300">Inactive</option>
            </select>

            <button
              onClick={() => fetchJobs(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Title & Company</th>
                <th className="py-3 px-4">Type / Mode</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Applications</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                    <div>Loading recruitment listings...</div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No jobs match the specified criteria.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{j.title}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Building size={11} className="text-slate-500" />
                        <span>{j.companyName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <span className="capitalize text-slate-200">{j.jobType}</span>
                      <div className="text-slate-500 capitalize">{j.workMode || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-slate-500" />
                        <span>{j.location || "Remote"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {j.applicationDeadline
                        ? new Date(j.applicationDeadline).toLocaleDateString()
                        : "Open"}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-bold text-cyan-400">
                      {j.applicationCount || 0} candidates
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          j.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {j.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/jobs/${j.id}`}
                          target="_blank"
                          title="View job posting"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        >
                          <Eye size={13} />
                        </Link>

                        {j.isActive ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({ job: j, newActive: false })
                            }
                            title="Deactivate listing"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
                          >
                            <XCircle size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({ job: j, newActive: true })
                            }
                            title="Activate listing"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition cursor-pointer"
                          >
                            <CheckCircle size={13} />
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
              {pagination.total} postings)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchJobs(pagination.page - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchJobs(pagination.page + 1)}
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
              <AlertTriangle size={18} className="text-amber-400" />
              Confirm Listing State Change
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to{" "}
              <span className="font-bold text-white">
                {confirmModal.newActive ? "activate" : "deactivate"}
              </span>{" "}
              the posting for <span className="font-bold text-cyan-300">{confirmModal.job.title}</span> at{" "}
              <span className="font-semibold text-white">{confirmModal.job.companyName}</span>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  handleToggleStatus(confirmModal.job, confirmModal.newActive)
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
