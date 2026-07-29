import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbStore } from "@rencanangoding/db";
import { CreatePlanSchema } from "@rencanangoding/shared";

async function getCurrentUser(req: Request) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("rng_session")?.value;

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      return await dbStore.getUserByToken(token);
    }
  } catch {}
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreatePlanSchema.parse(body);
    const user = await getCurrentUser(req);

    const plan = await dbStore.createPlan({
      userId: user ? user.id : "demo-user",
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

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    const plans = await dbStore.listPlans(user ? user.id : undefined);
    return NextResponse.json({ success: true, plans });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar plan" },
      { status: 500 }
    );
  }
}
