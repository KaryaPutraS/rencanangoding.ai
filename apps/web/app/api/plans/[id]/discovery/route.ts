import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { generateDiscoveryQuestions, AiConfig } from "@rencanangoding/ai";
import { SaveDiscoverySchema } from "@rencanangoding/shared";

function extractAiConfig(req: Request): AiConfig {
  const provider = (req.headers.get("x-ai-provider") || undefined) as AiConfig["provider"];
  const apiKey = req.headers.get("x-ai-api-key") || undefined;
  const modelName = req.headers.get("x-ai-model-name") || undefined;
  return { provider, apiKey, modelName };
}

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  const plan = await dbStore.getPlan(id);
  if (!plan) {
    return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 404 });
  }

  const existingAnswers = await dbStore.getDiscoveryAnswers(id);
  if (existingAnswers.length > 0) {
    return NextResponse.json({ success: true, answers: existingAnswers });
  }

  const aiConfig = extractAiConfig(req);
  const generated = await generateDiscoveryQuestions(plan.rawIdea, plan.outputLanguage, aiConfig);

  return NextResponse.json({
    success: true,
    questions: generated.questions
  });
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const body = await req.json();
    const parsed = SaveDiscoverySchema.parse(body);

    const saved = await dbStore.saveDiscoveryAnswers(id, parsed.answers);
    return NextResponse.json({ success: true, answers: saved });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyimpan jawaban discovery" },
      { status: 400 }
    );
  }
}
