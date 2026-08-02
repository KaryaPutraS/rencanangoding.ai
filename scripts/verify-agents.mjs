/**
 * Verification harness for the mind map (structure) agent and the task breakdown agent.
 *
 * Runs offline: it exercises the deterministic paths plus the model-response mapping
 * that the AI path uses, and asserts the invariants the two agents must uphold.
 *
 *   node --experimental-strip-types scripts/verify-agents.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
register(pathToFileURL(path.join(repoRoot, "scripts/alias-loader.mjs")));

const { buildFallbackStructure, generateFeatureStructure } = await import(
  pathToFileURL(path.join(repoRoot, "packages/ai/src/prompts/structure.ts")).href
);
const { buildCatalog, mapModelTasksToMindMap, generateTaskBreakdown } = await import(
  pathToFileURL(path.join(repoRoot, "packages/ai/src/prompts/tasks.ts")).href
);

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail ? ` → ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const allSubNames = (features) =>
  features.flatMap((f) => (f.subFeatures || []).map((sf) => sf.name.toLowerCase()));

// ---------------------------------------------------------------------------
section("1. Mind map follows the idea's domain (offline template engine)");

const domainCases = [
  {
    idea: "Aplikasi laundry kiloan untuk outlet cuci setrika",
    answers: "Q: Integrasi? -> A: Notifikasi WhatsApp WAHA",
    expect: /laundry|cucian|setrika|kiloan/,
    forbid: /barcode|rekam medis|siswa/
  },
  {
    idea: "Aplikasi toko online marketplace fashion dengan keranjang belanja",
    answers: "Q: Pembayaran? -> A: Midtrans QRIS",
    expect: /etalase|keranjang|checkout/,
    forbid: /rekam medis|absensi|kurir/
  },
  {
    idea: "Aplikasi logistik pengiriman paket dengan tracking kurir dan armada",
    answers: "Q: Integrasi? -> A: Google Maps GPS",
    expect: /kiriman|armada|resi|driver|rute/,
    forbid: /rekam medis|siswa|kasir touchscreen/
  },
  {
    idea: "Aplikasi kasir POS minimarket dengan scan barcode dan cetak struk",
    answers: "Q: Pembayaran? -> A: QRIS dinamis",
    expect: /kasir|barcode|stok/,
    forbid: /rekam medis|siswa|laundry/
  },
  {
    idea: "Aplikasi klinik kesehatan dengan rekam medis pasien dan apotek",
    answers: "Q: Integrasi? -> A: Pengingat WhatsApp",
    expect: /pasien|rekam medis|apotek|farmasi/,
    forbid: /barcode|siswa|kurir/
  },
  {
    idea: "Aplikasi LMS sekolah untuk siswa, guru, dan ujian online",
    answers: "Q: Pembayaran? -> A: SPP lewat transfer bank",
    expect: /siswa|kurikulum|ujian|kelas/,
    forbid: /rekam medis|kasir touchscreen|laundry/
  },
  {
    idea: "Aplikasi manajemen komunitas hobi fotografi untuk berbagi portofolio",
    answers: "Q: Upload? -> A: Butuh upload foto dan dokumen",
    expect: /otentikasi|workflow|dashboard/,
    forbid: /rekam medis|barcode|kiriman/
  }
];

for (const c of domainCases) {
  const features = buildFallbackStructure(c.idea, c.answers, undefined, true);
  const names = allSubNames(features).join(" | ");
  check(
    `"${c.idea.slice(0, 45)}…" → domain benar`,
    c.expect.test(names),
    `sub-fitur: ${names.slice(0, 140)}`
  );
  check(
    `"${c.idea.slice(0, 45)}…" → tidak terkontaminasi domain lain`,
    !c.forbid.test(names),
    `sub-fitur: ${names.slice(0, 140)}`
  );
}

// ---------------------------------------------------------------------------
section("2. Discovery answers steer the Phase 2 integrations");

const wahaFeatures = buildFallbackStructure(
  "Aplikasi absensi karyawan",
  "Q: Integrasi pihak ketiga? -> A: WAHA WhatsApp API; Q: Lokasi? -> A: Validasi GPS geofencing",
  undefined,
  true
);
const wahaNames = allSubNames(wahaFeatures).join(" | ");
check("jawaban 'WAHA WhatsApp' memunculkan node gateway WhatsApp", /whatsapp/.test(wahaNames), wahaNames);
check("jawaban 'GPS geofencing' memunculkan node peta/lokasi", /peta|lokasi|geofencing/.test(wahaNames), wahaNames);

const plainFeatures = buildFallbackStructure("Aplikasi absensi karyawan", "Q: Target? -> A: Internal tim", undefined, true);
const plainNames = allSubNames(plainFeatures).join(" | ");
check(
  "tanpa integrasi yang disebut user → tidak mengarang WhatsApp/Payment",
  !/whatsapp|payment|qris/.test(plainNames),
  plainNames
);

// ---------------------------------------------------------------------------
section("3. Structure invariants");

const structResult = await generateFeatureStructure(
  "Aplikasi kasir POS toko kelontong",
  "Q: Pembayaran? -> A: QRIS Midtrans",
  "id"
);
const struct = structResult.features;

check("hasil tanpa API key ditandai source='fallback'", structResult.source === "fallback", structResult.source);
check("alasan fallback dilaporkan (tidak diam-diam)", Boolean(structResult.fallbackReason), structResult.fallbackReason);
check("fase terurut menaik", struct.every((f, i) => i === 0 || f.phase >= struct[i - 1].phase));
check("orderIndex berurutan 1..n", struct.every((f, i) => f.orderIndex === i + 1));
check("tidak ada fase kosong", struct.every((f) => (f.subFeatures || []).length > 0));
check(
  "setiap sub-fitur punya featureId induk yang benar",
  struct.every((f) => (f.subFeatures || []).every((sf) => sf.featureId === f.id))
);
check(
  "setiap sub-fitur punya deskripsi memadai",
  struct.every((f) => (f.subFeatures || []).every((sf) => (sf.description || "").length >= 40))
);
const allIds = struct.flatMap((f) => (f.subFeatures || []).map((sf) => sf.id));
check("id sub-fitur unik", new Set(allIds).size === allIds.length);

// ---------------------------------------------------------------------------
section("4. Stable ids across a regeneration (task links survive)");

const regenerated = await generateFeatureStructure(
  "Aplikasi kasir POS toko kelontong",
  "Q: Pembayaran? -> A: QRIS Midtrans",
  "id",
  undefined,
  undefined,
  struct
);
const beforeIds = new Map(struct.flatMap((f) => (f.subFeatures || []).map((sf) => [sf.name, sf.id])));
const afterIds = new Map(regenerated.features.flatMap((f) => (f.subFeatures || []).map((sf) => [sf.name, sf.id])));
let stable = 0;
let unstable = 0;
for (const [name, id] of afterIds) {
  if (beforeIds.has(name)) {
    if (beforeIds.get(name) === id) stable++;
    else unstable++;
  }
}
check(`id sub-fitur bernama sama dipertahankan (${stable} stabil, ${unstable} berubah)`, unstable === 0);

// ---------------------------------------------------------------------------
section("5. Offline revision benar-benar mengubah mind map");

const revAdd = buildFallbackStructure(
  "Aplikasi kasir POS toko kelontong",
  "Q: Pembayaran? -> A: QRIS",
  "Tambahkan modul Laporan Analytics Loyalty Member",
  true
);
check(
  "instruksi 'tambahkan modul X' menambah node baru",
  allSubNames(revAdd).join(" | ").includes("loyalty"),
  allSubNames(revAdd).join(" | ")
);

const baseline = buildFallbackStructure("Aplikasi kasir POS toko kelontong", "Q: Pembayaran? -> A: QRIS", undefined, true);
const revRemove = buildFallbackStructure(
  "Aplikasi kasir POS toko kelontong",
  "Q: Pembayaran? -> A: QRIS",
  "Hapus modul barcode scanner",
  true
);
check(
  "instruksi 'hapus modul X' menghapus node terkait",
  /barcode/.test(allSubNames(baseline).join(" ")) && !/barcode/.test(allSubNames(revRemove).join(" ")),
  allSubNames(revRemove).join(" | ")
);

// ---------------------------------------------------------------------------
section("6. Task agent memahami mind map (jalur deterministik)");

const planId = "proj_verify";
const detTasks = (await generateTaskBreakdown(planId, struct, "id")).tasks;
const subIdSet = new Set(allIds);

check("semua task menunjuk sub-fitur yang benar-benar ada", detTasks.every((t) => subIdSet.has(t.subFeatureId)));
check(
  "phase task selalu sama dengan phase fitur induknya",
  detTasks.every((t) => {
    const owner = struct.find((f) => (f.subFeatures || []).some((sf) => sf.id === t.subFeatureId));
    return owner && owner.phase === t.phase;
  })
);
check(
  "setiap sub-fitur mendapat minimal 1 task frontend & 1 backend",
  allIds.every((sid) => {
    const own = detTasks.filter((t) => t.subFeatureId === sid);
    return own.some((t) => t.layer === "frontend") && own.some((t) => t.layer === "backend");
  })
);
check("ref task unik", new Set(detTasks.map((t) => t.ref)).size === detTasks.length);
check(
  "urutan task mengikuti urutan mind map (phase menaik)",
  detTasks.every((t, i) => i === 0 || t.phase >= detTasks[i - 1].phase)
);
check("orderIndex berurutan", detTasks.every((t, i) => t.orderIndex === i + 1));

// ---------------------------------------------------------------------------
section("7. Task agent memetakan jawaban model (jalur AI)");

const catalog = buildCatalog(struct);
check("katalog memberi ref SF-01..SF-nn", catalog[0].ref === "SF-01" && catalog.length === allIds.length);

const modelTasks = [
  {
    subFeatureRef: "SF-02",
    subFeatureName: catalog[1].name,
    title: "Scanner Barcode Kamera & Hardware USB",
    description: "Membangun modul pemindaian barcode.",
    layer: "frontend",
    priority: "utama"
  },
  {
    // ref salah total → harus jatuh ke pencocokan nama, bukan dibuang / diacak
    subFeatureRef: "SF-99",
    subFeatureName: catalog[0].name,
    title: "Server Transaksi Kasir & Perhitungan Diskon",
    description: "Endpoint transaksi kasir.",
    layer: "backend",
    priority: "utama"
  },
  {
    // tanpa ref & nama → dicocokkan lewat kemiripan teks
    subFeatureRef: "",
    subFeatureName: "",
    title: "Laporan Laba Rugi & Audit Shift Kasir",
    description: "Rekap laba rugi dan audit shift kasir.",
    layer: "backend",
    priority: "rendah"
  }
];

const mapped = mapModelTasksToMindMap(planId, modelTasks, catalog, true);
const t1 = mapped.tasks.find((t) => t.title.startsWith("Scanner Barcode"));
const t2 = mapped.tasks.find((t) => t.title.startsWith("Server Transaksi"));

check("task dengan ref valid tertaut ke sub-fitur yang dirujuk", t1 && t1.subFeatureId === catalog[1].id);
check("ref invalid diselamatkan lewat nama sub-fitur", t2 && t2.subFeatureId === catalog[0].id);
check("task tanpa referensi dihitung sebagai weak match", mapped.weakMatches === 1, String(mapped.weakMatches));
check("semua task hasil AI menunjuk sub-fitur nyata", mapped.tasks.every((t) => subIdSet.has(t.subFeatureId)));
check(
  "phase diambil dari mind map, bukan dari model",
  mapped.tasks.every((t) => {
    const owner = struct.find((f) => (f.subFeatures || []).some((sf) => sf.id === t.subFeatureId));
    return owner && owner.phase === t.phase;
  })
);
check(
  "sub-fitur yang tidak disebut model tetap dapat task (tidak ada node yatim)",
  allIds.every((sid) => mapped.tasks.some((t) => t.subFeatureId === sid))
);
check(
  "task dari model tidak dihapus oleh pengisi celah",
  mapped.tasks.some((t) => t.title === "Scanner Barcode Kamera & Hardware USB")
);
check("ref FE/BE unik pada jalur AI", new Set(mapped.tasks.map((t) => t.ref)).size === mapped.tasks.length);

// ---------------------------------------------------------------------------
console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} lolos, ${failed} gagal\n`);
process.exit(failed === 0 ? 0 : 1);
