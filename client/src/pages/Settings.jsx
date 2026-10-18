import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  Lock,
  LogOut,
  Check,
  AlertCircle,
  RefreshCw,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronRight,
  Briefcase,
  BookOpen,
  Code2,
  Send,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { LoadingScreen } from "../components/ProtectedRoute";
import { getSettings, updateSettings, changePassword } from "../services/api";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, icon: Icon, iconColor = "text-cyan-400", children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className={`mt-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 ${iconColor}`}>
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toast({ message, type = "success", onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles =
    type === "success"
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
      : "bg-rose-500/10 border-rose-500/30 text-rose-300";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${styles}`}
      role="alert"
    >
      {type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B14] ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${
        checked
          ? "border-cyan-500/40 bg-cyan-500/20"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full shadow transition-all ${
          checked
            ? "left-[calc(100%-22px)] bg-cyan-400"
            : "left-0.5 bg-slate-400"
        }`}
      />
    </button>
  );
}

function NotifRow({ icon: Icon, iconColor, label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-white/[0.06] last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <span className={`mt-0.5 rounded-lg p-1.5 ${iconColor}`}>
          <Icon size={14} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function PasswordField({ label, value, onChange, showPassword, onToggle, autoComplete }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Theme Selector ───────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun, desc: "Clean light interface" },
  { value: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, desc: "Follows OS setting" },
];

function ThemeSelector({ current, onChange, saving }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {THEME_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
        const isSelected = current === value;
        return (
          <button
            key={value}
            type="button"
            disabled={saving}
            onClick={() => onChange(value)}
            className={`group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isSelected
                ? "border-cyan-500/50 bg-cyan-500/10 shadow-sm shadow-cyan-500/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            } ${saving ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <span className={`rounded-lg p-2 ${isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-white/[0.04] text-slate-400 group-hover:text-slate-200"}`}>
              <Icon size={18} />
            </span>
            <span className={`text-xs font-bold ${isSelected ? "text-cyan-300" : "text-slate-300"}`}>
              {label}
            </span>
            <span className={`text-[10px] ${isSelected ? "text-cyan-400/70" : "text-slate-500"}`}>
              {desc}
            </span>
            {isSelected && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                <Check size={10} /> Active
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme: currentTheme, setTheme, syncThemeFromServer } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [serverPrefs, setServerPrefs] = useState(null);
  const [serverUser, setServerUser] = useState(null);

  // Notification toggles (local state, saved to server on change)
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    job_notifications: true,
    course_notifications: true,
    coding_notifications: true,
    freelance_notifications: true,
    system_notifications: true,
  });

  // Theme saving
  const [themeSaving, setThemeSaving] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwVisible, setPwVisible] = useState({ current: false, newPw: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  // Load settings from server
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      if (res?.success) {
        setServerUser(res.user);
        setServerPrefs(res.preferences);
        setNotifPrefs({
          job_notifications: res.preferences.job_notifications ?? true,
          course_notifications: res.preferences.course_notifications ?? true,
          coding_notifications: res.preferences.coding_notifications ?? true,
          freelance_notifications: res.preferences.freelance_notifications ?? true,
          system_notifications: res.preferences.system_notifications ?? true,
        });
        // Sync theme from server on page load
        if (res.preferences.theme) {
          syncThemeFromServer(res.preferences.theme);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err?.message);
    } finally {
      setLoading(false);
    }
  }, [syncThemeFromServer]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── Theme change ────────────────────────────────────────────────────────────
  const handleThemeChange = async (newTheme) => {
    if (newTheme === currentTheme || themeSaving) return;
    setThemeSaving(true);
    setTheme(newTheme); // Apply immediately (no flash)
    try {
      await updateSettings({ theme: newTheme });
      showToast(`Theme changed to ${newTheme}`);
    } catch (err) {
      showToast(err?.message || "Failed to save theme", "error");
    } finally {
      setThemeSaving(false);
    }
  };

  // ── Notification toggle ─────────────────────────────────────────────────────
  const handleNotifToggle = async (key, value) => {
    const prev = notifPrefs[key];
    // Optimistic update
    setNotifPrefs((p) => ({ ...p, [key]: value }));
    setNotifSaving(true);
    try {
      await updateSettings({ [key]: value });
      showToast("Notification preference saved");
    } catch (err) {
      // Rollback
      setNotifPrefs((p) => ({ ...p, [key]: prev }));
      showToast(err?.message || "Failed to save preference", "error");
    } finally {
      setNotifSaving(false);
    }
  };

  // ── Password change ─────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(null);

    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError("All fields are required");
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("New passwords do not match");
      return;
    }
    if (pwForm.newPw === pwForm.current) {
      setPwError("New password must differ from current password");
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setPwForm({ current: "", newPw: "", confirm: "" });
      showToast("Password changed successfully");
    } catch (err) {
      setPwError(err?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const togglePwVisible = (field) =>
    setPwVisible((p) => ({ ...p, [field]: !p[field] }));

  if (loading) return <LoadingScreen />;

  const displayUser = serverUser || user;

  const NOTIF_ROWS = [
    {
      key: "job_notifications",
      icon: Briefcase,
      iconColor: "text-amber-400 bg-amber-400/10",
      label: "Jobs & Applications",
      description: "Application status updates, new job recommendations",
    },
    {
      key: "course_notifications",
      icon: BookOpen,
      iconColor: "text-blue-400 bg-blue-400/10",
      label: "Courses & Learning",
      description: "Enrollment confirmations, lesson completions, course updates",
    },
    {
      key: "coding_notifications",
      icon: Code2,
      iconColor: "text-emerald-400 bg-emerald-400/10",
      label: "Coding & Achievements",
      description: "Accepted submissions, achievement unlocks, XP events",
    },
    {
      key: "freelance_notifications",
      icon: Send,
      iconColor: "text-violet-400 bg-violet-400/10",
      label: "Freelance",
      description: "Proposal updates, contract events, payment milestones",
    },
    {
      key: "system_notifications",
      icon: Zap,
      iconColor: "text-cyan-400 bg-cyan-400/10",
      label: "System Notifications",
      description: "Platform updates, security alerts, account events",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] tech-grid-pattern">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-cyan-400">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Settings
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage your account, appearance, and notification preferences.
            </p>
          </div>
        </div>

        {/* ── ACCOUNT ── */}
        <SectionCard
          title="Account"
          subtitle="Your CareerCraft account details"
          icon={User}
          iconColor="text-cyan-400"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Name", value: displayUser?.name || "—" },
              { label: "Email", value: displayUser?.email || "—" },
              {
                label: "Role",
                value: displayUser?.role === "admin" ? "Administrator" : "Student",
                badge: displayUser?.role === "admin",
              },
              {
                label: "Account Status",
                value: displayUser?.status === "suspended" ? "Suspended" : "Active",
                active: displayUser?.status !== "suspended",
              },
            ].map(({ label, value, badge, active }) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {label}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{value}</span>
                  {badge && (
                    <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  )}
                  {active !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      }`}
                    >
                      {active ? "Active" : "Suspended"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {displayUser?.role === "admin" && (
            <a
              href="/admin"
              className="mt-4 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-amber-400" />
                Admin Panel
              </span>
              <ChevronRight size={15} />
            </a>
          )}
        </SectionCard>

        {/* ── APPEARANCE ── */}
        <SectionCard
          title="Appearance"
          subtitle="Choose how CareerCraft looks for you"
          icon={Moon}
          iconColor="text-violet-400"
        >
          <ThemeSelector
            current={currentTheme}
            onChange={handleThemeChange}
            saving={themeSaving}
          />
          {themeSaving && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <RefreshCw size={12} className="animate-spin" /> Saving…
            </p>
          )}
        </SectionCard>

        {/* ── NOTIFICATIONS ── */}
        <SectionCard
          title="Notification Preferences"
          subtitle="Choose which categories of notifications you receive"
          icon={Bell}
          iconColor="text-blue-400"
        >
          <div>
            {NOTIF_ROWS.map((row) => (
              <NotifRow
                key={row.key}
                icon={row.icon}
                iconColor={row.iconColor}
                label={row.label}
                description={row.description}
                checked={notifPrefs[row.key]}
                onChange={(val) => handleNotifToggle(row.key, val)}
                disabled={notifSaving}
              />
            ))}
          </div>
          {notifSaving && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <RefreshCw size={12} className="animate-spin" /> Saving preference…
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Security-critical notifications (account changes, suspicious activity) are
            always delivered regardless of these preferences.
          </p>
        </SectionCard>

        {/* ── SECURITY ── */}
        <SectionCard
          title="Security"
          subtitle="Manage your password and account access"
          icon={Lock}
          iconColor="text-rose-400"
        >
          <form onSubmit={handlePasswordChange} className="space-y-4" noValidate>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock size={14} className="text-rose-400" />
              Change Password
            </h3>

            <PasswordField
              label="Current Password"
              value={pwForm.current}
              onChange={(v) => setPwForm((p) => ({ ...p, current: v }))}
              showPassword={pwVisible.current}
              onToggle={() => togglePwVisible("current")}
              autoComplete="current-password"
            />
            <PasswordField
              label="New Password"
              value={pwForm.newPw}
              onChange={(v) => setPwForm((p) => ({ ...p, newPw: v }))}
              showPassword={pwVisible.newPw}
              onToggle={() => togglePwVisible("newPw")}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm New Password"
              value={pwForm.confirm}
              onChange={(v) => setPwForm((p) => ({ ...p, confirm: v }))}
              showPassword={pwVisible.confirm}
              onToggle={() => togglePwVisible("confirm")}
              autoComplete="new-password"
            />

            {pwError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-300">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {pwError}
              </div>
            )}

            <button
              type="submit"
              disabled={pwSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-500/80 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pwSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Changing…
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Change Password
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/[0.06] pt-6">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <LogOut size={14} className="text-rose-400" />
              Session
            </h3>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-500/30"
            >
              <LogOut size={14} />
              Sign Out
            </button>
            <p className="mt-2 text-xs text-slate-500">
              This will clear your session on this device.
            </p>
          </div>
        </SectionCard>

        {/* ── PRIVACY ── */}
        <SectionCard
          title="Privacy"
          subtitle="Control your public profile visibility"
          icon={Eye}
          iconColor="text-emerald-400"
        >
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
            <p className="text-sm text-slate-300">
              Public profile settings are managed from your{" "}
              <a
                href="/profile"
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition"
              >
                Profile page
              </a>
              .
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              You can control what information is visible to other users and
              recruiters from your profile settings.
            </p>
          </div>
        </SectionCard>
      </main>

      <Footer />

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}