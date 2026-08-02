import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { prepareTasksForAgent, summarizePhases } from "@rencanangoding/shared";

/**
 * Next task for the CLI agent runner.
 *
 * Two behaviours were corrected here so a self-hosted run matches the hosted one:
 *
 *  - It used to only consider tasks with status "belum_mulai". A task the agent had
 *    marked "gagal" was therefore skipped and never retried, and a task left
 *    "dikerjakan" by an interrupted run was abandoned. Both are picked up now.
 *
 *  - It used to raise a checkpoint whenever the layer changed from frontend to backend,
 *    which happens *inside* a phase — so the agent stopped to ask for verification in the
 *    middle of the work. A checkpoint now means exactly one thing: a phase finished.
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;

    const plan = await dbStore.getPlan(id);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 404 });
    }

    const rawTasks = await dbStore.getTasks(id);

    if (rawTasks.length === 0) {
      return NextResponse.json({
        success: true,
        done: true,
        message: "Belum ada task yang digenerate untuk plan ini.",
      });
    }

    const ordered = prepareTasksForAgent(rawTasks);
    const phases = summarizePhases(rawTasks);
    const nextTask = ordered.find((t) => t.status !== "selesai");

    if (!nextTask) {
      return NextResponse.json({
        success: true,
        done: true,
        message: "🎉 Semua task dalam plan ini telah selesai dikerjakan!",
        phases,
      });
    }

    // A checkpoint means a whole phase is finished: every earlier phase is done and this
    // task opens a new one.
    const currentPhase = nextTask.phase ?? 1;
    const previousPhase = phases.filter((p) => p.phase < currentPhase).pop();
    const openedNewPhase = Boolean(previousPhase?.completed && nextTask.phaseTasksDone === 0);

    return NextResponse.json({
      success: true,
      done: false,
      task: nextTask,
      progress: {
        current: rawTasks.filter((t) => t.status === "selesai").length + 1,
        total: rawTasks.length,
        layer: nextTask.layer,
        phase: currentPhase,
      },
      phases,
      checkpoint: openedNewPhase,
      message: openedNewPhase
        ? `🛑 CHECKPOINT: Fase ${previousPhase!.phase} selesai. Jalankan verifikasi (build/lint/test) dulu, lalu lanjut Fase ${currentPhase}.`
        : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil task next" },
      { status: 500 }
    );
  }
}
