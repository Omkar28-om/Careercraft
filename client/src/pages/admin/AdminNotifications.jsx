import { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  ExternalLink,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAdminNotifications } from "../../services/api";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminNotifications({
        type: typeFilter || undefined,
        userId: userIdFilter.trim() || undefined,
        page,
        limit: pagination.limit,
      });
      if (res.success) {
        setNotifications(res.data.notifications);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, [typeFilter]);

  return (
    <AdminLayout
      title="Platform Notifications Overview"
      subtitle="Read-only system log of notifications dispatched across all platform activities"
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchNotifications(1);
            }}
            className="relative w-full sm:w-80"
          >
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by Recipient User UUID..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </form>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Event Types</option>
              <option value="JOB_APPLICATION" className="bg-slate-900 text-slate-300">Job Application</option>
              <option value="APPLICATION_STATUS_UPDATE" className="bg-slate-900 text-slate-300">Application Update</option>
              <option value="COURSE_ENROLLMENT" className="bg-slate-900 text-slate-300">Course Enrollment</option>
              <option value="COURSE_COMPLETED" className="bg-slate-900 text-slate-300">Course Completion</option>
              <option value="ACHIEVEMENT_UNLOCKED" className="bg-slate-900 text-slate-300">Achievement Unlocked</option>
              <option value="FREELANCE_PROPOSAL_RECEIVED" className="bg-slate-900 text-slate-300">Proposal Received</option>
              <option value="FREELANCE_PROPOSAL_ACCEPTED" className="bg-slate-900 text-slate-300">Proposal Accepted</option>
              <option value="FREELANCE_CONTRACT_COMPLETED" className="bg-slate-900 text-slate-300">Contract Completed</option>
            </select>

            <button
              onClick={() => fetchNotifications(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title & Message</th>
                <th className="py-3 px-4">Link Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Dispatched</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                    <div>Loading notifications history...</div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No notifications recorded matching this filter.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="font-semibold text-white">{n.recipientName}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{n.recipientEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {n.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-slate-200">{n.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{n.message}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-mono text-slate-400">
                      {n.link ? (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <ExternalLink size={10} />
                          <span>{n.link}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          n.isRead
                            ? "bg-slate-500/10 text-slate-400"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {n.isRead ? "READ" : "UNREAD"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleString()}
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
              {pagination.total} notifications)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchNotifications(pagination.page - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchNotifications(pagination.page + 1)}
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
