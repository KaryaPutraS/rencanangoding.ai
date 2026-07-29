"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ReactFlowMindMap } from "@/components/mindmap/ReactFlowMindMap";
import { FeatureNode, Plan } from "@rencanangoding/shared";
import { getAiHeaders } from "@/lib/useSettings";
import { Sparkles, ArrowRight, Loader2, RefreshCw, FileText } from "lucide-react";

export default function StructurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<FeatureNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPrd, setGeneratingPrd] = useState(false);
  const [error, setError] = useState("");

  const triggerGenerateStructure = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${id}/generate-structure`, {
        method: "POST",
        headers: { ...getAiHeaders() }
      });
      const data = await res.json();
      if (data.success) {
        setFeatures(data.features || []);
      } else {
        setError(data.error || "Gagal membuat struktur fitur");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initPage() {
      try {
        const res = await fetch(`/api/plans/${id}`);
        const data = await res.json();
        if (data.success) {
          setPlan(data.plan);
          if (data.features && data.features.length > 0) {
            setFeatures(data.features);
            setLoading(false);
          } else {
            // Auto generate features if not created yet
            const genRes = await fetch(`/api/plans/${id}/generate-structure`, {
              method: "POST",
              headers: { ...getAiHeaders() }
            });
            const genData = await genRes.json();
            if (genData.success) {
              setFeatures(genData.features || []);
            }
            setLoading(false);
          }
        } else {
          setError(data.error || "Gagal memuat rencana");
          setLoading(false);
        }
      } catch (err) {
        setError("Gagal terhubung ke server");
        setLoading(false);
      }
    }
    initPage();
  }, [id]);

  const handleGeneratePrd = async () => {
    setGeneratingPrd(true);
    try {
      const res = await fetch(`/api/plans/${id}/generate-prd`, {
        method: "POST",
        headers: { ...getAiHeaders() }
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/plan/${id}/prd`);
      } else {
        setError(data.error || "Gagal membuat PRD");
        setGeneratingPrd(false);
      }
    } catch (err) {
      setError("Gagal membuat PRD");
      setGeneratingPrd(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-dot-grid text-gray-100 flex flex-col overflow-hidden">
        <Navbar currentPlanId={id} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          <h2 className="text-lg font-bold text-gray-200">Menyusun Mind Map Fitur Aplikasi...</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            AI sedang membagi kebutuhan menjadi <span className="font-mono text-emerald-400">Fase 1</span>, <span className="font-mono text-emerald-400">Fase 2</span>, dan sub-fitur granular.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-dot-grid text-gray-100 flex flex-col overflow-hidden">
      <Navbar currentPlanId={id} />

      <main className="flex-1 p-4 lg:p-6 flex flex-col w-full space-y-3 overflow-hidden min-h-0">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 tech-panel p-3.5 px-5 rounded-2xl border border-white/[0.08] shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-0.5">
              <Sparkles className="w-4 h-4" />
              <span>Struktur & Mind Map Fitur</span>
            </div>
            <h1 className="text-base font-extrabold text-gray-100 truncate max-w-xl">
              {plan?.name || "Rencana Application"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerGenerateStructure}
              className="px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Mind Map</span>
            </button>

            <button
              onClick={handleGeneratePrd}
              disabled={generatingPrd}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 hover:scale-105"
            >
              {generatingPrd ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menulis Dokumen PRD...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Lanjut ke PRD Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs shrink-0">
            {error}
          </div>
        )}

        {/* Full Screen React Flow Mind Map View */}
        <div className="flex-1 w-full h-full min-h-0 overflow-hidden">
          <ReactFlowMindMap
            planName={plan?.name || "App Idea"}
            features={features}
            onGenerateRequested={triggerGenerateStructure}
          />
        </div>
      </main>
    </div>
  );
}
