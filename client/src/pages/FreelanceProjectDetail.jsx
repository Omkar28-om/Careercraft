import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  DollarSign,
  Clock,
  Send,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  Loader2,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  Users,
  Check,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  getFreelanceProject,
  submitProposal,
  getProjectProposals,
  acceptProposal,
  rejectProposal,
  saveFreelanceProject,
  unsaveFreelanceProject,
} from "../api";

export default function FreelanceProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Proposal submission modal
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState("");
  const [proposalSuccess, setProposalSuccess] = useState("");
  const [proposalFormData, setProposalFormData] = useState({
    coverLetter: "",
    proposedAmount: "",
    estimatedDays: "",
  });

  // Owner manage proposals
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalActionLoading, setProposalActionLoading] = useState(null);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getFreelanceProject(id);
      if (res?.success && res.project) {
        setProject(res.project);
        if (res.project.budgetMin) {
          setProposalFormData((prev) => ({
            ...prev,
            proposedAmount: String(res.project.budgetMin),
            estimatedDays: res.project.durationDays ? String(res.project.durationDays) : "7",
          }));
        }

        // If owner, fetch received proposals
        if (res.project.isOwner) {
          fetchOwnerProposals();
        }
      } else {
        setError(res?.message || "Failed to load project");
      }
    } catch (err) {
      setError(err?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerProposals = async () => {
    try {
      setLoadingProposals(true);
      const res = await getProjectProposals(id);
      if (res?.success) {
        setProposals(res.proposals || []);
      }
    } catch (err) {
      console.error("Failed to load project proposals:", err);
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id, user]);

  const handleToggleSave = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/freelance/projects/${id}` } });
      return;
    }

    try {
      if (project.isSaved) {
        await unsaveFreelanceProject(id);
      } else {
        await saveFreelanceProject(id);
      }
      setProject((prev) => ({ ...prev, isSaved: !prev.isSaved }));
    } catch (err) {
      console.error("Failed to toggle save project:", err);
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: `/freelance/projects/${id}` } });
      return;
    }

    setSubmittingProposal(true);
    setProposalError("");
    setProposalSuccess("");

    try {
      const res = await submitProposal(id, {
        coverLetter: proposalFormData.coverLetter.trim(),
        proposedAmount: Number(proposalFormData.proposedAmount),
        estimatedDays: Number(proposalFormData.estimatedDays),
      });

      if (res?.success) {
        setProposalSuccess("Proposal submitted successfully! (+5 XP)");
        setProject((prev) => ({
          ...prev,
          hasProposed: true,
          proposalCount: (prev.proposalCount || 0) + 1,
        }));
        setTimeout(() => {
          setIsProposalModalOpen(false);
        }, 1200);
      }
    } catch (err) {
      setProposalError(err.message || "Failed to submit proposal");
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    if (!window.confirm("Accept this proposal and start active contract? All other proposals will be marked rejected.")) {
      return;
    }

    setProposalActionLoading(proposalId);
    try {
      const res = await acceptProposal(proposalId);
      if (res?.success) {
        alert("Proposal accepted! An active contract has been established.");
        fetchProjectDetails();
        fetchOwnerProposals();
      }
    } catch (err) {
      alert(err.message || "Failed to accept proposal");
    } finally {
      setProposalActionLoading(null);
    }
  };

  const handleRejectProposal = async (proposalId) => {
    setProposalActionLoading(proposalId);
    try {
      const res = await rejectProposal(proposalId);
      if (res?.success) {
        setProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? { ...p, status: "rejected" } : p))
        );
      }
    } catch (err) {
      alert(err.message || "Failed to reject proposal");
    } finally {
      setProposalActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 size={36} className="animate-spin text-cyan-400 mb-4" />
          <p className="text-sm text-slate-400">Loading project details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle size={44} className="text-rose-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            {error || "The requested freelance opportunity does not exist or may have been removed."}
          </p>
          <Link to="/freelance">
            <Button variant="secondary" icon={ChevronLeft} iconPosition="left">
              Back to Marketplace
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = project.isOwner;
  const isOpen = project.status === "open";

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/freelance"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition"
          >
            <ChevronLeft size={16} />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="cyan" size="xs">
                    {project.category}
                  </Badge>
                  <span className="rounded bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-400 capitalize">
                    {project.status.replace("_", " ")}
                  </span>
                  {project.experienceLevel && (
                    <span className="rounded bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-400 capitalize">
                      {project.experienceLevel}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleSave}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  {project.isSaved ? (
                    <>
                      <BookmarkCheck size={14} className="text-cyan-400" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark size={14} />
                      <span>Bookmark</span>
                    </>
                  )}
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {project.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-white/5 pt-4">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-cyan-400" />
                  <span>{project.proposalCount} Proposals</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-cyan-400" />
                  <span>
                    {project.durationDays ? `${project.durationDays} Days Duration` : "Flexible Duration"}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-cyan-400" />
                  <span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>

            {/* Description Card */}
            <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6 sm:p-8">
              <h3 className="text-base font-bold text-white mb-3">Project Description</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {project.description}
              </p>

              {/* Skills Required */}
              {Array.isArray(project.skills) && project.skills.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Skills & Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1 text-xs font-mono text-cyan-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Owner Section: Received Proposals */}
            {isOwner && (
              <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText size={18} className="text-cyan-400" />
                      <span>Received Proposals ({proposals.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review bids submitted by student developers.
                    </p>
                  </div>
                </div>

                {loadingProposals ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 size={24} className="animate-spin text-cyan-400" />
                  </div>
                ) : proposals.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-white/5 rounded-2xl">
                    No proposals received yet for this project.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.015] p-5 hover:border-white/10 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div>
                            <span className="font-bold text-white text-sm">
                              {prop.freelancer?.name || "Freelancer"}
                            </span>
                            {prop.freelancer?.college && (
                              <span className="text-xs text-slate-400 ml-2">
                                • {prop.freelancer.college}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-400 text-sm">
                              ₹{prop.proposedAmount?.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400">
                              in {prop.estimatedDays} days
                            </span>
                            <Badge
                              variant={
                                prop.status === "accepted"
                                  ? "emerald"
                                  : prop.status === "rejected"
                                  ? "rose"
                                  : "cyan"
                              }
                              size="xs"
                            >
                              {prop.status}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                          {prop.coverLetter}
                        </p>

                        {/* Owner Actions on Pending Proposals */}
                        {isOpen && prop.status === "pending" && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                            <Button
                              variant="secondary"
                              size="xs"
                              icon={X}
                              iconPosition="left"
                              disabled={proposalActionLoading === prop.id}
                              onClick={() => handleRejectProposal(prop.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="xs"
                              icon={Check}
                              iconPosition="left"
                              disabled={proposalActionLoading === prop.id}
                              onClick={() => handleAcceptProposal(prop.id)}
                            >
                              Accept Proposal
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar (Right col) */}
          <div className="space-y-6">
            {/* Rate & Proposal CTA Card */}
            <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6 sm:p-7 shadow-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Project Budget
              </span>
              <div className="mt-1 font-extrabold text-2xl text-emerald-400">
                {project.budgetType === "fixed" ? (
                  <>
                    {project.budgetMax
                      ? `₹${project.budgetMin?.toLocaleString()} - ₹${project.budgetMax?.toLocaleString()}`
                      : project.budgetMin
                      ? `₹${project.budgetMin?.toLocaleString()}`
                      : "Fixed Price"}
                  </>
                ) : (
                  <>
                    {project.budgetMax
                      ? `₹${project.budgetMin} - ₹${project.budgetMax} / hr`
                      : project.budgetMin
                      ? `₹${project.budgetMin} / hr`
                      : "Hourly Rate"}
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 capitalize">
                {project.budgetType} rate • Standard contract
              </p>

              <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
                {isOwner ? (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs text-cyan-300 text-center">
                    You are the client/owner of this project.
                  </div>
                ) : project.hasProposed ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-center flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>Proposal Submitted</span>
                  </div>
                ) : isOpen ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    icon={Send}
                    iconPosition="left"
                    onClick={() => {
                      if (!user) {
                        navigate("/login", {
                          state: { from: `/freelance/projects/${id}` },
                        });
                      } else {
                        setIsProposalModalOpen(true);
                      }
                    }}
                  >
                    Submit a Proposal (+5 XP)
                  </Button>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400 text-center">
                    This project is currently {project.status.replace("_", " ")}.
                  </div>
                )}
              </div>
            </div>

            {/* Client Card */}
            <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6 sm:p-7">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                About the Client
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 font-bold">
                  {project.client?.name?.charAt(0) || "C"}
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white">{project.client?.name}</h5>
                  <p className="text-xs text-slate-400">
                    {project.client?.college || "Verified CareerCraft Member"}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Trust Score</span>
                  <span className="text-emerald-400 font-semibold">Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Currency</span>
                  <span className="text-white font-medium">{project.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Proposal Modal */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#070d19] p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Send size={18} className="text-cyan-400" />
                  <span>Submit Proposal</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Propose your bid and delivery terms. (+5 XP upon submission)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {proposalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{proposalError}</span>
              </div>
            )}

            {proposalSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span>{proposalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cover Letter & Pitch *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Explain why you are the best fit for this project, relevant portfolio works, and your approach..."
                  value={proposalFormData.coverLetter}
                  onChange={(e) =>
                    setProposalFormData({
                      ...proposalFormData,
                      coverLetter: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Bid Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 25000"
                    value={proposalFormData.proposedAmount}
                    onChange={(e) =>
                      setProposalFormData({
                        ...proposalFormData,
                        proposedAmount: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Delivery In (days) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 10"
                    value={proposalFormData.estimatedDays}
                    onChange={(e) =>
                      setProposalFormData({
                        ...proposalFormData,
                        estimatedDays: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsProposalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submittingProposal}
                >
                  {submittingProposal ? "Submitting..." : "Send Proposal (+5 XP)"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
