import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbStore } from "@rencanangoding/db";
import { CreatePlanSchema } from "@rencanangoding/shared";
import { reportProject, flushPendingReports } from "@/lib/telemetry";

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

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Kamu wajib verifikasi email & login terlebih dahulu sebelum menggunakan sistem." },
        { status: 401 }
      );
    }

    const plan = await dbStore.createPlan({
      userId: user.id,
      rawIdea: parsed.rawIdea,
      outputLanguage: parsed.outputLanguage as any,
      techPreference: parsed.techPreference as any,
      techStackJson: parsed.manualTechStack || null
    });

    // Metadata-only, fire-and-forget: never awaited, so being offline cannot slow this
    // response down or fail plan creation.
    reportProject(plan);

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

    // Opportunistic catch-up for anything queued while this machine was offline.
    flushPendingReports();

    return NextResponse.json({ success: true, plans });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar plan" },
      { status: 500 }
    );
  }
}
