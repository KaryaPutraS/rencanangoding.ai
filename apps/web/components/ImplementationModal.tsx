"use client";

import { useState } from "react";
import { Download, FileCode, Terminal, Copy, Check, ShieldAlert, X, Sparkles, Zap, Layers, PlayCircle } from "lucide-react";
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
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const cliToken = `rng_${planId.slice(0, 12)}_${Date.now().toString(36)}`;
  const serverUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:7518";

  // Single comprehensive 1-click instruction prompt for AI Agents (OpenCode, Claude Code, Cursor, Kimi, DeepSeek)
  const fullAgentPrompt = `Kamu akan mengerjakan task dari RencanaNgoding.ai lewat CLI \`npx rencanangoding\` (atau \`npx github:KaryaPutraS/rencanangoding.ai#main\`).

🔴 ATURAN LOKASI FOLDER PROYEK:
Seluruh file, folder, komponen, dan kode proyek HARUS DIBUAT LANGSUNG di direktori kerja saat ini (\`./\` atau Current Working Directory proyek yang sedang kamu buka). JANGAN PERNAH membuat atau menulis kode di direktori temporary/temp (\`$env:TEMP\` atau \`AppData\\Local\\Temp\`)!

Prasyarat: Node.js (cek \`node -v\`). CLI otomatis ter-download saat dijalankan via npx — tidak perlu install manual.

Langkah 1 — login + pasang skill (sekali saja):
npx rencanangoding login --token ${cliToken}    # simpan token (tanpa browser)
npx rencanangoding init     # pasang skill "rencanangoding" ke agent (auto-load)

Langkah 2 — baca PRD dulu (konteks proyek, sekali saja):
npx rencanangoding plan get ${planId}    # PRD lengkap → tujuan, fitur, tech stack

Langkah 3 — LOOP: kerjakan SATU task per satu, BERHENTI tiap ganti fase/layer.
Server yang pilih task berikutnya (frontend & HALAMAN PERTAMA diselesaikan dulu di atas data tiruan/stub; backend menyusul). Kamu TIDAK perlu lihat seluruh backlog.
INGAT \`layer\` (frontend/backend) & \`phase.current\` task yang BARU kamu selesaikan.

Ulangi siklus ini:
  npx rencanangoding task next --plan ${planId} --json   # SATU task berikutnya
      # respons: { done, task:{ref,title,...}, progress:{ phase:{current,total}, layer, page, ... } }
      # kerjakan dari title + PRD + baca kode; TAK ADA field prompt/description.
      # kalau "done": true → SEMUA task selesai. BERHENTI & lapor ke user.
      #
      # ⛔ CHECKPOINT (SEBELUM \`task start\`): bandingkan \`progress\` task ini dengan
      #    task yang BARUSAN selesai. Kalau \`layer\` BEDA (mis. frontend→backend)
      #    ATAU \`phase.current\` NAIK → JANGAN mulai. BERHENTI, lapor apa yang beres
      #    (mis. "✅ Frontend fase 1 selesai — coba klik-klik dulu di browser"), lalu
      #    TUNGGU user bilang "lanjut". \`task next\` PERTAMA di sesi ini (belum ada
      #    task sebelumnya) BUKAN checkpoint → langsung kerjakan.
  npx rencanangoding task start <ref> --plan ${planId}                     # tandai mulai
  → kerjakan HANYA task ini sampai kelar (eksplor kode dulu, ikuti polanya).
    JANGAN sentuh task lain / baca task lain dulu.
  npx rencanangoding task complete <ref> --plan ${planId}                  # tandai selesai
  → balik ke \`task next\` untuk task berikutnya.

Kalau ke-block: npx rencanangoding task fail <ref> "alasan singkat" --plan ${planId} lalu lanjut \`task next\`.

Kenapa berhenti tiap fase/layer: user bisa verifikasi hasil tiap layer (mis. klik-klik UI frontend di atas data tiruan) sebelum agent lanjut ke backend / fase berikutnya.
Kenapa satu-per-satu: tiap task dapat konteks bersih & fokus penuh → hasil lebih tajam.
Percayakan urutan ke \`task next\` — jangan borong banyak task sekaligus.`;

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

  const copyFullPrompt = () => {
    navigator.clipboard.writeText(fullAgentPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-3xl rounded-3xl p-6 border border-white/[0.1] shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              <span>ONE-CLICK AI AGENT EXECUTION PROMPT</span>
            </div>
            <h2 className="text-lg font-bold text-gray-100">Eksekusi Otomatis AI Agent</h2>
          </div>
        </div>

        {/* 3 Quick Download / Prompt Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: Copy Full Prompt */}
          <button
            onClick={copyFullPrompt}
            className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 hover:border-emerald-400 text-left transition-all group flex flex-col justify-between shadow-lg shadow-emerald-950/40"
          >
            <div>
              <Terminal className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-emerald-200">Salin 1-Click Prompt Agent</h3>
              <p className="text-[11px] text-emerald-300/80 mt-1">Prompt lengkap siap paste ke Claude Code/OpenCode</p>
            </div>
            <span className="mt-3 text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? "PROMPT TERSALIN!" : "SALIN PROMPT →"}</span>
            </span>
          </button>

          {/* Option 2: Download PRD */}
          <button
            onClick={downloadPrdFile}
            className="p-4 rounded-2xl bg-gray-900/80 border border-white/[0.08] hover:border-cyan-500/40 hover:bg-gray-800/60 text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <Download className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-gray-200">Download Dokumen PRD</h3>
              <p className="text-[11px] text-gray-400 mt-1">File dokumen `.md` lengkap</p>
            </div>
            <span className="mt-3 text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
              UNDUH .MD →
            </span>
          </button>

          {/* Option 3: Download Spec JSON */}
          <button
            onClick={downloadZipSpec}
            className="p-4 rounded-2xl bg-gray-900/80 border border-white/[0.08] hover:border-amber-500/40 hover:bg-gray-800/60 text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <FileCode className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-bold text-gray-200">Download Spec Bundle</h3>
              <p className="text-[11px] text-gray-400 mt-1">Paket JSON PRD + Tasks</p>
            </div>
            <span className="mt-3 text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
              UNDUH JSON →
            </span>
          </button>
        </div>

        {/* Full Single-Prompt Viewer Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
            <span className="flex items-center gap-1.5 font-mono text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instruksi Perintah 1-Click untuk AI Coding Agent:</span>
            </span>

            <button
              onClick={copyFullPrompt}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? "Tersalin Ke Clipboard!" : "Salin Perintah Lengkap"}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-gray-950 border border-white/[0.1] p-4 max-h-60 overflow-y-auto font-mono text-[11px] text-gray-300 space-y-2 leading-relaxed shadow-inner">
            <pre className="whitespace-pre-wrap font-mono text-emerald-300 selection:bg-emerald-500 selection:text-white">
              {fullAgentPrompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
