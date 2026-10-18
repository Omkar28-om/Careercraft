import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center text-white px-4">
      <div className="relative flex items-center justify-center mb-6">
        <div className="h-16 w-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <img
          src="/careercraft-logo.png"
          alt="CareerCraft"
          className="absolute h-9 w-9 object-contain"
        />
      </div>
      <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
        Career<span className="text-cyan-400">Craft</span>
      </div>
      <p className="mt-2 text-xs text-slate-400 tracking-wide animate-pulse">
        Verifying secure session...
      </p>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
