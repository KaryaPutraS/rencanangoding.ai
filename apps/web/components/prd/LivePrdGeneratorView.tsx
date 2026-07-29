"use client";

import { useState, useEffect } from "react";
import { Terminal, Sparkles, Cpu, Layers, Database, FileText, CheckCircle2, Loader2, Zap } from "lucide-react";

interface LivePrdGeneratorViewProps {
  planName: string;
  onFinished: (prd: any) => void;
  onError: (msg: string) => void;
  generateApiCall: () => Promise<any>;
}

const GENERATION_STEPS = [
  { id: 1, label: "Menganalisis Mind Map & Context Discovery", icon: Layers, progress: 20 },
  { id: 2, label: "Menyusun Diagram Arsitektur Sistem (Mermaid graph TB)", icon: Cpu, progress: 45 },
  { id: 3, label: "Merancang Skema Database ERD (Mermaid erDiagram)", icon: Database, progress: 70 },
  { id: 4, label: "Menulis Functional Specs & API Contracts", icon: FileText, progress: 90 },
  { id: 5, label: "Finalisasi Dokumen PRD Studio", icon: Sparkles, progress: 100 }
];

const TERMINAL_LOGS = [
  "[AI ARCHITECT] Initializing Lead Software Architect engine...",
  "[CONTEXT] Parsing project raw idea & discovery answers summary...",
  "[ARCHITECTURE] Structuring multi-tier system components...",
  "[MERMAID] Generating System Architecture diagram (graph TB)...",
  "[DATABASE] Compiling ERD data model schema (erDiagram)...",
  "[SECURITY] Defining authentication, RBAC, and rate-limiting protocols...",
  "[API SPECS] Formulating REST API contracts & JSON payload schemas...",
  "[TASK MATRIX] Mapping feature nodes to execution kanban layer...",
  "[FINALIZING] Rendering markdown document & validating diagrams..."
];

export function LivePrdGeneratorView({
  planName,
  onFinished,
  onError,
  generateApiCall
}: LivePrdGeneratorViewProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(0);

  // Animate terminal logs line by line
  useEffect(() => {
    if (logIndex < TERMINAL_LOGS.length) {
      const timer = setTimeout(() => {
        setDisplayedLogs((prev) => [...prev, TERMINAL_LOGS[logIndex]]);
        setLogIndex((prev) => prev + 1);

        // Update step index accordingly
        if (logIndex === 1) setCurrentStepIdx(1);
        if (logIndex === 3) setCurrentStepIdx(2);
        if (logIndex === 5) setCurrentStepIdx(3);
        if (logIndex === 7) setCurrentStepIdx(4);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [logIndex]);

  // Execute actual PRD generation API call
  useEffect(() => {
    let isMounted = true;
    generateApiCall()
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.prd) {
          // Finish animation
          setCurrentStepIdx(4);
          setTimeout(() => {
            if (isMounted) onFinished(data.prd);
          }, 1000);
        } else {
          onError(data.error || "Gagal membuat dokumen PRD");
        }
      })
      .catch((err) => {
        if (isMounted) onError(err.message || "Terjadi kesalahan saat membuat PRD");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentStep = GENERATION_STEPS[currentStepIdx] || GENERATION_STEPS[0];

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono tracking-widest uppercase shadow-lg shadow-emerald-500/20">
          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          <span>PRD STUDIO // LIVE GENERATION ENGINE</span>
        </div>

        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
          Menulis Dokumen Spesifikasi PRD untuk <span className="text-emerald-400 font-mono">{planName}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
          AI Architect sedang menulis dokumen PRD & Mermaid Diagrams secara live.
        </p>
      </div>

      {/* Progress Card */}
      <div className="w-full tech-panel rounded-3xl p-5 sm:p-6 border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.12)] space-y-5">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>{currentStep.label}</span>
            </span>
            <span className="text-gray-300 font-extrabold">{currentStep.progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden border border-white/[0.08] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-lg shadow-emerald-500/50"
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicator Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.08]">
          {GENERATION_STEPS.slice(0, 4).map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center gap-2 transition-all ${
                  isDone
                    ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                    : isCurrent
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20 animate-pulse"
                    : "bg-gray-950/60 border-white/[0.06] text-gray-500"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? "text-cyan-400 animate-spin" : "text-gray-500"}`} />
                )}
                <span className="truncate font-semibold">{step.label.split(" ")[0]} Specs</span>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Stream Output Box */}
        <div className="rounded-2xl bg-gray-950 border border-white/[0.1] p-4 font-mono text-xs text-gray-300 space-y-2 max-h-48 overflow-y-auto shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-gray-500 pb-1 border-b border-white/[0.06] mb-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>TERMINAL STREAM // LIVE SPECIFICATIONS OUTPUT</span>
            </span>
            <span className="text-emerald-400 animate-pulse">STREAMING 🟢</span>
          </div>

          <div className="space-y-1.5 text-[11px] leading-relaxed">
            {displayedLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-gray-600 select-none">&gt;</span>
                <span className={index === displayedLogs.length - 1 ? "text-emerald-300 font-bold" : "text-gray-400"}>
                  {log}
                </span>
              </div>
            ))}
            <div className="inline-flex items-center gap-1 text-emerald-400 font-bold animate-pulse pt-1">
              <span className="w-2 h-4 bg-emerald-400 animate-ping inline-block" />
              <span>Menulis spesifikasi markdown & diagram Mermaid...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
