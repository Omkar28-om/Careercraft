import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { getFreelanceEarnings } from "../api";

export default function FreelanceEarnings() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const res = await getFreelanceEarnings();
        if (res?.success) {
          setEarnings(res.earnings);
        }
      } catch (err) {
        console.error("Failed to load earnings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/freelance"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition"
          >
            <ChevronLeft size={16} />
            <span>Marketplace</span>
          </Link>

          <Link to="/freelance/contracts">
            <Button variant="secondary" size="xs">
              View Contracts
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Freelance Contract Analytics & Value
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track your agreed freelance contract values, active pipelines, and deliverable milestones.
          </p>
        </div>

        {/* Important Disclaimer Notice */}
        <div className="mb-8 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
          <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-0.5">
              Contract Value Accounting Notice
            </span>
            These values represent agreed contract amounts and milestones between clients and freelancers on CareerCraft. They reflect contract-value tracking and do not indicate direct financial transactions or third-party bank settlements.
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin text-cyan-400 mb-2" />
            <p className="text-xs">Computing contract analytics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Completed Value
              </span>
              <p className="mt-2 text-3xl font-black text-emerald-400">
                ₹{earnings?.totalCompletedValue?.toLocaleString() || "0"}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Delivered across all contracts
              </span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Completed Contracts
              </span>
              <p className="mt-2 text-3xl font-black text-white">
                {earnings?.completedContracts || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Finished engagements
              </span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Active Contracts Value
              </span>
              <p className="mt-2 text-3xl font-black text-cyan-400">
                ₹{earnings?.pendingContractValue?.toLocaleString() || "0"}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                In-progress deliverables
              </span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#070d19] p-6">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Active Engagements
              </span>
              <p className="mt-2 text-3xl font-black text-white">
                {earnings?.activeContracts || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Currently running projects
              </span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
