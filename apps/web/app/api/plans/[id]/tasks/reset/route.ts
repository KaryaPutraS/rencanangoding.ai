import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const tasks = await dbStore.resetTaskProgress(id);

    return NextResponse.json({
      success: true,
      message: "Progres task berhasil direset ke status awal",
      tasks
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
