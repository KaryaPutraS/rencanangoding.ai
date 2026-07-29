"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SupportedLanguages } from "@rencanangoding/shared";
import { ArrowRight, Bot, Cpu, Check, Layers, Terminal, Zap, Sparkles, Shield, Code2 } from "lucide-react";

const PRESET_IDEAS = [
  "SaaS Platform jualan template Prompt AI dengan langganan & payout Midtrans",
  "Aplikasi POS Kasir Restoran Multi-Outlet berbasis Next.js & Supabase",
  "Sistem E-Commerce B2B dengan Managemen Stok, Invoicing & Multi-Vendor"
];

export default function Home() {
  const router = useRouter();
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
    <div className="min-h-screen flex flex-col bg-dot-grid text-gray-100 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 lg:py-16 flex flex-col items-center justify-center space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono tracking-widest uppercase shadow-lg shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ENGINE // OPEN-SOURCE AGENT SPECS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Dari ide kasar menjadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400">spesifikasi presisi</span> untuk AI Agent.
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Ubah deskripsi produk menjadi <span className="text-gray-200 font-semibold font-mono">Discovery → Struktur Fitur → PRD Studio → Task Breakdown</span> secara otomatis & terstruktur.
          </p>
        </div>

        {/* Main Input Form Card */}
        <div className="w-full tech-panel rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Idea Input Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>1. Deskripsikan Aplikasi Yang Ingin Dibuat</span>
                </label>
                <span className="text-[10px] font-mono text-gray-500">Minimal 5 Karakter</span>
              </div>

              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Contoh: Saya mau buat platform SaaS kasir restoran multi-outlet berbasis web dengan sistem langganan & payout otomatis..."
                rows={4}
                className="w-full p-4 rounded-2xl tech-input text-sm text-gray-100 leading-relaxed focus:ring-1 focus:ring-emerald-500 resize-none font-sans"
              />

              {/* Preset Idea Chips */}
              <div className="pt-1 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-[11px] font-mono text-gray-500 shrink-0">Contoh Ide:</span>
                {PRESET_IDEAS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIdea(p)}
                    className="px-2.5 py-1 rounded-lg bg-gray-900/90 hover:bg-gray-800 border border-white/[0.08] text-[11px] text-gray-300 hover:text-white transition-colors truncate max-w-xs shrink-0"
                  >
                    {p}
                  </button>
                ))}
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
                  className="w-full px-4 py-3 rounded-2xl tech-input text-xs font-semibold text-gray-200"
                >
                  {SupportedLanguages.map((l) => (
                    <option key={l.code} value={l.code} className="bg-gray-900 text-gray-200">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono mb-2">
                  2. Preferensi Teknologi
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-2xl border border-white/[0.08] text-xs">
                  <button
                    type="button"
                    onClick={() => setTechPref("ai_choice")}
                    className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                      techPref === "ai_choice"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Pilihkan AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTechPref("manual")}
                    className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                      techPref === "manual"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Kustom Tech</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Tech Stack Chips Input */}
            {techPref === "manual" && (
              <div className="p-4 rounded-2xl bg-gray-950/80 border border-white/[0.08] space-y-3 animate-in fade-in">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Pilih / Tambah Tech Stack
                </label>
                <div className="flex flex-wrap gap-2">
                  {manualTech.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-mono text-xs flex items-center gap-1.5"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(t)}
                        className="hover:text-red-400 ml-1 text-gray-400 font-bold"
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
                    placeholder="Tambah tech lain (misal: Redis, Prisma, FastAPI)..."
                    className="flex-1 px-3.5 py-2 rounded-xl tech-input text-xs font-mono"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddManualTech();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddManualTech}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold font-mono transition-colors"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Zap className="w-5 h-5 animate-spin" />
                  <span>Memproses Arsitektur Aplikasi...</span>
                </>
              ) : (
                <>
                  <span>Mulai Rancang Spesifikasi Sekarang</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature Cards Grid (Anti-AI Slop Modern Linear Theme) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          <div className="tech-card p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-100 font-mono">1. Discovery & Mind Map</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Tanya jawab terarah untuk menghasilkan struktur node arsitektur Frontend, Backend, dan Security.
            </p>
          </div>

          <div className="tech-card p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-100 font-mono">2. PRD Studio & Diagram</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Spesifikasi lengkap dengan Mermaid System Architecture (`graph TB`) & Database ERD (`erDiagram`).
            </p>
          </div>

          <div className="tech-card p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-100 font-mono">3. Task Kanban & CLI Agent</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Breakdown tugas granular yang dapat dieksekusi otomatis menggunakan CLI runner di komputer lokal kamu.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
