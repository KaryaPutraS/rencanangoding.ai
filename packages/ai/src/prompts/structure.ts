import { generateObject } from "ai";
import { z } from "zod";
import { FeatureNode } from "@rencanangoding/shared";
import { getAiModel, AiConfig } from "../providers";

export const FeatureStructureSchema = z.object({
  features: z.array(
    z.object({
      name: z.string(),
      phase: z.number().int().min(1),
      status: z.enum(["direncanakan", "dikerjakan", "selesai"]).default("direncanakan"),
      subFeatures: z.array(
        z.object({
          name: z.string(),
          description: z.string()
        })
      )
    })
  )
});

export async function generateFeatureStructure(
  idea: string,
  answersSummary: string,
  language: string = "id",
  config?: AiConfig
): Promise<FeatureNode[]> {
  const modelInfo = getAiModel(config);

  if (modelInfo.type !== "mock" && modelInfo.model) {
    try {
      const result = await generateObject({
        model: modelInfo.model,
        schema: FeatureStructureSchema,
        prompt: `Anda adalah Lead Software Architect.
User memiliki ide aplikasi: "${idea}"
Konteks tambahan dari discovery: "${answersSummary}"
Bahasa output: ${language === "id" ? "Bahasa Indonesia" : "English"}

Buatkan breakdown mind map fitur komprehensif yang terbagi ke dalam minimal 3 Fase (Fase 1: MVP Core, Fase 2: Enhancements & Integrations, Fase 3: Scale & Analytics).
Tiap fase memiliki 2-4 fitur utama, dan tiap fitur utama memiliki 2-5 sub-fitur dengan deskripsi jelas.`
      });

      return result.object.features.map((f, fIdx) => {
        const featureId = crypto.randomUUID();
        return {
          id: featureId,
          planId: "",
          name: f.name,
          phase: f.phase,
          status: f.status as "direncanakan" | "dikerjakan" | "selesai",
          orderIndex: fIdx + 1,
          subFeatures: f.subFeatures.map((sf, sfIdx) => ({
            id: crypto.randomUUID(),
            featureId,
            name: sf.name,
            description: sf.description,
            orderIndex: sfIdx + 1
          }))
        };
      });
    } catch (err) {
      console.warn("AI generation fallback to mock for feature structure:", err);
    }
  }

  // Mock structure generator
  const isIndo = language === "id";
  const planId = "";

  const f1Id = crypto.randomUUID();
  const f2Id = crypto.randomUUID();
  const f3Id = crypto.randomUUID();
  const f4Id = crypto.randomUUID();

  return [
    {
      id: f1Id,
      planId,
      name: isIndo ? "Fase 1 — Core Foundation & Authentication" : "Phase 1 — Core Foundation & Auth",
      phase: 1,
      status: "direncanakan",
      orderIndex: 1,
      subFeatures: [
        {
          id: crypto.randomUUID(),
          featureId: f1Id,
          name: isIndo ? "User Registration & Auth Token" : "User Auth & API Tokens",
          description: isIndo ? "Sistem pendaftaran user dan manajemen API key/token untuk integrasi CLI" : "User sign up, login, and CLI token generation",
          orderIndex: 1
        },
        {
          id: crypto.randomUUID(),
          featureId: f1Id,
          name: isIndo ? "Workspace & Project Manager" : "Workspace & Project Manager",
          description: isIndo ? "Pengelolaan workspace, daftar rencana aplikasi, dan settings preferensi tech stack" : "Manage project spaces, tech choices, and user profiles",
          orderIndex: 2
        }
      ]
    },
    {
      id: f2Id,
      planId,
      name: isIndo ? "Fase 1 — Core Product Engine" : "Phase 1 — Core Engine Workflow",
      phase: 1,
      status: "direncanakan",
      orderIndex: 2,
      subFeatures: [
        {
          id: crypto.randomUUID(),
          featureId: f2Id,
          name: isIndo ? "Input Ide & Adaptive Discovery Wizard" : "Idea Input & Discovery Wizard",
          description: isIndo ? "Form input ide aplikasi, opsi bahasa, dan 5 pertanyaan pendalaman kontekstual" : "Idea prompt submission with adaptive question wizard",
          orderIndex: 1
        },
        {
          id: crypto.randomUUID(),
          featureId: f2Id,
          name: isIndo ? "Mind Map Fitur Interaktif" : "Interactive Mind Map Visualizer",
          description: isIndo ? "Visualisasi diagram mind map dengan node expand/collapse dan React Flow engine" : "React Flow interactive node graph with zoom/pan and node inspection",
          orderIndex: 2
        },
        {
          id: crypto.randomUUID(),
          featureId: f2Id,
          name: isIndo ? "PRD Document Studio & Split View" : "PRD Document Studio & Split View",
          description: isIndo ? "Editor markdown split-view dengan preview realtime dan chat revisi AI" : "Split-view markdown workspace with live preview and AI editor",
          orderIndex: 3
        }
      ]
    },
    {
      id: f3Id,
      planId,
      name: isIndo ? "Fase 2 — Task Breakdown & Execution Kanban" : "Phase 2 — Task Breakdown & Kanban",
      phase: 2,
      status: "direncanakan",
      orderIndex: 3,
      subFeatures: [
        {
          id: crypto.randomUUID(),
          featureId: f3Id,
          name: isIndo ? "AI Task Generation Engine" : "AI Task Generation Engine",
          description: isIndo ? "Breakdown otomatis sub-fitur menjadi task granular dengan pengelompokan Frontend & Backend" : "Automatic decomposition of features into frontend/backend tasks",
          orderIndex: 1
        },
        {
          id: crypto.randomUUID(),
          featureId: f3Id,
          name: isIndo ? "Kanban Board & Realtime Task Status Sync" : "Realtime Kanban Task Board",
          description: isIndo ? "Papan Kanban interaktif dengan sync status realtime dari CLI" : "Interactive Kanban board tracking CLI execution status in real-time",
          orderIndex: 2
        }
      ]
    },
    {
      id: f4Id,
      planId,
      name: isIndo ? "Fase 3 — CLI Sync, Checkpoint & Agent Bridge" : "Phase 3 — CLI & Agent Integration",
      phase: 3,
      status: "direncanakan",
      orderIndex: 4,
      subFeatures: [
        {
          id: crypto.randomUUID(),
          featureId: f4Id,
          name: isIndo ? "CLI Runner & Task Next Endpoint" : "CLI Runner & Task Next Endpoint",
          description: isIndo ? "Endpoint server `task next` dengan kontrol checkpoint otomatis antar phase/layer" : "Server queue controller with strict layer/phase checkpoint enforcement",
          orderIndex: 1
        },
        {
          id: crypto.randomUUID(),
          featureId: f4Id,
          name: isIndo ? "Implementation Prompts & Export Packages" : "Implementation Prompts & Export Packages",
          description: isIndo ? "Export PRD markdown, ZIP archive, dan CLI prompt siap-pakai untuk Claude Code/Cursor" : "Export PRD, ZIP bundle, and ready-to-run CLI AI prompt",
          orderIndex: 2
        }
      ]
    }
  ];
}
