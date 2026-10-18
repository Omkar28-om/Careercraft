import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  Briefcase,
  BookOpen,
  Code2,
  Trophy,
  Send,
  UserCheck,
  Layers,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/ProtectedRoute";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/api";

function getNotificationVisuals(type) {
  switch (type) {
    case "job_application":
    case "job_status_update":
      return {
        icon: Briefcase,
        color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        badge: "Job",
      };
    case "course_enrolled":
    case "course_completed":
    case "lesson_completed":
      return {
        icon: BookOpen,
        color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
        badge: "Course",
      };
    case "coding_accepted":
      return {
        icon: Code2,
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        badge: "Coding",
      };
    case "achievement_unlocked":
      return {
        icon: Trophy,
        color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
        badge: "Achievement",
      };
    case "level_up":
      return {
        icon: Sparkles,
        color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
        badge: "Level Up",
      };
    case "freelance_proposal_submitted":
    case "freelance_proposal_accepted":
    case "freelance_proposal_rejected":
      return {
        icon: Send,
        color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
        badge: "Proposal",
      };
    case "freelance_contract_started":
    case "freelance_contract_completed":
    case "freelance_contract_cancelled":
      return {
        icon: Layers,
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        badge: "Contract",
      };
    case "profile_milestone":
      return {
        icon: UserCheck,
        color: "text-teal-400 bg-teal-400/10 border-teal-400/20",
        badge: "Profile",
      };
    default:
      return {
        icon: Bell,
        color: "text-slate-400 bg-slate-400/10 border-slate-400/20",
        badge: "System",
      };
  }
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotificationsList = useCallback(async (page = 1, activeFilter = filter) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getNotifications({
        page,
        limit: 20,
        unreadOnly: activeFilter === "unread",
      });

      if (res && res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
        setPagination(res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user) {
      fetchNotificationsList(1, filter);
    }
  }, [user, filter, fetchNotificationsList]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      if (filter === "unread") {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteNotification(id);
      const deletedItem = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col font-sans tech-grid-pattern">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Bell size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-400 text-slate-950">
                      {unreadCount} unread
                    </span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Stay updated on applications, achievements, coding progress, and marketplace events.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-cyan-400/30 transition cursor-pointer"
              >
                <CheckCheck size={14} className="text-cyan-400" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <div className="inline-flex rounded-xl p-1 bg-white/[0.03] border border-white/10">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === "all"
                  ? "bg-cyan-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Notifications
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filter === "unread"
                  ? "bg-cyan-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filter === "unread" ? "bg-slate-950 text-cyan-400 font-bold" : "bg-cyan-500/20 text-cyan-300"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline">
            Showing {notifications.length} of {pagination.total}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-3">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center my-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-400 mb-4">
              <Bell size={26} className="text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-white">You&apos;re all caught up.</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              {filter === "unread"
                ? "No unread notifications right now. Check back later for career, course, or coding updates."
                : "Updates on your applications, achievements, coding progress, and marketplace contracts will appear here."}
            </p>
            {filter === "unread" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-400 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition cursor-pointer"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6 my-4">
            {(() => {
              const now = new Date();
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

              const todayItems = notifications.filter(
                (n) => new Date(n.createdAt) >= todayStart
              );
              const earlierItems = notifications.filter(
                (n) => new Date(n.createdAt) < todayStart
              );

              const renderGroup = (items, groupTitle) => (
                <div key={groupTitle} className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    {groupTitle} ({items.length})
                  </div>
                  {items.map((item) => {
                    const { icon: ItemIcon, color: itemColor, badge: itemBadge } = getNotificationVisuals(
                      item.type
                    );

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border transition duration-200 cursor-pointer ${
                          item.isRead
                            ? "bg-white/[0.015] border-white/5 hover:bg-white/[0.035] hover:border-white/15"
                            : "bg-cyan-950/20 border-cyan-500/30 hover:bg-cyan-950/30 hover:border-cyan-400/50 shadow-sm shadow-cyan-950/30"
                        }`}
                      >
                        {/* Unread Indicator Bar / Dot */}
                        {!item.isRead && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )}

                        {/* Icon */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${itemColor}`}
                        >
                          <ItemIcon size={18} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {itemBadge}
                            </span>
                            <span className="text-[11px] text-slate-500">•</span>
                            <span className="text-xs text-slate-400">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                            {item.link && (
                              <span className="inline-flex items-center text-[10px] text-cyan-400/80 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                View <ExternalLink size={10} />
                              </span>
                            )}
                          </div>

                          <h4
                            className={`text-sm font-semibold leading-snug truncate ${
                              item.isRead ? "text-slate-200 font-normal" : "text-white font-bold"
                            }`}
                          >
                            {item.title}
                          </h4>

                          <p className="mt-0.5 text-xs text-slate-300 leading-relaxed line-clamp-2">
                            {item.message}
                          </p>
                        </div>

                        {/* Right Action Icons */}
                        <div className="flex items-center gap-1.5 self-center shrink-0">
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              title="Mark as read"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition cursor-pointer"
                            >
                              <Check size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(item.id, e)}
                            title="Delete notification"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );

              return (
                <>
                  {todayItems.length > 0 && renderGroup(todayItems, "Today")}
                  {earlierItems.length > 0 && renderGroup(earlierItems, "Earlier")}
                </>
              );
            })()}
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchNotificationsList(pagination.page - 1, filter)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-xs font-medium text-slate-300 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchNotificationsList(pagination.page + 1, filter)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-xs font-medium text-slate-300 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
