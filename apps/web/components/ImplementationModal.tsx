"use client";

import { useState } from "react";
import { Download, FileCode, Terminal, Copy, Check, ShieldAlert, X, Sparkles, Link, ExternalLink } from "lucide-react";
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
  const [copiedLinkCmd, setCopiedLinkCmd] = useState(false);

  if (!isOpen) return null;

  const cliToken = `rng_${planId.slice(0, 12)}_${Date.now().toString(36)}`;
  const globalCmd = `rencanangoding login --token ${cliToken} && rencanangoding plan get ${planId} && rencanangoding task next --plan ${planId}`;
  const npxGithubCmd = `npx github:KaryaPutraS/rencanangoding.ai#main login --token ${cliToken} && npx github:KaryaPutraS/rencanangoding.ai#main plan get ${planId} && npx github:KaryaPutraS/rencanangoding.ai#main task next --plan ${planId}`;
  const linkCommand = `cd "c:\\Users\\akuns\\Downloads\\google rencanangoding.ai\\apps\\cli" && npm link`;

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

  const handleCopyPrompt = (textToCopy: string, isLink: boolean = false) => {
    navigator.clipboard.writeText(textToCopy);
    if (isLink) {
      setCopiedLinkCmd(true);
      setTimeout(() => setCopiedLinkCmd(false), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-2xl rounded-3xl p-6 border border-white/[0.08] shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-lg font-bold text-gray-100">Mulai Eksekusi CLI Agent</h2>
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
              Unduh JSON →
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
              <p className="text-[11px] text-emerald-300 mt-1">Siap-pakai untuk Claude Code / Kimi / OpenCode</p>
            </div>
            <span className="mt-4 text-[10px] text-sky-300 font-semibold uppercase tracking-wider">
              Lihat Perintah →
            </span>
          </button>
        </div>

        {/* Global Link Fix Notice */}
        <div className="p-3.5 rounded-2xl bg-gray-950 border border-white/[0.08] space-y-2 text-xs">
          <div className="flex items-center justify-between text-amber-400 font-mono font-bold text-[11px]">
            <span>💡 TIPS AGAR PERINTAH 'rencanangoding' BISA DIJALANKAN DI FOLDER MANAPUN:</span>
          </div>
          <p className="text-gray-300 text-[11px] leading-relaxed">
            Jalankan perintah ini <span className="font-mono text-emerald-400">1x di Terminal</span> untuk mendaftarkan command CLI <code className="text-emerald-300 font-mono">rencanangoding</code> secara global di komputer kamu:
          </p>
          <div className="flex items-center justify-between bg-gray-900 p-2.5 rounded-xl border border-white/[0.08] gap-2">
            <code className="text-[11px] font-mono text-amber-300 truncate">
              {linkCommand}
            </code>
            <button
              onClick={() => handleCopyPrompt(linkCommand, true)}
              className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-mono shrink-0 transition-colors"
            >
              {copiedLinkCmd ? "Tersalin!" : "Salin Link Cmd"}
            </button>
          </div>
        </div>

        {/* CLI Command Copy Box */}
        <div id="cli-prompt-section" className="space-y-3">
          {/* Method 1: Linked Command */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
              <span className="text-emerald-400 font-mono font-bold">1. Perintah CLI Utama (Jika sudah npm link / global):</span>
            </div>
            <div className="p-3 rounded-2xl bg-gray-950 border border-white/[0.08] flex items-center justify-between gap-3">
              <code className="text-xs font-mono text-emerald-300 truncate flex-1 overflow-x-auto">
                {globalCmd}
              </code>
              <button
                onClick={() => handleCopyPrompt(globalCmd)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shrink-0 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Tersalin!" : "Salin Perintah"}</span>
              </button>
            </div>
          </div>

          {/* Method 2: Direct GitHub NPX Fallback */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
              <span className="text-cyan-400 font-mono font-bold">2. Perintah NPX Direct GitHub (Tanpa Perlu Setup Local):</span>
            </div>
            <div className="p-3 rounded-2xl bg-gray-950 border border-white/[0.08] flex items-center justify-between gap-3">
              <code className="text-xs font-mono text-cyan-300 truncate flex-1 overflow-x-auto">
                {npxGithubCmd}
              </code>
              <button
                onClick={() => handleCopyPrompt(npxGithubCmd)}
                className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shrink-0 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin NPX GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
