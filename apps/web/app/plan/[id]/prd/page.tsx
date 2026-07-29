"use client";

import { useState, useEffect, use } from "react";
import { Navbar } from "@/components/Navbar";
import { PrdSplitView } from "@/components/prd/PrdSplitView";
import { FeatureNode, TaskItem, Plan, PrdDocument } from "@rencanangoding/shared";
import { Loader2 } from "lucide-react";

export default function PrdStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [prd, setPrd] = useState<PrdDocument | null>(null);
  const [features, setFeatures] = useState<FeatureNode[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlan(data.plan);
          setPrd(data.prd);
          setFeatures(data.features || []);
          setTasks(data.tasks || []);
        } else {
          setError(data.error || "Gagal memuat dokumen PRD");
        }
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (error || !prd) {
    return (
      <div className="h-screen bg-dot-grid text-gray-100 flex flex-col">
        <Navbar currentPlanId={id} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-red-400 mb-4">{error || "Dokumen PRD belum dibuat."}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetch(`/api/plans/${id}/generate-prd`, { method: "POST" })
                .then((res) => res.json())
                .then((data) => setPrd(data.prd))
                .finally(() => setLoading(false));
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
          >
            Generate PRD Sekarang
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
          initialMarkdown={prd.contentMarkdown}
          features={features}
          tasks={tasks}
        />
      </main>
    </div>
  );
}
