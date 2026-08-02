/**
 * Verifies what the CLI agent runner sees: task ordering that can never trap the agent in
 * a loop, phase metadata that marks where a phase ends, and the auth gate on the task
 * board.
 *
 *   node --experimental-strip-types scripts/verify-cli.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
register(pathToFileURL(path.join(repoRoot, "scripts/alias-loader.mjs")));

let pass = 0, fail = 0;
const check = (n, c, d) => { c ? (pass++, console.log(`  ✅ ${n}`)) : (fail++, console.log(`  ❌ ${n}${d ? ` → ${d}` : ""}`)); };

const cli = await import(pathToFileURL(path.join(repoRoot, "packages/shared/src/cliTasks.ts")).href);
const { prepareTasksForAgent, orderTasksForAgent, summarizePhases, isDeferred } = cli;

/** Exactly what the CLI does: first task whose status is not "selesai". */
const cliPick = (tasks) => prepareTasksForAgent(tasks).find((t) => t.status !== "selesai") || null;

const board = () => [
  { ref: "BE-01", phase: 1, layer: "backend", status: "belum_mulai" },
  { ref: "BE-02", phase: 1, layer: "backend", status: "belum_mulai" },
  { ref: "FE-01", phase: 1, layer: "frontend", status: "belum_mulai" },
  { ref: "BE-03", phase: 2, layer: "backend", status: "belum_mulai" },
  { ref: "FE-02", phase: 2, layer: "frontend", status: "belum_mulai" },
];

// --- 1. Urutan dasar ---------------------------------------------------------
console.log("\n── 1. Urutan pengerjaan ──");

let tasks = board();
check("mulai dari task pertama fase 1", cliPick(tasks).ref === "BE-01", cliPick(tasks)?.ref);
check("fase 1 dikerjakan sebelum fase 2",
  orderTasksForAgent(tasks).map((t) => t.phase).join("") === "11122");

tasks[0].status = "selesai";
check("task selesai dilewati", cliPick(tasks).ref === "BE-02", cliPick(tasks)?.ref);

tasks[1].status = "dikerjakan";
check("task 'dikerjakan' diambil lagi (bisa dilanjut)", cliPick(tasks).ref === "BE-02", cliPick(tasks)?.ref);

// --- 2. Task gagal tidak boleh mengunci agent --------------------------------
console.log("\n── 2. Task gagal tidak menjebak agent ──");

tasks = board();
tasks[0].status = "selesai";
tasks[1].status = "gagal";
tasks[1].failCount = 1;

const afterFail = cliPick(tasks);
check("setelah gagal, agent lanjut ke task lain", afterFail.ref === "FE-01", afterFail.ref);
check("task gagal TIDAK dikembalikan lagi seketika", afterFail.ref !== "BE-02");

tasks[2].status = "selesai";
const retry = cliPick(tasks);
check("saat fase habis, task gagal ditawarkan untuk retry", retry.ref === "BE-02", retry.ref);
check("ditandai pernah gagal", retry.previouslyFailed === true);
check("belum diparkir setelah 1x gagal", retry.deferred === false);

// Gagal kedua kali → diparkir di belakang seluruh fase.
tasks[1].failCount = 2;
const afterSecondFail = cliPick(tasks);
check("gagal 2x tidak lagi menghalangi fase berikutnya", afterSecondFail.ref === "BE-03",
  afterSecondFail.ref);
check("task terparkir ditandai deferred", isDeferred(tasks[1]) === true);
check("terparkir berada paling akhir",
  orderTasksForAgent(tasks).at(-1).ref === "BE-02", orderTasksForAgent(tasks).at(-1).ref);

tasks[3].status = "selesai";
tasks[4].status = "selesai";
const onlyParked = cliPick(tasks);
check("kalau tinggal yang terparkir, itulah yang muncul", onlyParked.ref === "BE-02", onlyParked.ref);
check("agent tahu harus berhenti (deferred true)", onlyParked.deferred === true);

// Simulasi loop penuh: harus berhenti, bukan berputar selamanya.
tasks = board();
const seen = [];
let guard = 0;
let state = tasks;
while (guard++ < 50) {
  const next = cliPick(state);
  if (!next) break;
  if (next.deferred) { seen.push(`STOP:${next.ref}`); break; }
  const target = state.find((t) => t.ref === next.ref);
  if (target.ref === "BE-02") {
    target.status = "gagal";
    target.failCount = (target.failCount || 0) + 1;
  } else {
    target.status = "selesai";
  }
  seen.push(target.ref);
}
check("loop agent selalu berhenti", guard < 50, `iterasi ${guard}`);
check("setiap task workable dikerjakan", ["BE-01", "FE-01", "BE-03", "FE-02"].every((r) => seen.includes(r)),
  seen.join(" → "));
check("BE-02 dicoba tepat 2x", seen.filter((r) => r === "BE-02").length === 2, seen.join(" → "));
check("berakhir dengan sinyal berhenti", seen.at(-1) === "STOP:BE-02", seen.at(-1));

// --- 3. Penanda batas fase ---------------------------------------------------
console.log("\n── 3. Penanda batas fase ──");

tasks = board();
let enriched = prepareTasksForAgent(tasks);
check("tahu total fase", enriched[0].phaseTotal === 2, String(enriched[0].phaseTotal));
check("tahu jumlah task per fase", enriched[0].phaseTasksTotal === 3, String(enriched[0].phaseTasksTotal));
check("tahu fase berikutnya", enriched[0].nextPhase === 2, String(enriched[0].nextPhase));
check("fase terakhir tidak punya nextPhase",
  enriched.find((t) => t.phase === 2).nextPhase === null);
check("task pertama bukan penutup fase", enriched[0].isLastTaskOfPhase === false);

tasks[0].status = "selesai";
tasks[1].status = "selesai";
enriched = prepareTasksForAgent(tasks);
const closer = enriched.find((t) => t.ref === "FE-01");
check("task tersisa terakhir di fase ditandai penutup", closer.isLastTaskOfPhase === true);
check("hitungan progres fase benar", closer.phaseTasksDone === 2 && closer.phaseTasksRemaining === 1,
  `${closer.phaseTasksDone}/${closer.phaseTasksRemaining}`);
check("task fase lain tidak ikut ditandai penutup",
  enriched.find((t) => t.ref === "BE-03").isLastTaskOfPhase === false);

// Task terparkir tidak boleh menahan penanda penutup fase.
tasks = board();
tasks[0].status = "selesai";
tasks[1].status = "gagal";
tasks[1].failCount = 2;
enriched = prepareTasksForAgent(tasks);
check("penutup fase tetap terdeteksi walau ada task terparkir",
  enriched.find((t) => t.ref === "FE-01").isLastTaskOfPhase === true);

// --- 4. Ringkasan fase -------------------------------------------------------
console.log("\n── 4. Ringkasan fase ──");

const summary = summarizePhases(tasks);
check("ada 2 fase di ringkasan", summary.length === 2, String(summary.length));
check("fase 1 punya 3 task", summary[0].tasksTotal === 3, String(summary[0].tasksTotal));
check("fase 1 belum tuntas", summary[0].completed === false);
check("task gagal terdaftar sebagai blocked", summary[0].blockedRefs.join(",") === "BE-02",
  summary[0].blockedRefs.join(","));

const allDone = board().map((t) => ({ ...t, status: "selesai" }));
check("semua selesai → completed true", summarizePhases(allDone).every((p) => p.completed));
check("semua selesai → CLI melaporkan done", cliPick(allDone) === null);

// --- 5. Fase yang tidak berurutan / hilang -----------------------------------
console.log("\n── 5. Data fase tidak rapi ──");

const messy = [
  { ref: "A-1", status: "belum_mulai" },              // tanpa phase
  { ref: "B-1", phase: 3, status: "belum_mulai" },
  { ref: "C-1", phase: 7, status: "belum_mulai" },
];
const messyEnriched = prepareTasksForAgent(messy);
check("task tanpa phase dianggap fase 1", messyEnriched[0].phase === undefined || cliPick(messy).ref === "A-1",
  cliPick(messy)?.ref);
check("fase melompat tetap terurut", messyEnriched.map((t) => t.ref).join(",") === "A-1,B-1,C-1",
  messyEnriched.map((t) => t.ref).join(","));
check("nextPhase mengikuti fase yang benar-benar ada",
  messyEnriched.find((t) => t.ref === "B-1").nextPhase === 7,
  String(messyEnriched.find((t) => t.ref === "B-1").nextPhase));
check("fase terakhir nextPhase null", messyEnriched.find((t) => t.ref === "C-1").nextPhase === null);
check("daftar kosong tidak error", prepareTasksForAgent([]).length === 0);
check("ringkasan daftar kosong tidak error", summarizePhases([]).length === 0);

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass} lolos, ${fail} gagal\n`);
process.exit(fail === 0 ? 0 : 1);
