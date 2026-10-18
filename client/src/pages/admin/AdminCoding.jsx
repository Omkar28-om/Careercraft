import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import {
  getAdminCodingProblems,
  updateAdminCodingProblemStatus,
} from "../../services/api";

export default function AdminCoding() {
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchProblems = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminCodingProblems({
        search: search.trim() || undefined,
        difficulty: difficultyFilter || undefined,
        isActive: statusFilter || undefined,
        page,
        limit: pagination.limit,
      });
      if (res.success) {
        setProblems(res.data.problems);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast("error", err.message || "Failed to load coding problems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems(1);
  }, [difficultyFilter, statusFilter]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleStatus = async (prob, newActive) => {
    try {
      setActionLoading(true);
      const res = await updateAdminCodingProblemStatus(prob.id, { isActive: newActive });
      if (res.success) {
        showToast("success", `Problem ${newActive ? "activated" : "deactivated"} successfully`);
        setProblems((prev) =>
          prev.map((p) => (p.id === prob.id ? { ...p, isActive: newActive, isPublished: newActive } : p))
        );
      }
    } catch (err) {
      showToast("error", err.message || "Failed to update problem status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Coding Platform Management"
      subtitle="Inspect coding challenges, test case counts, and manage availability"
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
              fetchProblems(1);
            }}
            className="relative w-full sm:w-80"
          >
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search problem title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </form>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Difficulties</option>
              <option value="Easy" className="bg-slate-900 text-slate-300">Easy</option>
              <option value="Medium" className="bg-slate-900 text-slate-300">Medium</option>
              <option value="Hard" className="bg-slate-900 text-slate-300">Hard</option>
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
              onClick={() => fetchProblems(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Problems Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Problem</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Test Cases</th>
                <th className="py-3 px-4">Submissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                    <div>Loading coding problems...</div>
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No coding problems found matching criteria.
                  </td>
                </tr>
              ) : (
                problems.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{p.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">/{p.slug}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.difficulty === "Easy"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : p.difficulty === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-300">
                      {p.category || "Algorithms"}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {p.testCaseCount || 0} test cases
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-bold text-cyan-400">
                      {p.submissionCount || 0} attempts
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {p.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/coding/problems/${p.slug}`}
                          target="_blank"
                          title="Open challenge in IDE"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        >
                          <Terminal size={13} />
                        </Link>

                        {p.isActive ? (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleStatus(p, false)}
                            title="Deactivate challenge"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
                          >
                            <XCircle size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleStatus(p, true)}
                            title="Activate challenge"
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
              {pagination.total} problems)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchProblems(pagination.page - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProblems(pagination.page + 1)}
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
