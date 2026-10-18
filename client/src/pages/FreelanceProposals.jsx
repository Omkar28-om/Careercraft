import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ArrowRight,
  Send,
  DollarSign,
  User,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  getMyProposals,
  withdrawProposal,
  getFreelanceProjects,
  getProjectProposals,
  acceptProposal,
  rejectProposal,
} from "../api";

export default function FreelanceProposals() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("my"); // "my" | "received"
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Received proposals grouped by owned projects
  const [myProjects, setMyProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [receivedProposals, setReceivedProposals] = useState([]);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchMyProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProposals({ limit: 50 });
      if (res?.success) {
        setProposals(res.proposals || []);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyProjects = useCallback(async () => {
    try {
      const res = await getFreelanceProjects({ limit: 50, status: "all" });
      if (res?.success) {
        const owned = (res.projects || []).filter(
          (p) => p.clientId === user?.id || p.client?.id === user?.id
        );
        setMyProjects(owned);
        if (owned.length > 0 && !selectedProjectId) {
          setSelectedProjectId(owned[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load user projects:", err);
    }
  }, [user, selectedProjectId]);

  const fetchReceivedForProject = useCallback(async (projId) => {
    if (!projId) return;
    try {
      setLoadingReceived(true);
      const res = await getProjectProposals(projId);
      if (res?.success) {
        setReceivedProposals(res.proposals || []);
      }
    } catch (err) {
      console.error("Failed to load project proposals:", err);
    } finally {
      setLoadingReceived(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "my") {
      fetchMyProposals();
    } else {
      fetchMyProjects();
    }
  }, [activeTab, fetchMyProposals, fetchMyProjects]);

  useEffect(() => {
    if (activeTab === "received" && selectedProjectId) {
      fetchReceivedForProject(selectedProjectId);
    }
  }, [activeTab, selectedProjectId, fetchReceivedForProject]);

  const handleWithdraw = async (proposalId) => {
    if (!window.confirm("Are you sure you want to withdraw this proposal?")) return;
    try {
      const res = await withdrawProposal(proposalId);
      if (res?.success) {
        setProposals((prev) =>
          prev.map((p) =>
            p.id === proposalId ? { ...p, status: "withdrawn" } : p
          )
        );
      }
    } catch (err) {
      alert(err.message || "Failed to withdraw proposal");
    }
  };

  const handleAccept = async (proposalId) => {
    if (!window.confirm("Accept this proposal and establish active contract?")) return;
    setActionLoading(proposalId);
    try {
      const res = await acceptProposal(proposalId);
      if (res?.success) {
        alert("Proposal accepted! An active contract has started.");
        fetchReceivedForProject(selectedProjectId);
      }
    } catch (err) {
      alert(err.message || "Failed to accept proposal");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (proposalId) => {
    setActionLoading(proposalId);
    try {
      const res = await rejectProposal(proposalId);
      if (res?.success) {
        setReceivedProposals((prev) =>
          prev.map((p) =>
            p.id === proposalId ? { ...p, status: "rejected" } : p
          )
        );
      }
    } catch (err) {
      alert(err.message || "Failed to reject proposal");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "accepted":
        return "emerald";
      case "rejected":
        return "rose";
      case "withdrawn":
        return "default";
      case "pending":
      default:
        return "cyan";
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/freelance"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition"
          >
            <ChevronLeft size={16} />
            <span>Marketplace</span>
          </Link>

          <Link to="/freelance/contracts">
            <Button variant="secondary" size="xs" icon={ArrowRight} iconPosition="right">
              View Contracts
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Freelance Proposals
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track bids you submitted to clients and manage incoming proposals on your posted projects.
          </p>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-3 border-b border-white/10 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`pb-3 text-sm font-semibold transition cursor-pointer relative ${
                activeTab === "my"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              My Submitted Proposals ({proposals.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("received")}
              className={`pb-3 text-sm font-semibold transition cursor-pointer relative ${
                activeTab === "received"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Received Proposals (Owner)
            </button>
          </div>
        </div>

        {/* Tab 1: My Submitted Proposals */}
        {activeTab === "my" && (
          <div>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-cyan-400 mb-2" />
                <p className="text-xs">Loading submitted proposals...</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
                <FileText size={32} className="mx-auto text-slate-500 mb-3" />
                <h3 className="text-base font-bold text-white">No proposals submitted yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Browse open freelance gigs in the marketplace and submit your first pitch to earn +5 XP.
                </p>
                <div className="mt-5">
                  <Link to="/freelance">
                    <Button variant="primary" size="sm">
                      Explore Open Gigs
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="rounded-2xl border border-white/10 bg-[#070d19] p-5 sm:p-6 hover:border-cyan-400/30 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusBadgeVariant(prop.status)} size="xs">
                          {prop.status}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {prop.project?.category}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          • Submitted {new Date(prop.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <Link
                        to={`/freelance/projects/${prop.projectId}`}
                        className="font-bold text-white text-base hover:text-cyan-300 transition block mb-2"
                      >
                        {prop.project?.title || "Freelance Project"}
                      </Link>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        "{prop.coverLetter}"
                      </p>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                      <div className="text-left md:text-right">
                        <span className="font-extrabold text-base text-emerald-400 block">
                          ₹{prop.proposedAmount?.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400">
                          {prop.estimatedDays} days delivery
                        </span>
                      </div>

                      {prop.status === "pending" && (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleWithdraw(prop.id)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Received Proposals (Client/Owner) */}
        {activeTab === "received" && (
          <div>
            {myProjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
                <FileText size={32} className="mx-auto text-slate-500 mb-3" />
                <h3 className="text-base font-bold text-white">No posted projects</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  You have not posted any freelance projects yet. Post a project to receive bids from developers.
                </p>
                <div className="mt-5">
                  <Link to="/freelance">
                    <Button variant="primary" size="sm">
                      Post a Project
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Project selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-xs font-semibold text-slate-300">
                    Select Your Project:
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#070d19] px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer max-w-md"
                  >
                    {myProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                {loadingReceived ? (
                  <div className="py-16 flex justify-center">
                    <Loader2 size={28} className="animate-spin text-cyan-400" />
                  </div>
                ) : receivedProposals.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10 border border-dashed border-white/5 rounded-2xl">
                    No proposals received yet for this project.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {receivedProposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="rounded-2xl border border-white/10 bg-[#070d19] p-5 sm:p-6"
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
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-400 text-sm">
                              ₹{prop.proposedAmount?.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400">
                              {prop.estimatedDays} days
                            </span>
                            <Badge variant={getStatusBadgeVariant(prop.status)} size="xs">
                              {prop.status}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                          {prop.coverLetter}
                        </p>

                        {prop.status === "pending" && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                            <Button
                              variant="secondary"
                              size="xs"
                              disabled={actionLoading === prop.id}
                              onClick={() => handleReject(prop.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="xs"
                              disabled={actionLoading === prop.id}
                              onClick={() => handleAccept(prop.id)}
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
        )}
      </main>

      <Footer />
    </div>
  );
}
