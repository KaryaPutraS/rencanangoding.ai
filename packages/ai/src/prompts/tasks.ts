import { z } from "zod";
import { generateStructuredWithUsage, type AiUsage } from "../generateStructured";
import type { FeatureNode, TaskItem } from "@rencanangoding/shared";
import { getAiModel, type AiConfig } from "../providers";

export const TaskBreakdownSchema = z.object({
  tasks: z.array(
    z.object({
      /** Reference of the mind map sub-feature this task belongs to, e.g. "SF-03". */
      subFeatureRef: z.string(),
      /** Exact sub-feature name, used as a safety net when the ref is malformed. */
      subFeatureName: z.string(),
      title: z.string().min(5),
      description: z.string().min(10),
      layer: z.enum(["frontend", "backend"]),
      priority: z.enum(["utama", "medium", "rendah"])
    })
  )
});

export interface TaskBreakdownContext {
  idea?: string;
  answersSummary?: string;
}

export interface TaskBreakdownResult {
  tasks: TaskItem[];
  /** "ai" when a real model produced the breakdown, "fallback" when the deterministic engine did. */
  source: "ai" | "fallback";
  fallbackReason?: string;
  /** Token usage of the model call, present only when source === "ai". */
  usage?: AiUsage;
}

export interface SubFeatureCatalogEntry {
  ref: string;
  id: string;
  name: string;
  description: string;
  phase: number;
  featureName: string;
  featureOrder: number;
  subOrder: number;
}

function normalizeName(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Flattens the mind map into the ordered SF-xx catalog handed to the model. */
export function buildCatalog(features: FeatureNode[]): SubFeatureCatalogEntry[] {
  const catalog: SubFeatureCatalogEntry[] = [];
  const orderedFeatures = [...features].sort(
    (a, b) => (a.phase || 1) - (b.phase || 1) || (a.orderIndex || 0) - (b.orderIndex || 0)
  );

  orderedFeatures.forEach((f, fIdx) => {
    (f.subFeatures || []).forEach((sf, sfIdx) => {
      catalog.push({
        ref: `SF-${String(catalog.length + 1).padStart(2, "0")}`,
        id: sf.id,
        name: sf.name,
        description: sf.description || "",
        phase: f.phase || 1,
        featureName: f.name,
        featureOrder: fIdx + 1,
        subOrder: sfIdx + 1
      });
    });
  });

  return catalog;
}

/** Word-overlap score used only as a last resort when the model returns an unusable reference. */
function overlapScore(text: string, entry: SubFeatureCatalogEntry): number {
  const words = new Set(normalizeName(text).split(" ").filter((w) => w.length > 3));
  if (words.size === 0) return 0;
  const target = new Set(normalizeName(`${entry.name} ${entry.description}`).split(" ").filter((w) => w.length > 3));
  let hits = 0;
  words.forEach((w) => {
    if (target.has(w)) hits++;
  });
  return hits;
}

export function resolveSubFeature(
  catalog: SubFeatureCatalogEntry[],
  raw: { subFeatureRef?: string; subFeatureName?: string; title?: string; description?: string }
): { entry: SubFeatureCatalogEntry; matchedBy: "ref" | "name" | "overlap" | "default" } {
  // 1. Explicit reference (the contract we ask the model to follow).
  const refMatch = (raw.subFeatureRef || "").toUpperCase().match(/SF-?(\d+)/);
  if (refMatch) {
    const index = parseInt(refMatch[1], 10) - 1;
    if (index >= 0 && index < catalog.length) {
      return { entry: catalog[index], matchedBy: "ref" };
    }
  }

  // 2. Exact (normalized) sub-feature name.
  const reqName = normalizeName(raw.subFeatureName || "");
  if (reqName) {
    const exact = catalog.find((c) => normalizeName(c.name) === reqName);
    if (exact) return { entry: exact, matchedBy: "name" };

    // Containment, but only for names long enough to be unambiguous.
    if (reqName.length >= 8) {
      const partial = catalog.find((c) => {
        const catName = normalizeName(c.name);
        return catName.includes(reqName) || reqName.includes(catName);
      });
      if (partial) return { entry: partial, matchedBy: "name" };
    }
  }

  // 3. Best word overlap against the task text — never a blind round-robin assignment.
  const haystack = `${raw.subFeatureName || ""} ${raw.title || ""} ${raw.description || ""}`;
  let best: SubFeatureCatalogEntry | null = null;
  let bestScore = 0;
  for (const entry of catalog) {
    const score = overlapScore(haystack, entry);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (best && bestScore > 0) return { entry: best, matchedBy: "overlap" };

  return { entry: catalog[0], matchedBy: "default" };
}

function cleanSubName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

function deterministicTaskPair(
  entry: SubFeatureCatalogEntry,
  isIndo: boolean
): { title: string; description: string; layer: "frontend" | "backend"; priority: TaskItem["priority"] }[] {
  const label = cleanSubName(entry.name);
  const priority: TaskItem["priority"] = entry.phase === 1 ? "utama" : entry.phase === 2 ? "medium" : "rendah";

  return [
    {
      title: isIndo ? `Desain UI & Antarmuka ${label}` : `UI & Interface Design for ${label}`,
      description: isIndo
        ? `Implementasi komponen visual & antarmuka pengguna untuk ${label}.`
        : `Implement the visual components and user interface for ${label}.`,
      layer: "frontend",
      priority
    },
    {
      title: isIndo ? `Engine Logika & Database ${label}` : `Logic Engine & Database for ${label}`,
      description: isIndo
        ? `Pengembangan layanan API server dan penyimpanan database untuk ${label}.`
        : `Build the server API services and database persistence for ${label}.`,
      layer: "backend",
      priority
    }
  ];
}

interface DraftTask {
  entry: SubFeatureCatalogEntry;
  title: string;
  description: string;
  layer: "frontend" | "backend";
  priority: TaskItem["priority"];
}

/**
 * Sorts by the mind map reading order (phase → feature → sub-feature → frontend first)
 * and only then assigns FE-xx / BE-xx refs, so task numbering follows the mind map.
 */
function finalizeTasks(planId: string, drafts: DraftTask[]): TaskItem[] {
  const ordered = [...drafts].sort(
    (a, b) =>
      a.entry.phase - b.entry.phase ||
      a.entry.featureOrder - b.entry.featureOrder ||
      a.entry.subOrder - b.entry.subOrder ||
      (a.layer === b.layer ? 0 : a.layer === "frontend" ? -1 : 1)
  );

  const now = new Date().toISOString();
  let feCounter = 1;
  let beCounter = 1;

  return ordered.map((d, idx) => ({
    id: crypto.randomUUID(),
    subFeatureId: d.entry.id,
    planId,
    ref:
      d.layer === "frontend"
        ? `FE-${String(feCounter++).padStart(2, "0")}`
        : `BE-${String(beCounter++).padStart(2, "0")}`,
    title: d.title,
    description: d.description,
    layer: d.layer,
    // Phase always comes from the mind map, never from the model, so the Kanban
    // can never show a phase that does not exist in the structure.
    phase: d.entry.phase,
    priority: d.priority,
    status: "belum_mulai" as const,
    orderIndex: idx + 1,
    createdAt: now,
    updatedAt: now
  }));
}

/** Guarantees no sub-feature node in the mind map is left without any task. */
function fillCoverageGaps(drafts: DraftTask[], catalog: SubFeatureCatalogEntry[], isIndo: boolean): DraftTask[] {
  const bySub = new Map<string, DraftTask[]>();
  for (const d of drafts) {
    const list = bySub.get(d.entry.id) || [];
    list.push(d);
    bySub.set(d.entry.id, list);
  }

  const filled = [...drafts];
  for (const entry of catalog) {
    const existing = bySub.get(entry.id) || [];
    if (existing.length === 0) {
      for (const t of deterministicTaskPair(entry, isIndo)) {
        filled.push({ entry, ...t });
      }
      continue;
    }
    // Each sub-feature needs at least one frontend and one backend task.
    const hasFrontend = existing.some((t) => t.layer === "frontend");
    const hasBackend = existing.some((t) => t.layer === "backend");
    for (const t of deterministicTaskPair(entry, isIndo)) {
      if ((t.layer === "frontend" && !hasFrontend) || (t.layer === "backend" && !hasBackend)) {
        filled.push({ entry, ...t });
      }
    }
  }

  return filled;
}

export interface ModelTaskDraft {
  subFeatureRef?: string;
  subFeatureName?: string;
  title: string;
  description: string;
  layer: "frontend" | "backend";
  priority: TaskItem["priority"];
}

/**
 * Turns a model's raw task list into TaskItems that are guaranteed to be consistent
 * with the mind map: every task points at a real sub-feature, every phase comes from
 * the structure, and every sub-feature ends up with at least one frontend and one
 * backend task. Pass an empty list to get the purely deterministic breakdown.
 */
export function mapModelTasksToMindMap(
  planId: string,
  rawTasks: ModelTaskDraft[],
  catalog: SubFeatureCatalogEntry[],
  isIndo: boolean
): { tasks: TaskItem[]; weakMatches: number } {
  if (catalog.length === 0) return { tasks: [], weakMatches: 0 };

  let weakMatches = 0;
  const drafts: DraftTask[] = rawTasks.map((t) => {
    const { entry, matchedBy } = resolveSubFeature(catalog, t);
    if (matchedBy === "overlap" || matchedBy === "default") weakMatches++;
    return {
      entry,
      title: t.title,
      description: t.description,
      layer: t.layer,
      priority: t.priority
    };
  });

  return {
    tasks: finalizeTasks(planId, fillCoverageGaps(drafts, catalog, isIndo)),
    weakMatches
  };
}

export async function generateTaskBreakdown(
  planId: string,
  features: FeatureNode[],
  language: string = "id",
  config?: AiConfig,
  context?: TaskBreakdownContext
): Promise<TaskBreakdownResult> {
  const modelInfo = getAiModel(config);
  const isIndo = language === "id";
  const catalog = buildCatalog(features);

  if (catalog.length === 0) {
    return { tasks: [], source: "fallback", fallbackReason: "Mind map belum memiliki sub-fitur" };
  }

  if (modelInfo.type !== "mock" && modelInfo.model) {
    try {
      const catalogText = catalog
        .map(
          (c) =>
            `${c.ref} | Fase ${c.phase} | Fitur Induk: ${c.featureName}\n` +
            `      Sub-Fitur: ${c.name}\n` +
            `      Deskripsi: ${c.description}`
        )
        .join("\n\n");

      const { object, usage } = await generateStructuredWithUsage({
        model: modelInfo.model as any,
        schema: TaskBreakdownSchema,
        system: `Anda adalah Lead Technical Architect & Product Manager.
Anda menerima MIND MAP struktur fitur sebuah aplikasi dan harus menurunkannya menjadi task implementasi.

ATURAN WAJIB:
1. **JANGAN keluar dari mind map.** Setiap task HARUS merujuk ke salah satu sub-fitur yang ada pada katalog, memakai field "subFeatureRef" (contoh: "SF-03") dan "subFeatureName" yang disalin PERSIS dari katalog.
2. **Cakupan penuh**: setiap sub-fitur pada katalog WAJIB mendapat MINIMAL 1 task frontend dan 1 task backend. Tidak boleh ada sub-fitur yang terlewat.
3. **Dilarang menggunakan kata-kata kaku/generik** seperti "[Frontend] UI & Layout..." atau "[Backend] API Handler...".
4. **Setiap judul task HARUS menyebutkan komponen/fitur nyata** (6-10 kata) yang langsung dipahami pengguna pemula, dan harus relevan dengan domain aplikasi.
   - Contoh Auth: "Portal Login Karyawan & Autentikasi OTP" (frontend) / "Server Auth Token & Security RBAC" (backend)
   - Contoh Absen: "Form Presensi Realtime & Tombol Check-in" (frontend) / "Engine Geofencing GPS & Verifikasi Radius" (backend)
   - Contoh WAHA: "Gateway Integration WAHA WhatsApp API" (backend)
5. **Deskripsi task**: 1-2 kalimat konkret tentang apa yang dibangun dan hasil akhirnya.
6. Prioritas: "utama" untuk Fase 1, "medium" untuk Fase 2, "rendah" untuk Fase 3 (kecuali ada alasan kuat).
7. Bahasa output: ${isIndo ? "Bahasa Indonesia" : "English"}.`,
        prompt: `KONTEKS APLIKASI:
- Ide Utama: "${context?.idea || "(tidak tersedia)"}"
- Hasil Discovery User: "${context?.answersSummary || "(tidak tersedia)"}"

KATALOG SUB-FITUR MIND MAP (${catalog.length} sub-fitur — gunakan ref persis seperti tertulis):

${catalogText}

Buatkan breakdown task untuk SELURUH ${catalog.length} sub-fitur di atas (minimal ${catalog.length * 2} task).`
      });

      const rawTasks = object?.tasks || [];
      if (rawTasks.length > 0) {
        const { tasks, weakMatches } = mapModelTasksToMindMap(planId, rawTasks, catalog, isIndo);

        if (weakMatches > 0) {
          console.warn(
            `Task breakdown: ${weakMatches}/${rawTasks.length} task tidak menyertakan referensi sub-fitur yang valid, dipetakan lewat kemiripan teks.`
          );
        }

        return { tasks, source: "ai", usage };
      }

      return {
        tasks: mapModelTasksToMindMap(planId, [], catalog, isIndo).tasks,
        source: "fallback",
        fallbackReason: "AI mengembalikan daftar task kosong"
      };
    } catch (err: any) {
      console.warn("AI generation fallback to deterministic engine for task breakdown:", err);
      return {
        tasks: mapModelTasksToMindMap(planId, [], catalog, isIndo).tasks,
        source: "fallback",
        fallbackReason: err?.message || "AI provider gagal merespon"
      };
    }
  }

  return {
    tasks: mapModelTasksToMindMap(planId, [], catalog, isIndo).tasks,
    source: "fallback",
    fallbackReason: "Belum ada API key AI yang aktif (mode template offline)"
  };
}
