import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  UserX,
  UserCheck,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import {
  getAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
} from "../../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'status'|'role', user, newStatus, newRole }

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: pagination.limit,
      });
      if (res.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast("error", err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      setActionLoading(true);
      const res = await updateAdminUserStatus(user.id, newStatus);
      if (res.success) {
        showToast("success", `User ${user.name} is now ${newStatus}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
      }
    } catch (err) {
      showToast("error", err.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      setActionLoading(true);
      const res = await updateAdminUserRole(user.id, newRole);
      if (res.success) {
        showToast("success", `User ${user.name} role changed to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      showToast("error", err.message || "Failed to update user role");
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle="Inspect platform accounts, manage administrative roles, and enforce moderation"
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
              toast.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
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

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </form>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Roles</option>
              <option value="student" className="bg-slate-900 text-slate-300">Students</option>
              <option value="admin" className="bg-slate-900 text-slate-300">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Statuses</option>
              <option value="active" className="bg-slate-900 text-slate-300">Active</option>
              <option value="suspended" className="bg-slate-900 text-slate-300">Suspended</option>
            </select>

            <button
              onClick={() => fetchUsers(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">College / Degree</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                    <div>Loading user directory...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No users match the search and filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "admin"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        }`}
                      >
                        {u.role === "admin" && <Shield size={10} />}
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      <div>{u.college || "—"}</div>
                      <div className="text-slate-500">{u.degree || ""}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/users/${u.id}`}
                          title="View detailed student record"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        >
                          <Eye size={13} />
                        </Link>

                        {u.status === "active" ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                type: "status",
                                user: u,
                                newStatus: "suspended",
                              })
                            }
                            title="Suspend user account"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
                          >
                            <UserX size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                type: "status",
                                user: u,
                                newStatus: "active",
                              })
                            }
                            title="Reactivate user account"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition cursor-pointer"
                          >
                            <UserCheck size={13} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              type: "role",
                              user: u,
                              newRole: u.role === "admin" ? "student" : "admin",
                            })
                          }
                          title={`Change role to ${u.role === "admin" ? "student" : "admin"}`}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition cursor-pointer"
                        >
                          <Shield size={13} />
                        </button>
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
              {pagination.total} users)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
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
              Confirm Administrative Action
            </h2>

            {confirmModal.type === "status" ? (
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to change the status of{" "}
                <span className="font-bold text-white">{confirmModal.user.name}</span> to{" "}
                <span className="font-bold text-amber-300 uppercase">
                  {confirmModal.newStatus}
                </span>
                ? Suspended accounts cannot perform authenticated actions.
              </p>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to change the role of{" "}
                <span className="font-bold text-white">{confirmModal.user.name}</span> from{" "}
                <span className="font-bold uppercase text-slate-400">{confirmModal.user.role}</span> to{" "}
                <span className="font-bold uppercase text-cyan-300">{confirmModal.newRole}</span>?
              </p>
            )}

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
                onClick={() => {
                  if (confirmModal.type === "status") {
                    handleStatusChange(confirmModal.user, confirmModal.newStatus);
                  } else {
                    handleRoleChange(confirmModal.user, confirmModal.newRole);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm & Execute"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
