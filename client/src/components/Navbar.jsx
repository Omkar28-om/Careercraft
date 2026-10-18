import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Code2,
  BookOpen,
  BriefcaseBusiness,
  Sparkles,
  Compass,
  LayoutDashboard,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Bell,
  ShieldAlert,
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUnreadNotificationCount } from "../services/api";
import GlobalSearchModal from "./GlobalSearchModal";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpportunitiesOpen(false);
  }, [location.pathname]);

  // Fetch unread notifications
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;
    const fetchCount = async () => {
      try {
        const res = await getUnreadNotificationCount();
        if (isMounted && res && res.success) {
          setUnreadCount(res.unreadCount || 0);
        }
      } catch {
        // Silent catch for navbar badge
      }
    };

    fetchCount();
    const handleFocus = () => fetchCount();
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(fetchCount, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/", { replace: true });
  };

  // Keep the main navigation centered on learning, practice, and building.
  const primaryNavItems = [
    { name: "Domains", path: "/domains", icon: Compass },
    { name: "Courses", path: "/courses", icon: BookOpen },
    { name: "Practice", path: "/coding", icon: Code2 },
    { name: "Projects", path: "/projects", icon: Layers },
    { name: "Resume", path: "/resume", icon: FileText },
  ];
  const opportunityItems = [
    { name: "Jobs", path: "/jobs", icon: BriefcaseBusiness },
    { name: "Internships", path: "/internships", icon: GraduationCap },
    { name: "Freelance", path: "/freelance", icon: Sparkles },
  ];
  const isOpportunityActive = ["/jobs", "/internships", "/freelance"].some((path) =>
    location.pathname.startsWith(path)
  );

  const isAdmin = user && (user.role === "admin" || user.role === "superadmin");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080B14]/90 backdrop-blur-xl transition-all">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/careercraft-logo.png"
              alt="CareerCraft"
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <div className="text-lg font-black tracking-tight text-white leading-none">
                Career<span className="text-[#8B5CF6]">Craft</span>
              </div>
              <div className="hidden text-[8px] font-bold tracking-[0.25em] text-[#94A3B8] sm:block uppercase mt-0.5">
                Skills • Opportunities • Growth
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {primaryNavItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#8B5CF6]/15 text-[#C4B5FD] font-bold border border-[#8B5CF6]/30 shadow-sm shadow-purple-500/10"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {item.name}
                </NavLink>
              );
            })}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpportunitiesOpen((open) => !open)}
                aria-expanded={opportunitiesOpen}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isOpportunityActive
                    ? "border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 text-[#C4B5FD]"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                Opportunities <ChevronDown size={13} />
              </button>
              {opportunitiesOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-[#111827] p-2 shadow-2xl shadow-black/40">
                  {opportunityItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Icon size={16} className="text-cyan-300" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-400 hover:border-cyan-400/30 hover:text-white transition cursor-pointer"
              title="Search CareerCraft (Ctrl+K)"
            >
              <Search size={14} className="text-cyan-400" />
              <span className="hidden xl:inline text-xs">Search...</span>
              <kbd className="hidden xl:inline-block rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-400">
                Ctrl K
              </kbd>
            </button>

            {user ? (
              <>
                {/* Admin Console entry (Admins only) */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    title="Admin Console"
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    <ShieldAlert size={14} />
                    <span className="hidden lg:inline">Admin</span>
                  </Link>
                )}

                {/* Dashboard Shortcut */}
                <Link
                  to="/dashboard"
                  title="Student Dashboard"
                  className={`flex items-center justify-center h-9 w-9 rounded-xl border transition ${
                    location.pathname === "/dashboard"
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300 font-bold"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <LayoutDashboard size={16} />
                </Link>

                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  title="Notifications"
                  className="relative flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:border-cyan-400/40 hover:text-white hover:bg-white/[0.06]"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-extrabold text-slate-950 shadow-sm shadow-cyan-400/50">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  title="My Profile"
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition ${
                    location.pathname === "/profile"
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:border-white/20"
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300 text-[10px] font-black">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="text-xs font-semibold max-w-[90px] truncate hidden lg:inline">
                    {user.name || "Student"}
                  </span>
                </Link>

              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-purple-500/25 hover:bg-[#7C3AED] transition"
                >
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions: Search Trigger & Hamburger Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300"
              aria-label="Search"
            >
              <Search size={16} />
            </button>

            {user && (
              <Link
                to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-slate-950">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Mobile Drawer Navigation (viewports < 1024px) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 top-16 z-30 flex flex-col bg-[#080B14]/98 backdrop-blur-2xl lg:hidden overflow-y-auto border-t border-white/10 p-5 space-y-6 animate-in slide-in-from-top-2 duration-200"
        >
          {/* User Quick Info if logged in */}
          {user && (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 font-black text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{user.name}</h3>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase border border-cyan-400/20">
                {user.role}
              </span>
            </div>
          )}

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Platform Navigation
            </p>
            {primaryNavItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              const Icon = item.icon || Compass;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl p-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/30"
                      : "text-slate-300 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-cyan-300" : "text-slate-400"} />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="px-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Opportunities
            </p>
            {opportunityItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl p-3 text-sm font-semibold transition ${
                    isActive ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "text-slate-300 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3"><Icon size={18} className="text-slate-400" />{item.name}</span>
                  <ChevronRight size={14} className="text-slate-600" />
                </Link>
              );
            })}
          </div>

          {/* Authenticated Links: Dashboard, Profile, Admin */}
          {user ? (
            <div className="space-y-1 border-t border-white/10 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                My Workspace
              </p>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.03] hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18} className="text-slate-400" />
                  <span>Student Dashboard</span>
                </div>
                <ChevronRight size={14} className="text-slate-600" />
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.03] hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <User size={18} className="text-slate-400" />
                  <span>Portfolio & Profile</span>
                </div>
                <ChevronRight size={14} className="text-slate-600" />
              </Link>

              <Link
                to="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.03] hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <Layers size={18} className="text-slate-400" />
                  <span>My Portfolio Projects</span>
                </div>
                <ChevronRight size={14} className="text-slate-600" />
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl p-3 text-sm font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={18} className="text-rose-400" />
                    <span>Admin Console</span>
                  </div>
                  <ChevronRight size={14} className="text-rose-400" />
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between rounded-xl p-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition mt-2 text-left"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  <span>Log Out</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center rounded-xl bg-cyan-400 p-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20"
              >
                Start Learning Today
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
