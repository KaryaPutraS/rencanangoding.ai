import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

export async function POST(
  req: Request,
  props: { params: Promise<{ ref: string }> }
) {
  const { ref } = await props.params;

  const url = new URL(req.url);
  const planId = url.searchParams.get("planId");
  if (!planId) {
    return NextResponse.json({ success: false, error: "Query param planId diperlukan" }, { status: 400 });
  }

  const task = await dbStore.updateTaskStatus(planId, ref, "selesai");
  if (!task) {
    return NextResponse.json({ success: false, error: `Task dengan ref ${ref} tidak ditemukan` }, { status: 404 });
  }

  return NextResponse.json({ success: true, task });
}
