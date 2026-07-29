"use client";

import { useState, useEffect, use } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Share2, Copy, Check, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PublicPrdPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [prdMarkdown, setPrdMarkdown] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/public/prd/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.prd) {
          setPrdMarkdown(data.prd.contentMarkdown);
          setPlanName(data.planName);
        } else {
          setError(data.error || "Dokumen PRD publik tidak ditemukan");
        }
      })
      .catch(() => setError("Gagal memuat dokumen publik"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopy = () => {
    if (prdMarkdown) {
      navigator.clipboard.writeText(prdMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dot-grid text-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <h2 className="text-base font-bold text-gray-200">Memuat Dokumen PRD Publik...</h2>
      </div>
    );
  }

  if (error || !prdMarkdown) {
    return (
      <div className="min-h-screen bg-dot-grid text-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-12 h-12 text-gray-600 mb-4" />
        <h2 className="text-lg font-bold text-gray-200">Dokumen Tidak Tersedia</h2>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">{error}</p>
        <Link
          href="/"
          className="mt-6 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
        >
          Buat Rencana Aplikasi Sendiri
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dot-grid text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 tech-panel border-b border-white/[0.08] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-gray-100">
              RencanaNgoding<span className="text-emerald-400">.ai</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold uppercase tracking-wider">
              Public Read-Only PRD
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-gray-900 border border-white/[0.08] hover:bg-gray-800 text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Tersalin!" : "Salin Dokumen"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="tech-panel p-6 sm:p-10 rounded-3xl border border-white/[0.08] shadow-2xl">
          <article className="prose prose-invert max-w-none prose-headings:text-emerald-200 prose-a:text-sky-400 prose-code:text-emerald-300 text-xs leading-relaxed space-y-4">
            <ReactMarkdown>{prdMarkdown}</ReactMarkdown>
          </article>
        </div>
      </main>
    </div>
  );
}
