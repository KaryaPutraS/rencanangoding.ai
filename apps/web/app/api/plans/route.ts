import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { CreatePlanSchema } from "@rencanangoding/shared";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreatePlanSchema.parse(body);

    const plan = await dbStore.createPlan({
      rawIdea: parsed.rawIdea,
      outputLanguage: parsed.outputLanguage as any,
      techPreference: parsed.techPreference as any,
      techStackJson: parsed.manualTechStack || null
    });

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat plan" },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const plans = await dbStore.listPlans();
    return NextResponse.json({ success: true, plans });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar plan" },
      { status: 500 }
    );
  }
}
