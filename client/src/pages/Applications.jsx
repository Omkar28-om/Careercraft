import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Search,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { getApplications, withdrawApplication } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fetchUserApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getApplications();
      if (res?.success && Array.isArray(res.applications)) {
        setApplications(res.applications);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
      setError(err?.message || "Failed to load submitted applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserApplications();
  }, [fetchUserApplications]);

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) {
      return;
    }

    try {
      setWithdrawingId(applicationId);
      const res = await withdrawApplication(applicationId);
      if (res?.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: "withdrawn" } : app
          )
        );
      } else {
        alert(res?.message || "Failed to withdraw application.");
      }
    } catch (err) {
      console.error("Withdrawal failed:", err);
      alert(err?.message || "Failed to withdraw application.");
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "applied":
        return { variant: "cyan", label: "Applied" };
      case "under_review":
        return { variant: "yellow", label: "Under Review" };
      case "shortlisted":
        return { variant: "purple", label: "Shortlisted" };
      case "interview":
        return { variant: "warning", label: "Interview Scheduled" };
      case "selected":
        return { variant: "emerald", label: "Selected 🎉" };
      case "rejected":
        return { variant: "rose", label: "Not Selected" };
      case "withdrawn":
        return { variant: "default", label: "Withdrawn" };
      default:
        return { variant: "default", label: status };
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-400/20">
                Application Pipeline
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Job & Internship Applications
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Track your interview pipelines, review status changes, and manage your applications.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/jobs">
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Explore More Jobs
              </Button>
            </Link>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-rose-400 shrink-0" size={20} />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
            <button
              onClick={fetchUserApplications}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Applications List */}
        <div className="mt-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
              <p className="text-sm">Loading your applications from PostgreSQL...</p>
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              title="No applications submitted yet"
              description="Browse our curated career opportunities and submit your profile with verified skills and projects."
              actionLabel="Explore Opportunities"
              onAction={() => window.location.assign("/jobs")}
            />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const badge = getStatusBadge(app.status);
                const canWithdraw = app.status === "applied" || app.status === "under_review";
                const isWithdrawing = withdrawingId === app.id;

                return (
                  <div
                    key={app.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6 transition hover:border-cyan-400/30 hover:bg-white/[0.035]"
                  >
                    {/* Left: Role Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {app.companyLogoUrl ? (
                          <img
                            src={app.companyLogoUrl}
                            alt={app.companyName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-base">
                            {app.companyName?.charAt(0) || "C"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-white hover:text-cyan-300 transition truncate">
                            <Link to={`/jobs/${app.jobId}`}>{app.jobTitle}</Link>
                          </h3>
                          <Badge variant={badge.variant} size="xs">
                            {badge.label}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">{app.companyName}</span>
                          <span>•</span>
                          <span className="capitalize">{app.workMode}</span>
                          <span>•</span>
                          <span>{app.location}</span>
                          <span>•</span>
                          <span className="capitalize">
                            {app.jobType === "internship" ? "Internship" : "Full-Time"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                          <Calendar size={12} />
                          <span>
                            Applied on{" "}
                            {new Date(app.appliedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <Link to={`/jobs/${app.jobId}`}>
                        <Button variant="outline" size="sm">
                          View Job Details
                        </Button>
                      </Link>

                      {canWithdraw && (
                        <button
                          type="button"
                          onClick={() => handleWithdraw(app.id)}
                          disabled={isWithdrawing}
                          className="px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition cursor-pointer"
                        >
                          {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
