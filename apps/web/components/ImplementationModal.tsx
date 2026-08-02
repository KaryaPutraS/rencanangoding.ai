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

  const RNG = "npx github:KaryaPutraS/rencanangoding.ai#main";

  // One prompt, pasted once, that runs an entire phase unattended. Same flow as the hosted
  // service — every command below matches the CLI's real argument shape.
  const fullAgentPrompt = `Kamu adalah AI coding agent yang mengerjakan proyek ini memakai task board RencanaNgodingAI (self-host) lewat CLI \`${RNG}\`.

━━━ ATURAN WAJIB ━━━
1. LOKASI: seluruh file, folder, dan kode dibuat LANGSUNG di direktori kerja saat ini (\`./\`). JANGAN PERNAH menulis ke direktori temporary (\`$env:TEMP\`, \`AppData\\Local\\Temp\`, \`/tmp\`).
2. OTONOM PER FASE: kerjakan SEMUA task dalam satu fase berturut-turut tanpa bertanya apa pun ke user. Kamu hanya berhenti di BATAS FASE — bukan di setiap task.
3. SATU TASK PADA SATU WAKTU. DILARANG KERAS:
   • memborong papan task (loop yang menjalankan task start/complete untuk banyak ref sekaligus)
   • membangun seluruh aplikasi lebih dulu lalu menandai semua task selesai belakangan
   • mendelegasikan seluruh proyek ke sub-agent lalu sekadar menyinkronkan status
   Urutannya wajib: ambil SATU task → start → tulis kodenya → complete → baru ambil task berikutnya.
   Server menolak lompatan urutan, penandaan ganda, dan penyelesaian yang terlalu cepat.
4. Jangan pernah menandai task selesai sebelum kodenya benar-benar jalan.

Prasyarat: Node.js (\`node -v\`). Server self-host kamu harus hidup di ${serverUrl}.

Set dulu alamat server di terminal yang sama:
   export RENCANANGODING_SERVER_URL=${serverUrl}
   # Windows PowerShell: $env:RENCANANGODING_SERVER_URL="${serverUrl}"

━━━ LANGKAH 1 — SIAPKAN (sekali saja) ━━━
${RNG} login --token ${cliToken}
${RNG} init
${RNG} plan get ${planId}

Baca PRD-nya sampai paham: tujuan produk, tech stack, dan daftar fase. Siapkan project skeleton sesuai tech stack di PRD sebelum mulai task pertama.

━━━ LANGKAH 2 — LOOP OTONOM ━━━
Ulangi terus sendiri, tanpa menunggu balasan user:

  A. Ambil task berikutnya:
     ${RNG} task next --plan ${planId} --json

     Perhatikan field di dalam "task":
       phase                → nomor fase task ini
       phaseTasksDone       → sudah berapa task selesai di fase ini
       phaseTasksTotal      → total task di fase ini
       isLastTaskOfPhase    → true berarti ini task TERAKHIR yang tersisa di fase ini
       nextPhase            → nomor fase berikutnya (null = ini fase terakhir)
       previouslyFailed     → true berarti task ini pernah ditandai gagal
       failCount            → sudah berapa kali task ini gagal
       deferred             → true berarti task ini sudah gagal 2x dan diparkir

     • "done": true → seluruh task selesai. Loncat ke LANGKAH 4.
     • deferred true → semua pekerjaan lain sudah habis, sisanya cuma task yang berulang kali gagal. BERHENTI dan laporkan ke user apa yang menghalangi. Jangan diulang terus.
     • previouslyFailed true (deferred masih false) → ini kesempatan retry, konteks di sekitarnya sekarang sudah ada. Coba sekali lagi dengan sungguh-sungguh.

  B. Tandai mulai:
     ${RNG} task start <ref> --plan ${planId}

  C. Kerjakan task itu sampai tuntas: tulis kodenya, buat file yang dibutuhkan, sambungkan ke kode yang sudah ada.

  D. Tandai selesai (pakai <ref> task-nya, contoh BE-01 — BUKAN plan id):
     ${RNG} task complete <ref> --plan ${planId}

  E. Kalau server menolak (HTTP 409), BACA pesannya dan patuhi — jangan diakali:
       OUT_OF_ORDER       → kamu melompati urutan. Jalankan "task next" dan kerjakan ref yang itu.
       ALREADY_IN_PROGRESS→ masih ada task lain yang berstatus dikerjakan. Selesaikan itu dulu.
       NOT_STARTED        → kamu belum menjalankan "task start" untuk ref ini.
       TOO_FAST           → kamu menandai selesai tanpa benar-benar menulis kode. Kerjakan dulu.
       PHASE_LOCKED       → fase sebelumnya baru tuntas. Jalankan LANGKAH 3 (verifikasi) dulu,
                            baru mulai fase berikutnya.

  F. Kalau benar-benar buntu (dependency tidak tersedia, spesifikasi bertentangan):
     ${RNG} task fail <ref> "alasan singkat" --plan ${planId}
     lalu LANGSUNG lanjut ke task berikutnya. Task yang gagal otomatis dipindah ke belakang fasenya untuk dicoba ulang sekali; kalau gagal lagi ia diparkir di paling akhir supaya fase-fase berikutnya tetap jalan. Kamu tidak akan tersangkut di task yang sama.

  G. Batas fase — kembali ke A, KECUALI salah satu ini terjadi:
       • task yang barusan kamu selesaikan punya isLastTaskOfPhase = true, ATAU
       • nomor "phase" pada task baru BERBEDA dengan fase task sebelumnya
     Kalau salah satunya terjadi, fase sebelumnya sudah tuntas → jalankan LANGKAH 3 dulu, baru teruskan.
     Selain itu: langsung kembali ke A. JANGAN bertanya ke user, JANGAN minta konfirmasi, JANGAN berhenti di tengah fase.

━━━ LANGKAH 3 — VERIFIKASI DI UJUNG FASE ━━━
Setiap satu fase tuntas, jalankan verifikasi menyeluruh untuk fase itu:
  1. Install/build:  \`npm install\` lalu \`npm run build\` (atau padanan di tech stack proyek)
  2. Lint & test bila ada:  \`npm run lint\`, \`npm test\`
  3. Jalankan aplikasinya dan pastikan hidup tanpa error
  4. Cek sendiri alur fitur yang baru dibangun di fase ini sesuai PRD

  • VERIFIKASI GAGAL → perbaiki sendiri, ulangi verifikasi. Ini bagian dari pekerjaanmu, bukan alasan berhenti.
  • VERIFIKASI LULUS → tulis ringkasan singkat fase tersebut (apa yang dibangun, file penting, cara mencobanya), lalu:
      - nextPhase masih ada angka → LANGSUNG kembali ke LANGKAH 2 untuk fase berikutnya tanpa menunggu jawaban user.
      - nextPhase null → lanjut LANGKAH 4.

━━━ LANGKAH 4 — SELESAI ━━━
Jalankan verifikasi penuh sekali lagi, lalu laporkan ke user: fitur yang sudah jadi, cara menjalankan proyek, dan task apa pun yang berstatus gagal beserta alasannya.

Mulai sekarang dari LANGKAH 1 dan jalan terus sampai selesai.`;

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
      <div className="tech-panel w-full max-w-3xl rounded-3xl p-5 sm:p-6 border border-white/[0.1] shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
