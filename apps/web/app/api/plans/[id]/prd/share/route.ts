import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const body = await req.json().catch(() => ({}));
    const isPublic = typeof body.isPublic === "boolean" ? body.isPublic : true;

    const prd = await dbStore.togglePrdPublic(id, isPublic);
    if (!prd) {
      return NextResponse.json({ success: false, error: "PRD tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isPublic: prd.isPublic,
      publicSlug: prd.publicSlug,
      shareUrl: `/public/prd/${prd.publicSlug}`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengubah status share" },
      { status: 500 }
    );
  }
}
