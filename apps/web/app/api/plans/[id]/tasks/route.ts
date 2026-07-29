import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const tasks = await dbStore.getTasks(id);
    return NextResponse.json({ success: true, tasks });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar tasks" },
      { status: 500 }
    );
  }
}
