import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Building2,
  ArrowLeft,
  Send,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  GraduationCap,
  FileText,
  Link as LinkIcon,
  X,
  ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { getJob, applyToJob, saveJob, unsaveJob } from "../api";
import { useAuth } from "../context/AuthContext";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply modal states
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getJob(id);
      if (res?.success && res?.job) {
        setJob(res.job);
      } else {
        setError(res?.message || "Job not found");
      }
    } catch (err) {
      console.error("Failed to load job details:", err);
      setError(err?.message || "Failed to load opportunity details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleToggleSave = async () => {
    if (!user) {
      alert("Please log in to save jobs.");
      return;
    }
    if (!job) return;

    try {
      if (job.isSaved) {
        await unsaveJob(job.id);
        setJob((prev) => ({ ...prev, isSaved: false }));
      } else {
        await saveJob(job.id);
        setJob((prev) => ({ ...prev, isSaved: true }));
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
      alert(err?.message || "Action failed.");
    }
  };

  const handleOpenApplyModal = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSubmitError("");
    setSubmitSuccess(false);
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (coverNote.length > 3000) {
      setSubmitError("Cover note cannot exceed 3000 characters.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await applyToJob(job.id, {
        coverNote: coverNote.trim() || null,
        resumeUrl: resumeUrl.trim() || null,
      });

      if (res?.success) {
        setSubmitSuccess(true);
        setJob((prev) => ({
          ...prev,
          hasApplied: true,
          applicationStatus: "applied",
        }));
        setTimeout(() => {
          setIsApplyModalOpen(false);
          setSubmitSuccess(false);
        }, 1500);
      } else {
        setSubmitError(res?.message || "Failed to submit application.");
      }
    } catch (err) {
      console.error("Failed to submit application:", err);
      setSubmitError(err?.message || "Application submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const isDeadlinePassed = job?.applicationDeadline
    ? new Date(job.applicationDeadline) < new Date().setHours(0, 0, 0, 0)
    : false;

  const formatSalary = (jobData) => {
    if (!jobData?.salaryMin && !jobData?.salaryMax) return "Competitive";
    if (jobData.jobType === "internship") {
      return `₹${Number(jobData.salaryMin || 0).toLocaleString()} - ₹${Number(
        jobData.salaryMax || 0
      ).toLocaleString()} / month`;
    }
    const minLPA = (jobData.salaryMin / 100000).toFixed(1);
    const maxLPA = (jobData.salaryMax / 100000).toFixed(1);
    return `₹${minLPA} - ₹${maxLPA} LPA`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 size={36} className="animate-spin text-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">Loading opportunity details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Position Not Found</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {error || "This job or internship listing could not be found."}
          </p>
          <Link to="/jobs" className="mt-6">
            <Button variant="primary" size="sm" icon={ArrowLeft} iconPosition="left">
              Back to Opportunities
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isInternship = job.jobType === "internship";

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to CareerCraft Opportunities</span>
          </Link>
        </div>

        {/* Opportunity Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B14] p-6 sm:p-10 backdrop-blur-xl">
          <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              {/* Company Logo */}
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {job.companyLogoUrl ? (
                  <img
                    src={job.companyLogoUrl}
                    alt={job.companyName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-2xl">
                    {job.companyName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    {job.companyName}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">{job.category}</span>
                  {(job.applicationUrl?.includes("careercraft.local") ||
                    job.applicationUrl?.includes("demo") ||
                    job.isDemo ||
                    job.companyName === "Google" ||
                    job.companyName === "Microsoft" ||
                    job.companyName === "Amazon") ? (
                    <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      Demo Opportunity
                    </span>
                  ) : (
                    (job.isVerified || job.verified) && (
                      <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                        Verified Employer
                      </span>
                    )
                  )}
                  {job.hasApplied && (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Applied ({job.applicationStatus || "applied"})
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-cyan-400" />
                    <span>{job.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-cyan-400" />
                    <span className="capitalize">{job.workMode}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">{formatSalary(job)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                variant={job.isSaved ? "secondary" : "outline"}
                size="md"
                onClick={handleToggleSave}
                icon={job.isSaved ? BookmarkCheck : Bookmark}
                iconPosition="left"
              >
                {job.isSaved ? "Saved" : "Save Opportunity"}
              </Button>

              {job.hasApplied ? (
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  icon={CheckCircle2}
                  iconPosition="left"
                  className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 cursor-default"
                >
                  Application Submitted
                </Button>
              ) : isDeadlinePassed ? (
                <Button variant="outline" size="md" disabled className="text-slate-500">
                  Applications Closed
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenApplyModal}
                  icon={Send}
                  iconPosition="left"
                >
                  Apply Now
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Details Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Specs (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <FileText size={18} className="text-cyan-400" />
                <span>About the Role</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Key Responsibilities */}
            {job.responsibilities?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Layers size={18} className="text-cyan-400" />
                  <span>Key Responsibilities</span>
                </h2>
                <ul className="space-y-2.5">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements & Qualifications */}
            {job.requirements?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span>Requirements & Preferred Skills</span>
                </h2>
                <ul className="space-y-2.5">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Eligibility */}
            {job.eligibility && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                  <GraduationCap size={18} className="text-amber-400" />
                  <span>Student Eligibility Criteria</span>
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {job.eligibility}
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar: Snapshot & Skills */}
          <div className="space-y-6">
            {/* Opportunity Snapshot Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white pb-3 border-b border-white/10">
                Job Overview
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Position Type:</span>
                  <span className="font-semibold text-white capitalize">
                    {isInternship ? "Internship" : "Full-Time Job"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Work Mode:</span>
                  <span className="font-semibold text-white capitalize">{job.workMode}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Experience Level:</span>
                  <span className="font-semibold text-white capitalize">{job.experienceLevel}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Compensation:</span>
                  <span className="font-semibold text-emerald-400">{formatSalary(job)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-white">{job.location}</span>
                </div>

                {job.applicationDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Deadline:</span>
                    <span className="font-semibold text-rose-300">
                      {new Date(job.applicationDeadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CareerCraft XP:</span>
                  <span className="font-semibold text-cyan-400">+5 XP on Apply</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                {job.hasApplied ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-400">
                    Application Submitted ({job.applicationStatus})
                  </div>
                ) : isDeadlinePassed ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs font-semibold text-rose-400">
                    Deadline Passed
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={handleOpenApplyModal}
                  >
                    Apply for this Role
                  </Button>
                )}
              </div>
            </div>

            {/* Targeted Skills Tags */}
            {job.skills?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-xl space-y-3">
                <h3 className="font-bold text-sm text-white">Target Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-300 border border-white/10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B0F19] p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Send size={18} className="text-cyan-400" />
                  <span>Apply to {job.companyName}</span>
                </h2>
                <p className="mt-1 text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                  Position: {job.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white hover:border-white/20 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">Application Submitted!</h3>
                <p className="text-xs text-slate-300">
                  You earned <span className="font-bold text-cyan-400">+5 CareerCraft XP</span>. Track your progress in My Applications.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="mt-6 space-y-4">
                {submitError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                    <p>{submitError}</p>
                  </div>
                )}

                {/* Cover Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Cover Note / Motivation (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Briefly describe why your skills and projects make you a strong fit for this opportunity..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition resize-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Explain relevant coursework, projects, or coding problem experience</span>
                    <span>{coverNote.length}/3000</span>
                  </div>
                </div>

                {/* Resume URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Online Resume / Portfolio Link (Optional)
                  </label>
                  <div className="relative">
                    <LinkIcon
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="url"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or https://yourportfolio.dev"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* XP Note */}
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 flex items-center gap-2.5 text-xs text-slate-300">
                  <Sparkles size={16} className="text-cyan-400 shrink-0" />
                  <span>Submitting this application earns <strong className="text-cyan-400">+5 XP</strong> toward your student level.</span>
                </div>

                {/* Form Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsApplyModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={15} className="animate-spin" />
                        <span>Submitting...</span>
                      </span>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
