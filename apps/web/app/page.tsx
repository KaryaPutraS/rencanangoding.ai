"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Bot, Cpu, Check, Layers, Terminal, Zap, Sparkles, Shield, Code2, Lock, UserCheck } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

const PRESET_IDEAS = [
  "SaaS Platform jualan template Prompt AI dengan langganan & payout Midtrans",
  "Aplikasi POS Kasir Restoran Multi-Outlet berbasis Next.js & Supabase",
  "Sistem E-Commerce B2B dengan Managemen Stok, Invoicing & Multi-Vendor"
];

export default function Home() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const [idea, setIdea] = useState("");
  const [language, setLanguage] = useState("id");
  const [techPref, setTechPref] = useState<"ai_choice" | "manual">("ai_choice");
  const [manualTech, setManualTech] = useState<string[]>(["Next.js", "PostgreSQL", "Tailwind CSS"]);
  const [customTechInput, setCustomTechInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddManualTech = () => {
    if (customTechInput.trim() && !manualTech.includes(customTechInput.trim())) {
      setManualTech([...manualTech, customTechInput.trim()]);
      setCustomTechInput("");
    }
  };

  const handleRemoveTech = (tech: string) => {
    setManualTech(manualTech.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Kamu wajib verifikasi email & login terlebih dahulu sebelum menggunakan sistem.");
      openAuthModal();
      return;
    }

    if (!idea.trim() || idea.trim().length < 5) {
      setError("Mohon jelaskan ide aplikasi kamu secara singkat (minimal 5 karakter).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIdea: idea,
          outputLanguage: language,
          techPreference: techPref,
          manualTechStack: techPref === "manual" ? manualTech : undefined
        })
      });

      const data = await res.json();
      if (res.status === 401 || data.error?.includes("login")) {
        setError("Silakan verifikasi email kamu terlebih dahulu.");
        openAuthModal();
        return;
      }

      if (data.success && data.plan) {
        router.push(`/plan/${data.plan.id}/discovery`);
      } else {
        setError(data.error || "Terjadi kesalahan saat membuat rencana.");
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dot-grid text-gray-100 selection:bg-emerald-500 selection:text-white max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-16 flex flex-col items-center justify-center space-y-8 sm:space-y-12 max-w-full overflow-x-hidden">
        {/* Hero Header */}
        <div className="text-center space-y-3 sm:space-y-4 max-w-3xl max-w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-mono tracking-wider uppercase shadow-lg shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">ENGINE // OPEN-SOURCE AGENT SPECS</span>
          </div>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white break-words">
            Dari ide kasar menjadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400">spesifikasi presisi</span> untuk AI Agent.
          </h1>

          <p className="text-xs sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Ubah deskripsi produk menjadi <span className="text-gray-200 font-semibold font-mono">Discovery → Struktur Fitur → PRD Studio → Task Breakdown</span> secara otomatis & terstruktur.
          </p>
        </div>

        {/* Main Input Form Card */}
        <div className="w-full tech-panel rounded-3xl p-4 sm:p-8 border border-white/[0.08] shadow-2xl space-y-5 sm:space-y-6 max-w-full">
          {/* Mandatory Login Notice Banner if not logged in */}
          {!user ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  <strong className="font-mono">VERIFIKASI EMAIL DIPERLUKAN:</strong> Silakan verifikasi email kamu sebelum membuat spesifikasi.
                </span>
              </div>
              <button
                type="button"
                onClick={openAuthModal}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs font-mono transition-colors shrink-0 flex items-center justify-center shadow-md shadow-amber-500/20"
              >
                Masuk / Verifikasi OTP
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300 font-mono">
              <span className="flex items-center gap-2 truncate">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">AKUN AKTIF: {user.email}</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-900/80 px-2 py-0.5 rounded-md font-bold shrink-0">VERIFIED</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Raw Idea Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  1. Deskripsikan Aplikasi yang Ingin Dibuat
                </label>
              </div>

              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Contoh: Saya mau buat platform SaaS kasir restoran multi-outlet berbasis Next.js dengan sistem inventori, laporan omset, dan cetak struk thermal..."
                rows={4}
                required
                className="w-full p-3.5 sm:p-4 rounded-2xl tech-input text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all resize-none font-sans"
              />

              {/* Preset Idea Chips */}
              <div className="pt-1 flex flex-col gap-1.5 text-xs max-w-full">
                <span className="text-[11px] font-mono text-gray-500">Contoh Ide:</span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
                  {PRESET_IDEAS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIdea(p);
                        if (!user) openAuthModal();
                      }}
                      className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/[0.08] text-xs text-gray-300 hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Language & Tech Preference Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono mb-2">
                  Bahasa Output Dokumen
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl tech-input text-xs font-mono text-gray-200 focus:outline-none"
                >
                  <option value="id">🇮🇩 Bahasa Indonesia</option>
                  <option value="en">🇬🇧 English (UK / US)</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="ja">🇯🇵 日本語 (Japanese)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono mb-2">
                  2. Preferensi Teknologi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTechPref("ai_choice")}
                    className={`px-3 py-3 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                      techPref === "ai_choice"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/20"
                        : "bg-gray-900/80 hover:bg-gray-800 border-white/[0.08] text-gray-400"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pilihkan AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTechPref("manual")}
                    className={`px-3 py-3 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                      techPref === "manual"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/20"
                        : "bg-gray-900/80 hover:bg-gray-800 border-white/[0.08] text-gray-400"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tentukan Manual</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Tech Stack Tags Selector */}
            {techPref === "manual" && (
              <div className="p-4 rounded-2xl bg-gray-950/80 border border-white/[0.08] space-y-3 animate-in fade-in">
                <label className="block text-xs font-bold text-gray-300 font-mono uppercase tracking-wider">
                  Daftar Tech Stack Yang Diinginkan:
                </label>
                <div className="flex flex-wrap gap-2">
                  {manualTech.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1.5 rounded-lg bg-gray-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="text-gray-400 hover:text-red-400 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTechInput}
                    onChange={(e) => setCustomTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddManualTech();
                      }
                    }}
                    placeholder="Tambah tech stack (misal: Docker, Redis...)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl tech-input text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualTech}
                    className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold font-mono transition-colors"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            )}

            {/* Error Notice Banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium space-y-2 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>{error}</span>
                  {!user && (
                    <button
                      type="button"
                      onClick={openAuthModal}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-[11px] shrink-0 self-start sm:self-auto"
                    >
                      Login OTP →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm tracking-wider uppercase font-mono shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span>MEMPROSES RENCANA APLIKASI...</span>
              ) : (
                <>
                  <span>BUAT SPESIFIKASI SEKARANG</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
