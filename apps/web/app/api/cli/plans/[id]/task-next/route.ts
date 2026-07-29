import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
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
      if (a.phase !== b.phase) return a.phase - b.phase;
      if (a.layer !== b.layer) return a.layer === "frontend" ? -1 : 1;
      return a.orderIndex - b.orderIndex;
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
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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
}
