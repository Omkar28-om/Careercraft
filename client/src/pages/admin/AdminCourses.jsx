import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import {
  getAdminCourses,
  publishAdminCourse,
  unpublishAdminCourse,
} from "../../services/api";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { course, action: 'publish'|'unpublish' }

  const fetchCourses = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminCourses({
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        isPublished: statusFilter || undefined,
        page,
        limit: pagination.limit,
      });
      if (res.success) {
        setCourses(res.data.courses);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast("error", err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(1);
  }, [categoryFilter, statusFilter]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePublishToggle = async (course, action) => {
    try {
      setActionLoading(true);
      const res =
        action === "publish"
          ? await publishAdminCourse(course.id)
          : await unpublishAdminCourse(course.id);

      if (res.success) {
        showToast("success", `Course successfully ${action === "publish" ? "published" : "unpublished"}`);
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, isPublished: action === "publish" } : c
          )
        );
      }
    } catch (err) {
      showToast("error", err.message || `Failed to ${action} course`);
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  return (
    <AdminLayout
      title="Course Management"
      subtitle="Inspect course catalog, monitor enrollment statistics, and toggle publication"
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
              fetchCourses(1);
            }}
            className="relative w-full sm:w-80"
          >
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or instructor..."
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
              <option value="" className="bg-slate-900 text-slate-300">All Status</option>
              <option value="true" className="bg-slate-900 text-slate-300">Published</option>
              <option value="false" className="bg-slate-900 text-slate-300">Unpublished</option>
            </select>

            <button
              onClick={() => fetchCourses(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Courses Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Category / Level</th>
                <th className="py-3 px-4">Curriculum</th>
                <th className="py-3 px-4">Students Enrolled</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-2" />
                    <div>Loading courses...</div>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No courses match the criteria.
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{c.title}</div>
                      <div className="text-[11px] text-slate-500">{c.instructorName || "CareerCraft Instructor"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="text-slate-300">{c.category}</div>
                      <span className="text-slate-500 capitalize">{c.level}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-300">
                      {c.sectionCount || 0} sections • {c.lessonCount || 0} lessons
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-bold text-cyan-400">
                      {c.enrollmentCount || 0} students
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          c.isPublished
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {c.isPublished ? "PUBLISHED" : "DRAFT"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/courses/${c.slug}`}
                          target="_blank"
                          title="View course as student"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        >
                          <Eye size={13} />
                        </Link>

                        {c.isPublished ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({ course: c, action: "unpublish" })
                            }
                            title="Unpublish course"
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition cursor-pointer"
                          >
                            <XCircle size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({ course: c, action: "publish" })
                            }
                            title="Publish course"
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
              {pagination.total} courses)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchCourses(pagination.page - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCourses(pagination.page + 1)}
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
              Confirm Course State Change
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to {confirmModal.action}{" "}
              <span className="font-bold text-white">{confirmModal.course.title}</span>?
              {confirmModal.action === "unpublish" &&
                " Students will not be able to find or enroll in this course while unpublished."}
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
                  handlePublishToggle(confirmModal.course, confirmModal.action)
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : `Confirm ${confirmModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
