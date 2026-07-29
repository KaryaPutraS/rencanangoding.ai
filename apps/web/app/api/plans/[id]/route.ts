import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const plan = await dbStore.getPlan(id);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 404 });
    }

    const discovery = await dbStore.getDiscoveryAnswers(id);
    const features = await dbStore.getFeatures(id);
    const prd = await dbStore.getPrd(id);
    const tasks = await dbStore.getTasks(id);
    const chatMessages = await dbStore.getChatMessages(id);

    return NextResponse.json({
      success: true,
      plan,
      discovery,
      features,
      prd,
      tasks,
      chatMessages
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil detail plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const deleted = await dbStore.deletePlan(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Plan berhasil dihapus" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus plan" },
      { status: 500 }
    );
  }
}
