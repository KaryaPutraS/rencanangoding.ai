import { generateObject } from "ai";
import { z } from "zod";
import { FeatureNode, TaskItem } from "@rencanangoding/shared";
import { getAiModel, AiConfig } from "../providers";

export const TaskBreakdownSchema = z.object({
  tasks: z.array(
    z.object({
      subFeatureName: z.string(),
      title: z.string(),
      description: z.string(),
      layer: z.enum(["frontend", "backend"]),
      phase: z.number().int(),
      priority: z.enum(["utama", "medium", "rendah"])
    })
  )
});

export async function generateTaskBreakdown(
  planId: string,
  features: FeatureNode[],
  language: string = "id",
  config?: AiConfig
): Promise<TaskItem[]> {
  const modelInfo = getAiModel(config);

  if (modelInfo.type !== "mock" && modelInfo.model) {
    try {
      const summary = features
        .map(
          (f) =>
            `Phase ${f.phase}: ${f.name}\n` +
            (f.subFeatures || []).map((sf) => `- Sub-Feature: ${sf.name} (${sf.description})`).join("\n")
        )
        .join("\n\n");

      const result = await generateObject({
        model: modelInfo.model,
        schema: TaskBreakdownSchema,
        prompt: `Anda adalah Lead Technical Architect & Project Manager.
Breakdown fitur-fitur berikut menjadi task-task teknis konkret dan granular untuk AI Coding Agent.
Prinsip utama: Frontend dulu dengan data mock/stub, backend menyusul!

Daftar Fitur:
${summary}

Setiap task harus memiliki layer (frontend / backend), phase (sesuai fasenya), dan priority.`
      });

      let feCounter = 1;
      let beCounter = 1;
      const now = new Date().toISOString();

      const subFeatureMap = new Map<string, string>();
      for (const f of features) {
        for (const sf of f.subFeatures || []) {
          subFeatureMap.set(sf.name.toLowerCase(), sf.id);
        }
      }

      return result.object.tasks.map((t, idx) => {
        const isFe = t.layer === "frontend";
        const ref = isFe ? `FE-${String(feCounter++).padStart(2, "0")}` : `BE-${String(beCounter++).padStart(2, "0")}`;
        const matchedSubId = subFeatureMap.get(t.subFeatureName.toLowerCase()) || features[0]?.subFeatures?.[0]?.id || crypto.randomUUID();

        return {
          id: crypto.randomUUID(),
          subFeatureId: matchedSubId,
          planId,
          ref,
          title: t.title,
          description: t.description,
          layer: t.layer,
          phase: t.phase,
          priority: t.priority,
          status: "belum_mulai",
          orderIndex: idx + 1,
          createdAt: now,
          updatedAt: now
        };
      });
    } catch (err) {
      console.warn("AI generation fallback to mock for task breakdown:", err);
    }
  }

  // Mock Task Breakdown Engine
  const now = new Date().toISOString();
  const tasks: TaskItem[] = [];
  let orderIndex = 1;

  let feCount = 1;
  let beCount = 1;

  for (const feature of features) {
    for (const sub of feature.subFeatures || []) {
      // 1. Frontend Task
      const feRef = `FE-${String(feCount++).padStart(2, "0")}`;
      tasks.push({
        id: crypto.randomUUID(),
        subFeatureId: sub.id,
        planId,
        ref: feRef,
        title: `[Frontend] UI & Layout ${sub.name}`,
        description: `Implementasi komponen antarmuka antarmuka pengguna untuk ${sub.name} (${sub.description}) menggunakan data mock.`,
        layer: "frontend",
        phase: feature.phase,
        priority: feature.phase === 1 ? "utama" : "medium",
        status: "belum_mulai",
        orderIndex: orderIndex++,
        createdAt: now,
        updatedAt: now
      });

      // 2. Backend Task
      const beRef = `BE-${String(beCount++).padStart(2, "0")}`;
      tasks.push({
        id: crypto.randomUUID(),
        subFeatureId: sub.id,
        planId,
        ref: beRef,
        title: `[Backend] API Handler & Persistence ${sub.name}`,
        description: `Implementasi endpoint API route handlers, validasi Zod, dan integrasi database Drizzle untuk ${sub.name}.`,
        layer: "backend",
        phase: feature.phase,
        priority: feature.phase === 1 ? "utama" : "medium",
        status: "belum_mulai",
        orderIndex: orderIndex++,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  return tasks;
}
