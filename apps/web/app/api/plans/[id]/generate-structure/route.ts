import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { generateFeatureStructure, AiConfig } from "@rencanangoding/ai";

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

    let revisionPrompt: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body && typeof body.revisionPrompt === "string") {
        revisionPrompt = body.revisionPrompt;
      }
    } catch {}

    const plan = await dbStore.getPlan(id);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 404 });
    }

    const discovery = await dbStore.getDiscoveryAnswers(id);
    const answersSummary = discovery.map((a) => `Q: ${a.questionText} -> A: ${a.answerText}`).join("; ");

    const aiConfig = extractAiConfig(req);
    const generatedFeatures = await generateFeatureStructure(
      plan.rawIdea,
      answersSummary,
      plan.outputLanguage,
      aiConfig,
      revisionPrompt
    );

    const featuresWithPlanId = generatedFeatures.map((f) => ({
      ...f,
      planId: id
    }));

    const saved = await dbStore.saveFeatures(id, featuresWithPlanId);

    return NextResponse.json({ success: true, features: saved });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal merancang struktur fitur" },
      { status: 500 }
    );
  }
}
