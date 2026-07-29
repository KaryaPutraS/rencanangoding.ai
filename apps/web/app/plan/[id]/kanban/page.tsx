"use client";

import { useState, useEffect, use } from "react";
import { Navbar } from "@/components/Navbar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TaskItem, Plan } from "@rencanangoding/shared";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  RefreshCw,
  Rocket,
  Terminal,
  Lock,
  RotateCcw,
  ShieldCheck,
  Activity
} from "lucide-react";
import { ImplementationModal } from "@/components/ImplementationModal";

export default function KanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState("");
  const [showImplModal, setShowImplModal] = useState(false);
  const [prdMarkdown, setPrdMarkdown] = useState("");
  const [mobileFilter, setMobileFilter] = useState<string>("all");

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/plans/${id}`);
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
        setTasks(data.tasks || []);
        if (data.prd?.contentMarkdown) {
          setPrdMarkdown(data.prd.contentMarkdown);
        }
      }
    } catch {
      setError("Gagal memuat task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [id]);

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/plans/${id}/generate-tasks`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      } else {
        setError(data.error || "Gagal membuat task breakdown");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setGenerating(false);
    }
  };

  const executeResetProgress = async () => {
    setResetting(true);
    setShowResetConfirm(false);
    try {
      const res = await fetch(`/api/plans/${id}/tasks/reset`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      } else {
        setError(data.error || "Gagal mereset progres task");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dot-grid text-gray-100 flex flex-col">
        <Navbar currentPlanId={id} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          <h2 className="text-lg font-bold text-gray-200 font-mono">LOADING TASK KANBAN BOARD...</h2>
        </main>
      </div>
    );
  }

  const columns: { id: TaskItem["status"]; title: string; icon: any; color: string }[] = [
    { id: "belum_mulai", title: "Belum Mulai", icon: Clock, color: "text-gray-400 border-gray-800" },
    { id: "dikerjakan", title: "Dikerjakan (CLI Agent)", icon: PlayCircle, color: "text-amber-400 border-amber-800/60" },
    { id: "selesai", title: "Selesai", icon: CheckCircle2, color: "text-emerald-400 border-emerald-800/60" },
    { id: "gagal", title: "Gagal", icon: AlertTriangle, color: "text-red-400 border-red-800/60" }
  ];

  const visibleColumns = mobileFilter === "all" ? columns : columns.filter((c) => c.id === mobileFilter);

  // Calculations for Progress Reporting Banner
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === "selesai").length;
  const inProgressTasksCount = tasks.filter((t) => t.status === "dikerjakan").length;
  const failedTasksCount = tasks.filter((t) => t.status === "gagal").length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const currentRunningTask = tasks.find((t) => t.status === "dikerjakan");

  return (
    <div className="min-h-screen bg-dot-grid text-gray-100 flex flex-col pb-16 md:pb-6">
      <Navbar currentPlanId={id} />

      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 tech-panel p-4 rounded-2xl border border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 mb-1">
              <Terminal className="w-4 h-4" />
              <span>PHASE 03 // TASK KANBAN BOARD</span>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-gray-100">
              {plan?.name || "Rencana Application"}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {tasks.length === 0 ? (
              <button
                onClick={handleGenerateTasks}
                disabled={generating}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate Task Breakdown</span>
              </button>
            ) : (
              <>
                {/* Reset Progress Button */}
                <button
                  onClick={() => setShowResetConfirm(true)}
                  disabled={resetting}
                  title="Reset seluruh progres task ke awal"
                  className="px-3.5 py-2 rounded-xl bg-gray-900 border border-white/[0.08] text-xs font-semibold font-mono text-amber-400 hover:bg-gray-800 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
                  <span>Reset Progress</span>
                </button>

                {/* Refresh Status Button */}
                <button
                  onClick={fetchTasks}
                  className="px-3.5 py-2 rounded-xl bg-gray-900 border border-white/[0.08] text-xs font-semibold font-mono text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowImplModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
            >
              <Rocket className="w-4 h-4" />
              <span>Eksekusi via CLI</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Live CLI Progress Reporting Banner */}
        {tasks.length > 0 && (
          <div className="tech-panel p-4 rounded-2xl border border-white/[0.08] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold text-gray-200 uppercase tracking-wider">
                  PROGRES EKSEKUSI CLI AGENT:
                </span>
                <span className="text-emerald-400 font-extrabold">
                  {completedTasksCount} / {totalTasksCount} Selesai ({progressPercent}%)
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-amber-400 font-semibold">{inProgressTasksCount} Dikerjakan</span>
                <span className="text-gray-500">•</span>
                <span className="text-emerald-400 font-semibold">{completedTasksCount} Selesai</span>
                {failedTasksCount > 0 && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-red-400 font-semibold">{failedTasksCount} Gagal</span>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-white/[0.06] p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {currentRunningTask
                    ? `CLI sedang mengerjakan: ${currentRunningTask.ref} — ${currentRunningTask.title}`
                    : "Status task diperbarui otomatis oleh CLI Agent melalui endpoint laporan API."}
                </span>
              </div>
              <span className="hidden sm:inline text-gray-500">AUTONOMOUS SYNC 🔒</span>
            </div>
          </div>
        )}

        {/* Empty Tasks State */}
        {tasks.length === 0 && !generating && (
          <div className="tech-panel p-8 sm:p-12 rounded-3xl border border-white/[0.08] text-center max-w-lg mx-auto space-y-4">
            <Sparkles className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-gray-200 font-mono">Belum ada Task Breakdown</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Klik tombol di bawah ini untuk menghasilkan task granular per sub-fitur dengan pembagian layer Frontend & Backend.
            </p>
            <button
              onClick={handleGenerateTasks}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl"
            >
              Breakdown Task Sekarang
            </button>
          </div>
        )}

        {/* Mobile Filter Tabs (Visible on screens < md) */}
        {tasks.length > 0 && (
          <div className="md:hidden flex items-center gap-1 overflow-x-auto p-1 bg-gray-950/90 rounded-2xl border border-white/[0.08] text-xs">
            <button
              onClick={() => setMobileFilter("all")}
              className={`px-3 py-1.5 rounded-xl font-bold font-mono transition-colors whitespace-nowrap ${
                mobileFilter === "all" ? "bg-emerald-600 text-white" : "text-gray-400"
              }`}
            >
              Semua ({tasks.length})
            </button>
            {columns.map((c) => {
              const count = tasks.filter((t) => t.status === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setMobileFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold font-mono transition-colors whitespace-nowrap ${
                    mobileFilter === c.id ? "bg-emerald-600 text-white" : "text-gray-400"
                  }`}
                >
                  {c.title.split(" ")[0]} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Kanban Board Grid */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {visibleColumns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              const IconComp = col.icon;

              return (
                <div key={col.id} className="tech-panel p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <IconComp className={`w-4 h-4 ${col.color.split(" ")[0]}`} />
                      <h3 className="text-xs font-bold text-gray-200 font-mono">{col.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-gray-900 text-gray-400 font-mono text-[10px] font-bold border border-white/[0.08]">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
                    {colTasks.length === 0 ? (
                      <p className="text-[11px] font-mono text-gray-500 text-center py-6">Kosong</p>
                    ) : (
                      colTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl bg-gray-900/90 border border-white/[0.08] hover:border-emerald-500/40 text-xs space-y-2 shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-[10px] text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/50">
                              {t.ref}
                            </span>
                            <div className="flex items-center gap-1 font-mono">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-950 text-gray-400">
                                Phase {t.phase}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  t.layer === "frontend"
                                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800/50"
                                    : "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                                }`}
                              >
                                {t.layer}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-semibold text-gray-100 leading-snug">{t.title}</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                            {t.description}
                          </p>

                          {/* Automated Status Sync Badge (No Manual Move Buttons) */}
                          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono">
                            <span className="text-gray-500">Status Sync:</span>
                            <div>
                              {t.status === "dikerjakan" ? (
                                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800/60 flex items-center gap-1">
                                  <PlayCircle className="w-3 h-3 text-amber-400 animate-spin" />
                                  <span>CLI RUNNING</span>
                                </span>
                              ) : t.status === "selesai" ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>SELESAI (CLI)</span>
                                </span>
                              ) : t.status === "gagal" ? (
                                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-800/60 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-400" />
                                  <span>GAGAL</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-gray-950 text-gray-400 font-semibold border border-white/[0.08] flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-gray-500" />
                                  <span>CLI QUEUED</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Custom Confirm Modal for Resetting Task Progress */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Seluruh Progres Task?"
        message="Apakah Anda yakin ingin mereset seluruh progres task ke status awal (Belum Mulai)? Tindakan ini akan mengembalikan status eksekusi task agar dapat diulang dari awal oleh CLI Agent."
        confirmLabel="Ya, Reset Progres"
        cancelLabel="Batal"
        variant="warning"
        loading={resetting}
        onConfirm={executeResetProgress}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ImplementationModal
        isOpen={showImplModal}
        onClose={() => setShowImplModal(false)}
        planId={id}
        planName={plan?.name || "App Idea"}
        prdMarkdown={prdMarkdown}
        tasks={tasks}
      />
    </div>
  );
}
