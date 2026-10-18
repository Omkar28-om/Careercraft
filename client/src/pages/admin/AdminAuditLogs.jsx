import { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Code,
  Calendar,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAdminAuditLogs } from "../../services/api";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminAuditLogs({
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        page,
        limit: pagination.limit,
      });
      if (res.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityFilter]);

  return (
    <AdminLayout
      title="System Audit Logs"
      subtitle="Immutable, append-only record of all administrative actions, moderation, and role modifications"
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <History size={16} className="text-cyan-400" />
            <span>Audit Trail Event Filters</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Entities</option>
              <option value="user" className="bg-slate-900 text-slate-300">User</option>
              <option value="course" className="bg-slate-900 text-slate-300">Course</option>
              <option value="job" className="bg-slate-900 text-slate-300">Job</option>
              <option value="coding_problem" className="bg-slate-900 text-slate-300">Coding Problem</option>
              <option value="project" className="bg-slate-900 text-slate-300">Project</option>
              <option value="freelance_project" className="bg-slate-900 text-slate-300">Freelance Project</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Actions</option>
              <option value="USER_SUSPENDED" className="bg-slate-900 text-slate-300">USER_SUSPENDED</option>
              <option value="USER_REACTIVATED" className="bg-slate-900 text-slate-300">USER_REACTIVATED</option>
              <option value="USER_ROLE_CHANGED" className="bg-slate-900 text-slate-300">USER_ROLE_CHANGED</option>
              <option value="COURSE_PUBLISHED" className="bg-slate-900 text-slate-300">COURSE_PUBLISHED</option>
              <option value="COURSE_UNPUBLISHED" className="bg-slate-900 text-slate-300">COURSE_UNPUBLISHED</option>
              <option value="JOB_ACTIVATED" className="bg-slate-900 text-slate-300">JOB_ACTIVATED</option>
              <option value="JOB_DEACTIVATED" className="bg-slate-900 text-slate-300">JOB_DEACTIVATED</option>
              <option value="CODING_PROBLEM_ACTIVATED" className="bg-slate-900 text-slate-300">CODING_PROBLEM_ACTIVATED</option>
              <option value="CODING_PROBLEM_DEACTIVATED" className="bg-slate-900 text-slate-300">CODING_PROBLEM_DEACTIVATED</option>
              <option value="PROJECT_MODERATED" className="bg-slate-900 text-slate-300">PROJECT_MODERATED</option>
              <option value="FREELANCE_PROJECT_CANCELLED" className="bg-slate-900 text-slate-300">FREELANCE_PROJECT_CANCELLED</option>
            </select>

            <button
              onClick={() => fetchLogs(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4 text-right">Details Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                    <div>Loading audit ledger...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-amber-400" />
                        <span>{log.admin?.name}</span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px] pl-4.5">
                        {log.admin?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-semibold text-cyan-400 capitalize">
                      {log.entityType}
                    </td>
                    <td className="py-3.5 px-4 text-[10px] font-mono text-slate-400">
                      {log.entityId ? log.entityId.slice(0, 8) + "..." : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedDetails(log)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold transition cursor-pointer border border-white/5"
                      >
                        Inspect Payload
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
              {pagination.total} audit events)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Viewer Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Code size={16} className="text-cyan-400" />
                Audit Log Details • {selectedDetails.action}
              </h2>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div>
                <span className="text-slate-500">Admin: </span>
                <span className="font-semibold text-white">{selectedDetails.admin?.name}</span> (
                {selectedDetails.admin?.email})
              </div>
              <div>
                <span className="text-slate-500">Entity: </span>
                <span className="font-semibold text-cyan-400 capitalize">{selectedDetails.entityType}</span> • ID:{" "}
                <span className="font-mono text-slate-300">{selectedDetails.entityId || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500">Timestamp: </span>
                <span className="text-slate-300">{new Date(selectedDetails.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Payload Details (JSON)
              </div>
              <pre className="p-3.5 rounded-xl bg-black/60 border border-white/5 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-60 scrollbar-thin">
                {JSON.stringify(selectedDetails.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
