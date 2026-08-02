import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { prepareTasksForAgent, summarizePhases } from "@rencanangoding/shared";

const VALID_STATUSES = ["belum_mulai", "dikerjakan", "selesai", "gagal"];

/**
 * Task board for one plan — the same contract the hosted service exposes, so the exact
 * same CLI and the exact same one-click agent prompt work against a self-hosted server.
 *
 * The list is ordered and enriched by prepareTasksForAgent: the CLI takes the first
 * un-finished task straight off it, and every task carries the phase metadata an agent
 * needs to run a whole phase unattended.
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;

    const rawTasks = await dbStore.getTasks(id);
    return NextResponse.json({
      success: true,
      tasks: prepareTasksForAgent(rawTasks),
      phases: summarizePhases(rawTasks),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar tasks" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const body = await req.json();

    const { ref, status, failReason } = body;
    if (!ref || !status) {
      return NextResponse.json({ success: false, error: "Parameter ref dan status diperlukan" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status tidak valid. Pilih salah satu: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const plan = await dbStore.getPlan(id);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 404 });
    }

    const updatedTask = await dbStore.updateTaskStatus(
      id,
      ref,
      status,
      // A task that succeeds on retry must not keep its old failure note.
      status === "gagal" ? failReason || "Gagal dieksekusi" : null
    );

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: `Task "${ref}" tidak ditemukan pada plan ini` },
        { status: 404 }
      );
    }

    const rawTasks = await dbStore.getTasks(id);
    return NextResponse.json({
      success: true,
      task: updatedTask,
      tasks: prepareTasksForAgent(rawTasks),
      phases: summarizePhases(rawTasks),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui task" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  return PATCH(req, props);
}
