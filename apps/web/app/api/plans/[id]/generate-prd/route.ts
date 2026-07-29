import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { generatePrdMarkdown, generateTaskBreakdown, AiConfig } from "@rencanangoding/ai";

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
  const { id } = await props.params;

  const plan = await dbStore.getPlan(id);
  if (!plan) {
    return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 404 });
  }

  const features = await dbStore.getFeatures(id);
  const discovery = await dbStore.getDiscoveryAnswers(id);
  const answersSummary = discovery.map((a) => `Q: ${a.questionText} -> A: ${a.answerText}`).join("; ");

  const aiConfig = extractAiConfig(req);
  const markdown = await generatePrdMarkdown(
    plan.rawIdea,
    plan.techPreference,
    features,
    answersSummary,
    plan.outputLanguage,
    aiConfig
  );

  const prd = await dbStore.savePrd(id, markdown);

  // Auto-generate task breakdown for Mind Map & Task Kanban
  let tasks: any[] = [];
  try {
    const generatedTasks = await generateTaskBreakdown(id, features, plan.outputLanguage, aiConfig);
    tasks = await dbStore.saveTasks(id, generatedTasks);
  } catch (err) {
    console.warn("Failed auto task breakdown during PRD generation:", err);
  }

  return NextResponse.json({ success: true, prd, tasks });
}
