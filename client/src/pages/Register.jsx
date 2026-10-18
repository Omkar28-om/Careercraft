import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/domains", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // 1. Validate required fields
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please provide your full name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please provide your email address.");
      return;
    }

    if (!password) {
      setError("Please choose a password.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    // 2. Validate email format
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address format.");
      return;
    }

    // 3. Password minimum 8 characters
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    // 4. Passwords must match
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setSubmitting(true);
      await register(trimmedName, trimmedEmail, password);
      setSuccess("Account created successfully");
      navigate("/domains", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const passwordLengthOk = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#8B5CF6]/30 selection:text-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111827] p-8 shadow-2xl backdrop-blur-xl">
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#8B5CF6]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#22D3EE]/10 blur-3xl" />

            {/* Header */}
            <div className="text-center mb-7">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 mb-3.5 shadow-lg shadow-purple-500/10">
                <img
                  src="/careercraft-logo.png"
                  alt="CareerCraft"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Create your Career<span className="text-[#8B5CF6]">Craft</span> Account
              </h1>
              <p className="mt-2 text-xs text-[#94A3B8]">
                Join thousands of students mastering code, courses, jobs, and projects.
              </p>
            </div>

            {/* Success Alert */}
            {success && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                <p className="leading-relaxed">{success}</p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94A3B8]">
                    <User size={16} />
                  </div>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 transition focus:border-[#8B5CF6] focus:bg-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94A3B8]">
                    <Mail size={16} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 transition focus:border-[#8B5CF6] focus:bg-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94A3B8]">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] pl-10 pr-10 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 transition focus:border-[#8B5CF6] focus:bg-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94A3B8]">
                    <Lock size={16} />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] pl-10 pr-10 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 transition focus:border-[#8B5CF6] focus:bg-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password checks helper */}
              <div className="space-y-1.5 pt-1 text-[11px] text-[#94A3B8]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={13}
                    className={passwordLengthOk ? "text-[#10B981]" : "text-slate-600"}
                  />
                  <span className={passwordLengthOk ? "text-[#F8FAFC]" : "text-slate-500"}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={13}
                    className={passwordsMatch ? "text-[#10B981]" : "text-slate-600"}
                  />
                  <span className={passwordsMatch ? "text-[#F8FAFC]" : "text-slate-500"}>
                    Passwords match
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/25 transition hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Footer link to login */}
            <div className="mt-6 border-t border-white/10 pt-5 text-center text-xs text-[#94A3B8]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#A78BFA] transition hover:text-[#C4B5FD] hover:underline"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
