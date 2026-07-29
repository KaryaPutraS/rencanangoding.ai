"use client";

import { useState } from "react";
import { Download, FileCode, Terminal, Copy, Check, ShieldAlert, X, Sparkles } from "lucide-react";
import { FeatureNode, TaskItem } from "@rencanangoding/shared";

interface ImplementationModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  prdMarkdown: string;
  features?: FeatureNode[];
  tasks?: TaskItem[];
}

export function ImplementationModal({
  isOpen,
  onClose,
  planId,
  planName,
  prdMarkdown,
  features = [],
  tasks = []
}: ImplementationModalProps) {
  const [copied, setCopied] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(true);

  if (!isOpen) return null;

  const cliToken = `rng_${planId.slice(0, 12)}_${Date.now().toString(36)}`;
  const cliPrompt = `RENCANANGODING_SERVER_URL=http://localhost:7518 npx rencanangoding login --token ${cliToken} && npx rencanangoding plan get ${planId} && npx rencanangoding task next --plan ${planId}`;

  const downloadPrdFile = () => {
    const blob = new Blob([prdMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${planName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-PRD.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadZipSpec = () => {
    const specData = {
      planId,
      planName,
      prdMarkdown,
      features,
      tasks
    };
    const jsonString = JSON.stringify(specData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${planName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-spec.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(cliPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-2xl rounded-3xl p-6 border border-white/[0.08] shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-100">Mulai Implementasi Otomatis</h2>
            <p className="text-xs text-gray-400">Pilih metode eksekusi sesuai workflow AI Agent pilihan kamu</p>
          </div>
        </div>

        {/* 3 Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: Download PRD */}
          <button
            onClick={downloadPrdFile}
            className="p-4 rounded-2xl bg-gray-900/80 border border-white/[0.08] hover:border-emerald-500/40 hover:bg-gray-800/60 text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <Download className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-gray-200">Download PRD</h3>
              <p className="text-[11px] text-gray-400 mt-1">File dokumen standar format `.md`</p>
            </div>
            <span className="mt-4 text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
              Unduh .MD →
            </span>
          </button>

          {/* Option 2: Download ZIP */}
          <button
            onClick={downloadZipSpec}
            className="p-4 rounded-2xl bg-gray-900/80 border border-white/[0.08] hover:border-cyan-500/40 hover:bg-gray-800/60 text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <FileCode className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-gray-200">Download Spec Bundle</h3>
              <p className="text-[11px] text-gray-400 mt-1">Paket lengkap PRD + Fitur + Tasks JSON</p>
            </div>
            <span className="mt-4 text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
              Unduh JSON/ZIP →
            </span>
          </button>

          {/* Option 3: CLI Agent Prompt */}
          <button
            onClick={() => document.getElementById("cli-prompt-section")?.scrollIntoView({ behavior: "smooth" })}
            className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 hover:border-emerald-500/60 text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <Terminal className="w-6 h-6 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-sky-200">Prompt CLI Agent</h3>
              <p className="text-[11px] text-emerald-300 mt-1">Siap-pakai untuk Claude Code / Cursor</p>
            </div>
            <span className="mt-4 text-[10px] text-sky-300 font-semibold uppercase tracking-wider">
              Lihat CLI Prompt →
            </span>
          </button>
        </div>

        {/* Security Warning Notice */}
        {showSecurityWarning && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3 text-xs text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Peringatan Keamanan Access Token</span>
              <span>
                Token CLI tersemat secara otomatis untuk menghubungkan terminal kamu dengan dashboard ini.
                Jangan bagikan prompt ini di repositori publik.
              </span>
            </div>
          </div>
        )}

        {/* CLI Command Copy Box */}
        <div id="cli-prompt-section" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
            <span>Perintah CLI Siap-Pakai Terminal:</span>
            <span className="text-[10px] font-mono text-emerald-400">npx rencanangoding v0.1</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-950 border border-white/[0.08] flex items-center justify-between gap-3">
            <code className="text-xs font-mono text-emerald-400 truncate flex-1 overflow-x-auto">
              {cliPrompt}
            </code>
            <button
              onClick={handleCopyPrompt}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shrink-0 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Tersalin!" : "Salin Perintah"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
