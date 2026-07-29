import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const prd = await dbStore.getPrdBySlug(slug);
    if (!prd) {
      return NextResponse.json(
        { success: false, error: "Dokumen PRD publik tidak ditemukan atau privat" },
        { status: 404 }
      );
    }

    const plan = await dbStore.getPlan(prd.planId);

    return NextResponse.json({
      success: true,
      prd,
      planName: plan?.name || "Rencana Application"
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil PRD publik" },
      { status: 500 }
    );
  }
}
