"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ReactFlowMindMap } from "@/components/mindmap/ReactFlowMindMap";
import { StructureRevisionChat } from "@/components/structure/StructureRevisionChat";
import { FeatureNode, Plan } from "@rencanangoding/shared";
import { getAiHeaders } from "@/lib/useSettings";
import { Sparkles, ArrowRight, Loader2, RefreshCw, FileText, MessageSquare } from "lucide-react";

export default function StructurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<FeatureNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPrd, setGeneratingPrd] = useState(false);
  const [showRevisionChat, setShowRevisionChat] = useState(false);
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

  const handleGeneratePrd = () => {
    router.push(`/plan/${id}/prd?autoGenerate=true`);
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
    <div className="h-screen max-h-screen bg-dot-grid text-gray-100 flex flex-col overflow-hidden pb-16 md:pb-0">
      <Navbar currentPlanId={id} />

      <main className="flex-1 p-3 sm:p-4 lg:p-6 flex flex-col w-full space-y-3 overflow-hidden min-h-0">
        {/* Top Header Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 tech-panel p-3 sm:px-5 rounded-2xl border border-white/[0.08] shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-0.5">
              <Sparkles className="w-4 h-4" />
              <span>Struktur & Mind Map Fitur</span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-gray-100 truncate max-w-xl">
              {plan?.name || "Rencana Application"}
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* AI Revision Chat Toggle Button */}
            <button
              onClick={() => setShowRevisionChat(!showRevisionChat)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
                showRevisionChat
                  ? "bg-cyan-950 text-cyan-300 border-cyan-500 shadow-lg shadow-cyan-500/20"
                  : "bg-gray-900 hover:bg-gray-800 border-white/[0.1] text-cyan-400"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Revisi AI</span>
            </button>

            {/* Regenerate Structure Button */}
            <button
              onClick={triggerGenerateStructure}
              className="px-3 py-2.5 rounded-xl bg-gray-900 border border-white/[0.08] text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Regenerate Mind Map</span>
              <span className="sm:hidden text-[11px]">Regen</span>
            </button>

            {/* Proceed to PRD Studio Button */}
            <button
              onClick={handleGeneratePrd}
              disabled={generatingPrd}
              className="col-span-2 sm:col-span-1 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              {generatingPrd ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menulis PRD...</span>
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
        <div className="flex-1 w-full h-full min-h-0 overflow-hidden relative">
          <ReactFlowMindMap
            planName={plan?.name || "App Idea"}
            features={features}
            onGenerateRequested={triggerGenerateStructure}
          />
        </div>
      </main>

      {/* AI Structure Revision Chat Drawer */}
      <StructureRevisionChat
        planId={id}
        isOpen={showRevisionChat}
        onClose={() => setShowRevisionChat(false)}
        onStructureUpdated={(newFeatures) => setFeatures(newFeatures)}
      />
    </div>
  );
}
