/**
 * Shapes the task list for the CLI agent runner.
 *
 * The CLI (`rencanangodingai task next`) is intentionally
 * thin: it fetches this plan, takes the FIRST task whose status is not "selesai", and
 * prints it verbatim. Everything the agent needs to run a whole phase unattended has to
 * come from here — which also means fixes ship with a server deploy, without waiting for
 * anyone to update the CLI.
 *
 * Two things this file guarantees:
 *
 *  1. Ordering. A task marked "gagal" stays un-"selesai" forever, so leaving it at the
 *     front made `task fail` → `task next` hand back the same task endlessly — the agent
 *     could never move on. Now a failure moves the task behind the rest of its phase (one
 *     retry once the surrounding work exists), and a second failure parks it after every
 *     other phase so one stubborn task can never hold the whole build hostage.
 *
 *  2. Phase context. The raw task has no idea how big its phase is or whether it is the
 *     last one in it, so an agent cannot tell where a phase ends. Each task is enriched
 *     with that, letting the agent finish an entire phase, verify it, then continue.
 */

export interface CliTask {
  ref?: string;
  title?: string;
  layer?: string;
  phase?: number;
  status?: string;
  failReason?: string | null;
  failCount?: number;
  [key: string]: any;
}

const PHASE_FALLBACK = 1;

/** After this many failed attempts a task stops blocking the phases behind it. */
export const DEFER_AFTER_FAILURES = 2;

function phaseOf(task: CliTask): number {
  const value = Number(task.phase);
  return Number.isFinite(value) && value > 0 ? value : PHASE_FALLBACK;
}

function isDone(task: CliTask): boolean {
  return task.status === "selesai";
}

function isBlocked(task: CliTask): boolean {
  return task.status === "gagal";
}

function failCountOf(task: CliTask): number {
  const value = Number(task.failCount);
  if (Number.isFinite(value) && value > 0) return value;
  // Older records only carry the status, which is worth one attempt.
  return isBlocked(task) ? 1 : 0;
}

/** True once a task has failed enough times to be parked behind every remaining phase. */
export function isDeferred(task: CliTask): boolean {
  return isBlocked(task) && failCountOf(task) >= DEFER_AFTER_FAILURES;
}

/**
 * Orders tasks the way the agent should work through them: phase by phase, workable items
 * before ones that already failed, and repeatedly-failing items after everything else so
 * the remaining phases still get built. Finished tasks keep their relative place so the
 * kanban and the PRD view still read naturally.
 */
export function orderTasksForAgent<T extends CliTask>(tasks: T[]): T[] {
  return [...tasks]
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      // Parked tasks sink below every phase, not just their own.
      const deferredDiff = Number(isDeferred(a.task)) - Number(isDeferred(b.task));
      if (deferredDiff !== 0) return deferredDiff;

      const phaseDiff = phaseOf(a.task) - phaseOf(b.task);
      if (phaseDiff !== 0) return phaseDiff;

      // Within a phase: pending work first, one-time failures last (retried in context).
      const blockedDiff = Number(isBlocked(a.task)) - Number(isBlocked(b.task));
      if (blockedDiff !== 0) return blockedDiff;

      return a.index - b.index; // otherwise keep the generated order
    })
    .map((entry) => entry.task);
}

/**
 * Adds per-phase progress onto every task. The CLI prints the task object as-is, so these
 * fields are what the agent actually sees when it asks for the next task.
 */
export function withPhaseProgress<T extends CliTask>(tasks: T[]): (T & {
  phaseTotal: number;
  phaseTasksTotal: number;
  phaseTasksDone: number;
  phaseTasksRemaining: number;
  isLastTaskOfPhase: boolean;
  nextPhase: number | null;
  previouslyFailed: boolean;
  failCount: number;
  deferred: boolean;
})[] {
  const phases = [...new Set(tasks.map(phaseOf))].sort((a, b) => a - b);
  const phaseTotal = phases.length;

  return tasks.map((task) => {
    const phase = phaseOf(task);
    const inPhase = tasks.filter((t) => phaseOf(t) === phase);
    const doneInPhase = inPhase.filter(isDone).length;

    // Remaining work in this phase excluding the task itself and anything already parked,
    // so the last *workable* task of a phase is recognisable before it is completed.
    const remainingOthers = inPhase.filter((t) => t !== task && !isDone(t) && !isDeferred(t)).length;
    const phaseIndex = phases.indexOf(phase);

    return {
      ...task,
      phaseTotal,
      phaseTasksTotal: inPhase.length,
      phaseTasksDone: doneInPhase,
      phaseTasksRemaining: inPhase.length - doneInPhase,
      isLastTaskOfPhase: !isDone(task) && !isDeferred(task) && remainingOthers === 0,
      nextPhase: phaseIndex >= 0 && phaseIndex < phases.length - 1 ? phases[phaseIndex + 1] : null,
      previouslyFailed: isBlocked(task),
      failCount: failCountOf(task),
      deferred: isDeferred(task),
    };
  });
}

/** Both steps together — what plan-detail responses hand to the CLI. */
export function prepareTasksForAgent<T extends CliTask>(tasks: T[]) {
  return withPhaseProgress(orderTasksForAgent(tasks));
}

/** Plan-wide phase summary, for the agent's end-of-phase report. */
export function summarizePhases(tasks: CliTask[]) {
  const phases = [...new Set(tasks.map(phaseOf))].sort((a, b) => a - b);

  return phases.map((phase) => {
    const inPhase = tasks.filter((t) => phaseOf(t) === phase);
    const done = inPhase.filter(isDone).length;
    const blocked = inPhase.filter(isBlocked);

    return {
      phase,
      tasksTotal: inPhase.length,
      tasksDone: done,
      tasksRemaining: inPhase.length - done,
      completed: done === inPhase.length,
      blockedRefs: blocked.map((t) => t.ref).filter(Boolean),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sequencing rules
//
// Wording in the prompt is a request; a capable agent can still bulk-mark the whole
// board. One real run built the entire app in a single delegated pass, then closed all
// 28 tasks with one shell loop — no per-phase verification ever happened. The board is
// the only place that can actually refuse that, so the rules live here and the API
// enforces them.
//
// None of this can prove work was done. What it can do is make the cheap shortcut fail:
// tasks must be taken one at a time, in queue order, started before they are completed,
// and a phase boundary holds long enough for the verification step to actually run.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Defaults. The API layer reads its own environment (TASK_MIN_WORK_SECONDS,
 * PHASE_VERIFY_SECONDS) and passes overrides in — this module stays free of Node
 * globals so it can be shared by the server and any isomorphic consumer.
 */

/** Minimum time between marking a task started and completing it. 0 disables the check. */
export const MIN_WORK_SECONDS = 15;

/** How long a phase boundary stays shut so end-of-phase verification can run. */
export const PHASE_VERIFY_SECONDS = 60;

export type TransitionCode =
  | "OUT_OF_ORDER"
  | "ALREADY_IN_PROGRESS"
  | "NOT_STARTED"
  | "TOO_FAST"
  | "PHASE_LOCKED";

export interface TransitionResult {
  ok: boolean;
  code?: TransitionCode;
  error?: string;
  /** Seconds the caller should wait before retrying; only set for timing rejections. */
  retryAfter?: number;
}

function timeOf(value: unknown): number {
  const t = new Date(String(value || "")).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** The single task the agent is allowed to act on right now. */
export function headTask<T extends CliTask>(tasks: T[]): T | null {
  return orderTasksForAgent(tasks).find((t) => !isDone(t)) || null;
}

/**
 * Decides whether one status change is allowed. Pure — the caller persists nothing until
 * this returns ok.
 */
export function validateTaskTransition(
  tasks: CliTask[],
  ref: string,
  nextStatus: string,
  now: Date = new Date(),
  options: { minWorkSeconds?: number; phaseVerifySeconds?: number } = {}
): TransitionResult {
  const minWorkMs = Math.max(0, options.minWorkSeconds ?? MIN_WORK_SECONDS) * 1000;
  const phaseVerifyMs = Math.max(0, options.phaseVerifySeconds ?? PHASE_VERIFY_SECONDS) * 1000;

  const task = tasks.find((t) => t.ref === ref);
  if (!task) return { ok: true }; // the route reports "not found" on its own

  // Re-opening a task is always allowed; it only ever loses progress.
  if (nextStatus === "belum_mulai") return { ok: true };

  const head = headTask(tasks);

  if (nextStatus === "dikerjakan") {
    const inFlight = tasks.find((t) => t.status === "dikerjakan" && t.ref !== ref);
    if (inFlight) {
      return {
        ok: false,
        code: "ALREADY_IN_PROGRESS",
        error: `Task "${inFlight.ref}" masih berstatus dikerjakan. Selesaikan dulu task itu sebelum memulai "${ref}" — kerjakan satu per satu, jangan diborong.`,
      };
    }

    if (head && head.ref !== ref) {
      return {
        ok: false,
        code: "OUT_OF_ORDER",
        error: `Urutan task tidak boleh dilompati. Task berikutnya adalah "${head.ref}", bukan "${ref}". Jalankan "task next" untuk melihat task yang benar.`,
      };
    }

    // Phase boundary: hold the next phase shut long enough for verification to run.
    const phase = phaseOf(task);
    const earlierPhases = [...new Set(tasks.map(phaseOf))].filter((p) => p < phase).sort((a, b) => a - b);
    const previousPhase = earlierPhases[earlierPhases.length - 1];

    if (previousPhase !== undefined && phaseVerifyMs > 0) {
      const previousTasks = tasks.filter((t) => phaseOf(t) === previousPhase);
      const settled = previousTasks.every((t) => isDone(t) || isDeferred(t));
      const lastFinishedAt = Math.max(0, ...previousTasks.filter(isDone).map((t) => timeOf(t.updatedAt)));

      if (settled && lastFinishedAt > 0) {
        const elapsed = now.getTime() - lastFinishedAt;
        if (elapsed < phaseVerifyMs) {
          const wait = Math.ceil((phaseVerifyMs - elapsed) / 1000);
          return {
            ok: false,
            code: "PHASE_LOCKED",
            error: `Fase ${previousPhase} baru saja selesai. Jalankan verifikasi fase itu dulu (build, lint, test, dan coba jalankan aplikasinya) sebelum memulai Fase ${phase}. Coba lagi dalam ${wait} detik.`,
            retryAfter: wait,
          };
        }
      }
    }

    return { ok: true };
  }

  if (nextStatus === "selesai" || nextStatus === "gagal") {
    if (task.status !== "dikerjakan") {
      return {
        ok: false,
        code: "NOT_STARTED",
        error: `Task "${ref}" belum ditandai dikerjakan. Jalankan "task start ${ref}" dan kerjakan kodenya dulu sebelum menandainya ${nextStatus}.`,
      };
    }

    // Completing is fine whenever real work happened; a batch loop closes in milliseconds.
    if (nextStatus === "selesai" && minWorkMs > 0) {
      const startedAt = timeOf(task.startedAt || task.updatedAt);
      const elapsed = now.getTime() - startedAt;
      if (startedAt > 0 && elapsed < minWorkMs) {
        const wait = Math.ceil((minWorkMs - elapsed) / 1000);
        return {
          ok: false,
          code: "TOO_FAST",
          error: `Task "${ref}" baru dimulai ${Math.round(elapsed / 1000)} detik lalu. Kerjakan kodenya sungguh-sungguh dulu — jangan menandai selesai tanpa menulis kode. Coba lagi dalam ${wait} detik.`,
          retryAfter: wait,
        };
      }
    }

    return { ok: true };
  }

  return { ok: true };
}
