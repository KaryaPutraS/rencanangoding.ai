"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plan } from "@rencanangoding/shared";
import { Terminal, Globe, FolderGit2, Plus, Code2, Settings, Trash2, Cpu, UserCheck, LogOut, Lock, Users, FileText } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import { TunnelStatusModal } from "./TunnelStatusModal";
import { AuthModal } from "./AuthModal";
import { ConfirmModal } from "./ConfirmModal";
import { BrandLogo } from "./BrandLogo";
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

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${planToDelete}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) => prev.filter((p) => p.id !== planToDelete));
        if (currentPlanId === planToDelete) {
          router.push("/");
        }
      }
    } catch {
    } finally {
      setDeleting(false);
      setPlanToDelete(null);
    }
  };

  const targetPlanName = plans.find((p) => p.id === planToDelete)?.name || "Rencana ini";

  return (
    <>
      <header className="sticky top-0 z-40 tech-panel border-b border-white/[0.08] px-2.5 sm:px-6 lg:px-8 py-2 max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Compact Header Title */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink-0">
              <BrandLogo variant="option1_emerald" size={28} showText={false} />
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-sans">
                  RencanaNgoding<span className="text-emerald-400 font-bold font-sans">AI</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden xs:inline-block" />
              </div>
            </Link>

            {/* Live Ticker Widget (As requested) */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-900/90 border border-white/[0.08] text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
              <span className="text-gray-600">|</span>
              <span className="flex items-center gap-1 text-gray-300 font-bold text-[11px]">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>2.4K</span>
                <span className="text-[10px] text-gray-400 font-normal">User</span>
              </span>
              <span className="text-gray-600">|</span>
              <span className="flex items-center gap-1 text-gray-300 font-bold text-[11px]">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>5.1K</span>
                <span className="text-[10px] text-gray-400 font-normal">PRD</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            {currentPlanId && (
              <nav className="hidden lg:flex items-center gap-1 bg-gray-950/80 p-1 rounded-xl border border-white/[0.08] text-xs">
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
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* User Auth Profile Badge or Login Button */}
            {user ? (
              <div className="flex items-center gap-1 bg-emerald-950/60 p-1 pl-2 rounded-xl border border-emerald-800/60 text-xs shrink-0">
                <span className="font-mono text-emerald-300 max-w-[65px] xs:max-w-[100px] sm:max-w-[150px] truncate font-medium text-[10px] sm:text-xs">
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  title="Logout / Keluar"
                  className="p-1 rounded-lg bg-gray-900 hover:bg-red-950 text-gray-400 hover:text-red-300 transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center"
                >
                  <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/[0.08] text-xs text-emerald-400 font-mono font-medium transition-colors shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden xs:inline text-xs">Masuk</span>
                <span className="xs:hidden text-[10px]">OTP</span>
              </button>
            )}

            {/* Auto Tunnel / Access Endpoint Button */}
            <button
              onClick={() => setShowTunnelModal(true)}
              title="Akses Endpoint & Auto Tunnel"
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all shrink-0 ${
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
            <div className="relative shrink-0">
              <button
                onClick={() => setShowPlansDropdown(!showPlansDropdown)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/[0.08] text-xs text-gray-300 font-medium transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Riwayat ({plans.length})</span>
                <span className="sm:hidden text-[10px] font-mono font-bold text-emerald-400">({plans.length})</span>
              </button>

              {showPlansDropdown && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-80 tech-panel rounded-2xl shadow-2xl p-2 z-50 border border-white/[0.1] animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">Daftar Plan Kamu</span>
                    <Link
                      href="/"
                      onClick={() => setShowPlansDropdown(false)}
                      className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 hover:underline font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Baru</span>
                    </Link>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 space-y-1 custom-scrollbar">
                    {plans.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        Belum ada plan yang dibuat.
                      </div>
                    ) : (
                      plans.map((p) => {
                        const isActive = p.id === currentPlanId;
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                              isActive
                                ? "bg-emerald-950/60 border border-emerald-500/40 text-white font-bold"
                                : "hover:bg-gray-800/80 text-gray-300"
                            }`}
                          >
                            <Link
                              href={`/plan/${p.id}/structure`}
                              onClick={() => setShowPlansDropdown(false)}
                              className="flex-1 truncate pr-2"
                            >
                              <div className="truncate font-semibold">{p.name}</div>
                              <div className="text-[10px] text-gray-500 font-mono">
                                {new Date(p.createdAt).toLocaleDateString("id-ID")}
                              </div>
                            </Link>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlanToDelete(p.id);
                              }}
                              className="p-1 rounded bg-gray-900 hover:bg-red-950 text-gray-400 hover:text-red-400 transition-colors"
                              title="Hapus Plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Provider Config Settings Modal Trigger */}
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Pengaturan AI API Key & Model"
              className="p-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/[0.08] text-gray-300 hover:text-white transition-colors shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Create New Plan Button */}
            <Link
              href="/"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buat Rencana</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      {currentPlanId && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 tech-panel border-t border-white/[0.08] px-2 py-2 flex items-center justify-around text-xs backdrop-blur-md">
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
