"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { PrdSplitView } from "@/components/prd/PrdSplitView";
import { LivePrdGeneratorView } from "@/components/prd/LivePrdGeneratorView";
import { FeatureNode, TaskItem, Plan, PrdDocument } from "@rencanangoding/shared";
import { getAiHeaders } from "@/lib/useSettings";
import { Loader2 } from "lucide-react";

export default function PrdStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const shouldAutoGenerate = searchParams.get("autoGenerate") === "true";

  const [plan, setPlan] = useState<Plan | null>(null);
  const [prd, setPrd] = useState<PrdDocument | null>(null);
  const [features, setFeatures] = useState<FeatureNode[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlan(data.plan);
          setFeatures(data.features || []);
          setTasks(data.tasks || []);

          if (data.prd && !shouldAutoGenerate) {
            setPrd(data.prd);
            setLoading(false);
          } else {
            // Need to generate PRD live
            setGenerating(true);
            setLoading(false);
          }
        } else {
          setError(data.error || "Gagal memuat dokumen PRD");
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Gagal terhubung ke server");
        setLoading(false);
      });
  }, [id, shouldAutoGenerate]);

  const executeGeneratePrdApi = async () => {
    const res = await fetch(`/api/plans/${id}/generate-prd`, {
      method: "POST",
      headers: { ...getAiHeaders() }
    });
    return await res.json();
  };

  if (loading) {
    return (
      <div className="h-screen bg-dot-grid text-gray-100 flex flex-col">
        <Navbar currentPlanId={id} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          <h2 className="text-lg font-bold text-gray-200">Memuat PRD Studio...</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Menyiapkan tampilan split-view dokumen PRD dan mind map interaktif.
          </p>
        </main>
      </div>
    );
  }

  // Live Streaming PRD Generation Screen with visual effects
  if (generating || (!prd && !error)) {
    return (
      <div className="h-screen max-h-screen bg-dot-grid text-gray-100 flex flex-col overflow-hidden">
        <Navbar currentPlanId={id} />
        <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
          <LivePrdGeneratorView
            planName={plan?.name || "App Specification"}
            generateApiCall={executeGeneratePrdApi}
            onFinished={(newPrd) => {
              setPrd(newPrd);
              setGenerating(false);
            }}
            onError={(msg) => {
              setError(msg);
              setGenerating(false);
            }}
          />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-dot-grid text-gray-100 flex flex-col">
        <Navbar currentPlanId={id} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              setGenerating(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            Coba Buat PRD Kembali
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-dot-grid text-gray-100 flex flex-col overflow-hidden">
      <Navbar currentPlanId={id} />

      <main className="flex-1 p-4 lg:p-6 flex flex-col overflow-hidden min-h-0">
        <PrdSplitView
          planId={id}
          planName={plan?.name || "App Idea"}
          initialMarkdown={prd?.contentMarkdown || ""}
          features={features}
          tasks={tasks}
        />
      </main>
    </div>
  );
}
