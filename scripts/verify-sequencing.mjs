/**
 * Verifies the task board refuses the "borong" pattern: one real run built the whole app
 * in a single delegated pass, then closed all 28 tasks with one shell loop and never ran a
 * phase verification. These checks lock that door.
 *
 *   node --experimental-strip-types scripts/verify-sequencing.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
register(pathToFileURL(path.join(repoRoot, "scripts/alias-loader.mjs")));

let pass = 0, fail = 0;
const check = (n, c, d) => { c ? (pass++, console.log(`  ✅ ${n}`)) : (fail++, console.log(`  ❌ ${n}${d ? ` → ${d}` : ""}`)); };

const cli = await import(pathToFileURL(path.join(repoRoot, "packages/shared/src/cliTasks.ts")).href);
const { validateTaskTransition, headTask } = cli;

const SEC = 1000;
const iso = (ms) => new Date(ms).toISOString();
const T0 = Date.parse("2026-08-02T10:00:00.000Z");

/** Same shape the real board uses: 2 phases, mixed layers. */
const board = () => [
  { ref: "FE-01", phase: 1, layer: "frontend", status: "belum_mulai" },
  { ref: "BE-01", phase: 1, layer: "backend", status: "belum_mulai" },
  { ref: "FE-02", phase: 1, layer: "frontend", status: "belum_mulai" },
  { ref: "BE-02", phase: 2, layer: "backend", status: "belum_mulai" },
  { ref: "FE-03", phase: 2, layer: "frontend", status: "belum_mulai" },
];

const opts = { minWorkSeconds: 15, phaseVerifySeconds: 60 };

// --- 1. Satu task pada satu waktu, sesuai urutan -----------------------------
console.log("\n── 1. Urutan & satu task pada satu waktu ──");

let tasks = board();
check("task pertama boleh dimulai",
  validateTaskTransition(tasks, "FE-01", "dikerjakan", new Date(T0), opts).ok);

let v = validateTaskTransition(tasks, "FE-02", "dikerjakan", new Date(T0), opts);
check("melompati urutan ditolak", !v.ok && v.code === "OUT_OF_ORDER", v.code);
check("pesannya menyebut task yang benar", (v.error || "").includes("FE-01"), v.error);

tasks[0].status = "dikerjakan";
tasks[0].startedAt = iso(T0);
v = validateTaskTransition(tasks, "BE-01", "dikerjakan", new Date(T0 + SEC), opts);
check("mulai task kedua saat ada yang berjalan ditolak", !v.ok && v.code === "ALREADY_IN_PROGRESS", v.code);

check("head task = task yang sedang dikerjakan", headTask(tasks).ref === "FE-01", headTask(tasks)?.ref);

// --- 2. Harus start dulu sebelum complete ------------------------------------
console.log("\n── 2. Wajib start sebelum complete ──");

tasks = board();
v = validateTaskTransition(tasks, "FE-01", "selesai", new Date(T0), opts);
check("complete tanpa start ditolak", !v.ok && v.code === "NOT_STARTED", v.code);

v = validateTaskTransition(tasks, "FE-01", "gagal", new Date(T0), opts);
check("fail tanpa start juga ditolak", !v.ok && v.code === "NOT_STARTED", v.code);

// --- 3. Terlalu cepat = tidak ada kode yang benar-benar ditulis ---------------
console.log("\n── 3. Penyelesaian instan ditolak ──");

tasks = board();
tasks[0].status = "dikerjakan";
tasks[0].startedAt = iso(T0);

v = validateTaskTransition(tasks, "FE-01", "selesai", new Date(T0 + 200), opts);
check("selesai 0,2 detik setelah start ditolak", !v.ok && v.code === "TOO_FAST", v.code);
check("memberi tahu harus menunggu berapa lama", (v.retryAfter || 0) > 0, String(v.retryAfter));

v = validateTaskTransition(tasks, "FE-01", "selesai", new Date(T0 + 20 * SEC), opts);
check("selesai setelah 20 detik diterima", v.ok, v.code);

// Menandai gagal tidak dibatasi waktu — buntu bisa ketahuan cepat.
v = validateTaskTransition(tasks, "FE-01", "gagal", new Date(T0 + 200), opts);
check("menandai gagal tidak kena batas waktu", v.ok, v.code);

// --- 4. Batas fase menahan cukup lama untuk verifikasi -----------------------
console.log("\n── 4. Batas fase terkunci sampai verifikasi ──");

tasks = board();
tasks[0].status = "selesai"; tasks[0].updatedAt = iso(T0);
tasks[1].status = "selesai"; tasks[1].updatedAt = iso(T0 + 30 * SEC);
tasks[2].status = "selesai"; tasks[2].updatedAt = iso(T0 + 60 * SEC); // fase 1 tuntas

v = validateTaskTransition(tasks, "BE-02", "dikerjakan", new Date(T0 + 61 * SEC), opts);
check("langsung loncat ke fase 2 ditolak", !v.ok && v.code === "PHASE_LOCKED", v.code);
check("pesannya menyuruh verifikasi fase 1", (v.error || "").includes("Fase 1"), v.error);

v = validateTaskTransition(tasks, "BE-02", "dikerjakan", new Date(T0 + 130 * SEC), opts);
check("setelah jeda verifikasi, fase 2 boleh mulai", v.ok, v.code);

// Fase pertama tidak pernah terkunci.
tasks = board();
check("fase 1 tidak pernah terkunci",
  validateTaskTransition(tasks, "FE-01", "dikerjakan", new Date(T0), opts).ok);

// --- 5. Replay pola "borong" dari log nyata ----------------------------------
console.log("\n── 5. Replay pola borong (harus gagal) ──");

// Persis seperti loop PowerShell yang dipakai agent: start+complete beruntun tanpa jeda.
tasks = board();
let now = T0;
let closed = 0;
let firstRejection = null;

for (const ref of ["FE-01", "BE-01", "FE-02", "BE-02", "FE-03"]) {
  const startVerdict = validateTaskTransition(tasks, ref, "dikerjakan", new Date(now), opts);
  if (!startVerdict.ok) { firstRejection = firstRejection || startVerdict.code; break; }
  const t = tasks.find((x) => x.ref === ref);
  t.status = "dikerjakan";
  t.startedAt = iso(now);
  now += 40; // ~40 ms per iterasi, seperti loop shell sungguhan

  const doneVerdict = validateTaskTransition(tasks, ref, "selesai", new Date(now), opts);
  if (!doneVerdict.ok) { firstRejection = firstRejection || doneVerdict.code; break; }
  t.status = "selesai";
  t.updatedAt = iso(now);
  closed++;
  now += 40;
}

check("loop borong TIDAK bisa menutup semua task", closed < 5, `${closed}/5 tertutup`);
check("ditolak pada task pertama", closed === 0, `${closed} sempat tertutup`);
check("alasan penolakan: terlalu cepat", firstRejection === "TOO_FAST", String(firstRejection));

// --- 6. Alur jujur tetap lolos ------------------------------------------------
console.log("\n── 6. Agent yang benar-benar bekerja tetap lolos ──");

tasks = board();
now = T0;
let completed = [];
let phaseVerifications = 0;
let guard = 0;
let lastPhase = null;

while (guard++ < 20) {
  const head = headTask(tasks);
  if (!head) break;

  // Batas fase: agent yang benar menjalankan verifikasi (butuh waktu) dulu.
  if (lastPhase !== null && head.phase !== lastPhase) {
    now += 90 * SEC; // build + lint + test
    phaseVerifications++;
  }

  const sv = validateTaskTransition(tasks, head.ref, "dikerjakan", new Date(now), opts);
  if (!sv.ok) { check(`start ${head.ref} tidak boleh ditolak`, false, sv.error); break; }
  head.status = "dikerjakan";
  head.startedAt = iso(now);

  now += 3 * 60 * SEC; // menulis kode

  const cv = validateTaskTransition(tasks, head.ref, "selesai", new Date(now), opts);
  if (!cv.ok) { check(`complete ${head.ref} tidak boleh ditolak`, false, cv.error); break; }
  head.status = "selesai";
  head.updatedAt = iso(now);
  completed.push(head.ref);
  lastPhase = head.phase;
  now += SEC;
}

check("semua task selesai lewat jalur yang benar", completed.length === 5, completed.join(","));
check("urutannya sesuai papan", completed.join(",") === "FE-01,BE-01,FE-02,BE-02,FE-03", completed.join(","));
check("melewati tepat 1 batas fase", phaseVerifications === 1, String(phaseVerifications));

// --- 7. Sakelar konfigurasi ---------------------------------------------------
console.log("\n── 7. Aturan bisa dilonggarkan lewat konfigurasi ──");

tasks = board();
tasks[0].status = "dikerjakan";
tasks[0].startedAt = iso(T0);
check("minWorkSeconds 0 mematikan batas waktu",
  validateTaskTransition(tasks, "FE-01", "selesai", new Date(T0 + 10), { minWorkSeconds: 0, phaseVerifySeconds: 0 }).ok);

check("membuka kembali task selalu boleh",
  validateTaskTransition(tasks, "FE-01", "belum_mulai", new Date(T0 + 10), opts).ok);

check("ref tak dikenal diserahkan ke route (bukan ditolak di sini)",
  validateTaskTransition(tasks, "XX-99", "selesai", new Date(T0), opts).ok);

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass} lolos, ${fail} gagal\n`);
process.exit(fail === 0 ? 0 : 1);
