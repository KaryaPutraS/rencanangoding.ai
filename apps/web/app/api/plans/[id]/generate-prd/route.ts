import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import {
  generatePrdMarkdown,
  generateTaskBreakdown,
  generateFeatureStructure,
  AiConfig
} from "@rencanangoding/ai";

/**
 * Self-host reads AI credentials from the user's own Settings dialog (sent as headers)
 * or their environment — there is no managed key service and nothing to pay for.
 */
function extractAiConfig(req: Request): AiConfig {
  const provider = (req.headers.get("x-ai-provider") || undefined) as AiConfig["provider"];
  const apiKey = req.headers.get("x-ai-api-key") || undefined;
  const modelName = req.headers.get("x-ai-model-name") || undefined;
  return { provider, apiKey, modelName };
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const plan = await dbStore.getPlan(id);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 404 });
    }

    let features = await dbStore.getFeatures(id);
    const discovery = await dbStore.getDiscoveryAnswers(id);
    const answersSummary = discovery.map((a) => `Q: ${a.questionText} -> A: ${a.answerText}`).join("; ");
    const aiConfig = extractAiConfig(req);

    // A PRD without a mind map has nothing to describe — build the structure first.
    if (!features || features.length === 0) {
      const { features: generatedFeatures } = await generateFeatureStructure(
        plan.rawIdea,
        answersSummary,
        plan.outputLanguage || "id",
        aiConfig
      );
      features = generatedFeatures.map((f: any) => ({ ...f, planId: id }));
      await dbStore.saveFeatures(id, features);
    }

    const prdResult = await generatePrdMarkdown(
      plan.rawIdea,
      plan.techPreference || "ai_choice",
      features,
      answersSummary,
      plan.outputLanguage || "id",
      aiConfig
    );

    const prd = await dbStore.savePrd(id, prdResult.markdown);

    // Auto-generate the task breakdown for the mind map & kanban. Skipped when tasks
    // already exist so a previous breakdown — and any CLI progress recorded on it — is
    // not overwritten by a second generation.
    let tasks: any[] = await dbStore.getTasks(id);
    if (tasks.length === 0) {
      try {
        const { tasks: generatedTasks } = await generateTaskBreakdown(
          id,
          features,
          plan.outputLanguage || "id",
          aiConfig,
          { idea: plan.rawIdea, answersSummary }
        );
        tasks = await dbStore.saveTasks(id, generatedTasks);
      } catch (err) {
        console.warn("Failed auto task breakdown during PRD generation:", err);
      }
    }

    return NextResponse.json({ success: true, prd, tasks, source: prdResult.source });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat dokumen PRD" },
      { status: 500 }
    );
  }
}
