import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { generateTaskBreakdown, AiConfig } from "@rencanangoding/ai";

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

    const features = await dbStore.getFeatures(id);
    if (features.length === 0) {
      return NextResponse.json({ success: false, error: "Struktur fitur belum tersedia" }, { status: 400 });
    }

    const aiConfig = extractAiConfig(req);
    const generatedTasks = await generateTaskBreakdown(id, features, plan.outputLanguage, aiConfig);
    const saved = await dbStore.saveTasks(id, generatedTasks);

    return NextResponse.json({ success: true, tasks: saved });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal merancang breakdown task" },
      { status: 500 }
    );
  }
}
