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

    const tasks = await dbStore.getTasks(id);

    // Filter tasks with 'belum_mulai' status
    const pendingTasks = tasks
      .filter((t) => t.status === "belum_mulai")
      .sort((a, b) => {
        const aPhase = typeof a.phase === "number" ? a.phase : 1;
        const bPhase = typeof b.phase === "number" ? b.phase : 1;
        if (aPhase !== bPhase) return aPhase - bPhase;
        if (a.layer !== b.layer) return a.layer === "frontend" ? -1 : 1;
        const aOrder = typeof a.orderIndex === "number" ? a.orderIndex : 0;
        const bOrder = typeof b.orderIndex === "number" ? b.orderIndex : 0;
        return aOrder - bOrder;
      });

    if (pendingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        done: true,
        message: "🎉 Semua task dalam plan ini telah selesai dikerjakan!"
      });
    }

    const nextTask = pendingTasks[0];

    // Find last completed task to determine if a checkpoint boundary is crossed
    const completedTasks = tasks
      .filter((t) => t.status === "selesai")
      .sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });

    const lastCompleted = completedTasks[0];

    let checkpoint = false;
    let checkpointMessage = "";

    if (lastCompleted) {
      if (lastCompleted.phase !== nextTask.phase) {
        checkpoint = true;
        checkpointMessage = `🛑 CHECKPOINT: Fase ${lastCompleted.phase} telah selesai! Harap uji coba aplikasi sebelum melanjutkan ke Fase ${nextTask.phase}.`;
      } else if (lastCompleted.layer === "frontend" && nextTask.layer === "backend") {
        checkpoint = true;
        checkpointMessage = `🛑 CHECKPOINT: Implementasi Frontend Fase ${nextTask.phase} selesai — coba klik-klik dulu UI di browser sebelum memasang Backend API!`;
      }
    }

    return NextResponse.json({
      success: true,
      done: false,
      task: {
        id: nextTask.id,
        ref: nextTask.ref,
        title: nextTask.title,
        description: nextTask.description,
        layer: nextTask.layer,
        phase: nextTask.phase,
        priority: nextTask.priority,
        status: nextTask.status
      },
      checkpoint,
      message: checkpointMessage || undefined
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil task next" },
      { status: 500 }
    );
  }
}
