"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SupportedLanguages, Plan } from "@rencanangoding/shared";
import { Terminal, Globe, FolderGit2, Plus, Code2, Settings, Trash2, Cpu, UserCheck, LogOut, Lock } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import { TunnelStatusModal } from "./TunnelStatusModal";
import { AuthModal } from "./AuthModal";
import { ConfirmModal } from "./ConfirmModal";
import { useAuth } from "./AuthContext";

export function Navbar({ currentPlanId }: { currentPlanId?: string }) {
  const router = useRouter();
  const { user, isAuthModalOpen, openAuthModal, closeAuthModal, logout } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [showPlansDropdown, setShowPlansDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTunnelModal, setShowTunnelModal] = useState(false);
  const [tunnelActive, setTunnelActive] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlans(data.plans || []);
        }
      })
      .catch(() => {});

    fetch("/api/tunnel")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTunnelActive(data.active);
        }
      })
      .catch(() => {});
  }, [user]);

  const requestDeletePlan = (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setPlanToDelete(planId);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${planToDelete}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) => prev.filter((p) => p.id !== planToDelete));
        if (planToDelete === currentPlanId) {
          router.push("/");
        }
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
    } finally {
      setDeleting(false);
      setPlanToDelete(null);
    }
  };

  const targetPlanName = plans.find((p) => p.id === planToDelete)?.name || "Rencana ini";

  return (
    <>
      <header className="sticky top-0 z-40 tech-panel border-b border-white/[0.08] px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:border-emerald-400 transition-all duration-200">
                <Terminal className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                    RencanaNgoding<span className="text-emerald-400 font-mono">.ai</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="hidden sm:block text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  Open-Source Agent Specs Engine
                </span>
              </div>
            </Link>

            {/* Nav Links on Desktop */}
            {currentPlanId && (
              <nav className="hidden md:flex items-center gap-1 bg-gray-950/80 p-1 rounded-xl border border-white/[0.08] text-xs">
                <Link
                  href={`/plan/${currentPlanId}/structure`}
                  className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/80 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Struktur Fitur</span>
                </Link>
                <Link
                  href={`/plan/${currentPlanId}/prd`}
                  className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/80 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PRD Studio</span>
                </Link>
                <Link
                  href={`/plan/${currentPlanId}/kanban`}
                  className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/80 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Task Kanban</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Auth Profile Badge or Login Button */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/60 p-1 pl-2.5 rounded-xl border border-emerald-800/60 text-xs">
                <span className="font-mono text-emerald-300 max-w-[120px] sm:max-w-[160px] truncate font-medium">
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  title="Logout / Keluar"
                  className="p-1 sm:px-2 py-1 rounded-lg bg-gray-900 hover:bg-red-950 text-gray-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/[0.08] text-xs text-emerald-400 font-mono font-medium transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk / OTP</span>
              </button>
            )}

            {/* Auto Tunnel / Access Endpoint Button */}
            <button
              onClick={() => setShowTunnelModal(true)}
              title="Akses Endpoint & Auto Tunnel"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                tunnelActive
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20"
                  : "bg-gray-900/80 hover:bg-gray-800 border-white/[0.08] text-gray-300"
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${tunnelActive ? "text-emerald-400 animate-pulse" : "text-sky-400"}`} />
              <span className="hidden sm:inline">Endpoint</span>
              {tunnelActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
            </button>

            {/* History Drawer Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowPlansDropdown(!showPlansDropdown)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/[0.08] text-xs text-gray-300 font-medium transition-colors"
              >
                <FolderGit2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400" />
                <span className="hidden sm:inline">Riwayat ({plans.length})</span>
              </button>

              {showPlansDropdown && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 tech-panel rounded-2xl shadow-2xl p-2 z-50 border border-white/[0.1] animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">Daftar Plan Kamu</span>
                    <Link
                      href="/"
                      onClick={() => setShowPlansDropdown(false)}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Plus className="w-3.5 h-3.5" /> Plan Baru
                    </Link>
                  </div>
                  <div className="max-h-64 overflow-y-auto mt-1 space-y-1">
                    {plans.length === 0 ? (
                      <p className="text-xs text-gray-500 p-4 text-center">Belum ada plan yang dibuat</p>
                    ) : (
                      plans.map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors group ${
                            p.id === currentPlanId
                              ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40"
                              : "hover:bg-gray-800/60 text-gray-300"
                          }`}
                        >
                          <Link
                            href={`/plan/${p.id}/prd`}
                            onClick={() => setShowPlansDropdown(false)}
                            className="flex-1 min-w-0 pr-2"
                          >
                            <p className="font-semibold truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400 capitalize mt-0.5 font-mono">
                              Status: {p.status.replace("_", " ")}
                            </p>
                          </Link>
                          <button
                            onClick={(e) => requestDeletePlan(e, p.id)}
                            title="Hapus Plan"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/50 transition-colors opacity-80 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Settings Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Pengaturan AI Model & API Key"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/[0.08] text-xs text-gray-300 font-medium transition-colors"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline ml-1.5">Settings AI</span>
            </button>

            {/* New Plan Button */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Buat Rencana</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      {currentPlanId && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 tech-panel border-t border-white/[0.08] px-2 py-2 flex items-center justify-around text-xs">
          <Link
            href={`/plan/${currentPlanId}/structure`}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-gray-300 hover:text-white transition-colors"
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono font-semibold">Struktur</span>
          </Link>
          <Link
            href={`/plan/${currentPlanId}/prd`}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-gray-300 hover:text-white transition-colors"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-semibold">PRD Studio</span>
          </Link>
          <Link
            href={`/plan/${currentPlanId}/kanban`}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-gray-300 hover:text-white transition-colors"
          >
            <FolderGit2 className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono font-semibold">Kanban</span>
          </Link>
        </div>
      )}

      {/* Custom Confirmation Modal for Deleting Plan */}
      <ConfirmModal
        isOpen={!!planToDelete}
        title="Hapus Rencana Aplikasi?"
        message={`Apakah Anda yakin ingin menghapus "${targetPlanName}"? Tindakan ini akan menghapus dokumen PRD, mind map fitur, dan seluruh task breakdown secara permanen.`}
        confirmLabel="Ya, Hapus Permanent"
        cancelLabel="Batal"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeletePlan}
        onCancel={() => setPlanToDelete(null)}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      <TunnelStatusModal
        isOpen={showTunnelModal}
        onClose={() => setShowTunnelModal(false)}
      />
    </>
  );
}
