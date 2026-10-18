import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Briefcase,
  User,
  Calendar,
  Check,
  X,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { getContracts, completeContract, cancelContract } from "../api";

export default function FreelanceContracts() {
  const { user } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUserContracts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getContracts({
        status: filterStatus !== "all" ? filterStatus : undefined,
        limit: 50,
      });
      if (res?.success) {
        setContracts(res.contracts || []);
      }
    } catch (err) {
      console.error("Failed to load contracts:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchUserContracts();
  }, [fetchUserContracts]);

  const handleComplete = async (contractId) => {
    if (!window.confirm("Mark this contract as completed? The freelancer will be awarded +25 XP.")) {
      return;
    }

    setActionLoading(contractId);
    try {
      const res = await completeContract(contractId);
      if (res?.success) {
        alert("Contract completed! (+25 XP awarded to freelancer)");
        fetchUserContracts();
      }
    } catch (err) {
      alert(err.message || "Failed to complete contract");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (contractId) => {
    if (!window.confirm("Cancel this contract? Associated project will also be cancelled.")) {
      return;
    }

    setActionLoading(contractId);
    try {
      const res = await cancelContract(contractId);
      if (res?.success) {
        alert("Contract cancelled.");
        fetchUserContracts();
      }
    } catch (err) {
      alert(err.message || "Failed to cancel contract");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge variant="emerald" size="xs">Completed</Badge>;
      case "cancelled":
        return <Badge variant="rose" size="xs">Cancelled</Badge>;
      case "active":
      default:
        return <Badge variant="cyan" size="xs">Active</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/freelance"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition"
          >
            <ChevronLeft size={16} />
            <span>Marketplace</span>
          </Link>

          <Link to="/freelance/earnings">
            <Button variant="outline" size="xs" icon={TrendingUp} iconPosition="left">
              Contract Value & Analytics
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Freelance Contracts
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Track deliverables, completed milestones, and active engagements where you participate as client or developer.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              {["all", "active", "completed", "cancelled"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                    filterStatus === st
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                      : "bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] border border-white/5"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contracts List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin text-cyan-400 mb-2" />
            <p className="text-xs">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
            <CheckCircle2 size={36} className="mx-auto text-slate-500 mb-3" />
            <h3 className="text-base font-bold text-white">No contracts found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You do not have any {filterStatus !== "all" ? filterStatus : ""} freelance contracts yet.
            </p>
            <div className="mt-5">
              <Link to="/freelance">
                <Button variant="primary" size="sm">
                  Browse Projects
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {contracts.map((c) => (
              <div
                key={c.id}
                className="rounded-3xl border border-white/10 bg-[#070d19] p-6 hover:border-cyan-400/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(c.status)}
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                        {c.isClient ? "Client Role" : "Freelancer Role"}
                      </span>
                    </div>

                    <span className="font-extrabold text-emerald-400 text-base">
                      ₹{c.agreedAmount?.toLocaleString()}
                    </span>
                  </div>

                  <Link
                    to={`/freelance/projects/${c.projectId}`}
                    className="font-bold text-white text-base hover:text-cyan-300 transition block mb-2"
                  >
                    {c.project?.title || "Freelance Project"}
                  </Link>

                  <div className="space-y-1.5 text-xs text-slate-300 bg-white/[0.02] p-3 rounded-2xl border border-white/5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Client:</span>
                      <span className="font-semibold text-white">{c.client?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Freelancer:</span>
                      <span className="font-semibold text-cyan-300">{c.freelancer?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Started:</span>
                      <span>{new Date(c.startedAt).toLocaleDateString()}</span>
                    </div>
                    {c.completedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Completed:</span>
                        <span className="text-emerald-400">
                          {new Date(c.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {c.status === "active" && (
                  <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      disabled={actionLoading === c.id}
                      onClick={() => handleCancel(c.id)}
                    >
                      Cancel Contract
                    </Button>

                    {c.isClient && (
                      <Button
                        variant="primary"
                        size="xs"
                        icon={Check}
                        iconPosition="left"
                        disabled={actionLoading === c.id}
                        onClick={() => handleComplete(c.id)}
                      >
                        Complete Contract (+25 XP)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
