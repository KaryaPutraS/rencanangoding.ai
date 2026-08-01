#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_DIR = path.join(os.homedir(), ".rencanangoding");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function getApiUrl() {
  return process.env.RENCANANGODING_SERVER_URL || "https://rencanangodingai.site";
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveConfig(data) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const current = loadConfig();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...data }, null, 2));
}

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command || command === "--help" || command === "-h") {
    console.log(`
🚀 RencanaNgodingAI CLI Agent Runner

Penggunaan:
  npx github:KaryaPutraS/rencanangoding.ai#main <perintah> [opsi]

Perintah:
  login --token <token>   Simpan token autentikasi API
  init                    Pasang skill file instruksi agent ke proyek (.claude, .opencode, .cursor)
  plan get <plan_id>      Ambil detail dokumen PRD dan spesifikasi proyek
  task next --plan <id>   Ambil 1 task berikutnya & cek status checkpoint
  task start <ref>        Tandai task sedang dikerjakan
  task complete <ref>     Tandai task selesai dikerjakan
  task fail <ref> [reason] Tandai task gagal dikerjakan
`);
    return;
  }

  const config = loadConfig();
  const authHeaders = config.token ? { Authorization: `Bearer ${config.token}` } : {};

  if (command === "login") {
    const tokenIdx = args.indexOf("--token") !== -1 ? args.indexOf("--token") : args.indexOf("-t");
    const token = tokenIdx !== -1 ? args[tokenIdx + 1] : args[1];
    if (!token) {
      console.error("❌ Error: Token diperlukan. Gunakan: login --token <token>");
      process.exit(1);
    }
    saveConfig({ token });
    console.log(`✅ Token berhasil disimpan di ${CONFIG_FILE}`);
    return;
  }

  if (command === "init") {
    const skillContent = `# RencanaNgodingAI Skill Instruction for Coding Agents

## 🔴 ATURAN UTAMA LOKASI FOLDER PROYEK:
1. SELALU buat file, folder, komponen, dan kode proyek LANGSUNG di DIREKTORI KERJA SAAT INI (Current Working Directory: \`./\`). JANGAN PERNAH membuat file/folder di direktori temporary/temp (\`$env:TEMP\` atau \`AppData\\Local\\Temp\`)!
2. Jalankan \`npx github:KaryaPutraS/rencanangoding.ai#main task next --plan <plan_id> --json\` untuk mengambil task berikutnya.
3. Jika \`checkpoint: true\` dikembalikan, kamu WAJIB BERHENTI dan melapor kepada user! Jangan eksekusi \`task start\` otomatis.
4. Jalankan \`npx github:KaryaPutraS/rencanangoding.ai#main task start <ref>\` saat mulai mengerjakan task.
5. Setelah selesai dan terverifikasi, jalankan \`npx github:KaryaPutraS/rencanangoding.ai#main task complete <ref>\`.
6. Jika menemui error yang tidak bisa diselesaikan, jalankan \`npx github:KaryaPutraS/rencanangoding.ai#main task fail <ref> "<alasan>"\`.
`;

    // 1. Claude Code skill
    const claudeSkillDir = path.join(process.cwd(), ".claude", "skills");
    if (!fs.existsSync(claudeSkillDir)) fs.mkdirSync(claudeSkillDir, { recursive: true });
    fs.writeFileSync(path.join(claudeSkillDir, "rencanangodingai.md"), skillContent);

    // 2. OpenCode skill
    const openCodeSkillDir = path.join(process.cwd(), ".opencode", "skills");
    if (!fs.existsSync(openCodeSkillDir)) fs.mkdirSync(openCodeSkillDir, { recursive: true });
    fs.writeFileSync(path.join(openCodeSkillDir, "rencanangodingai.md"), skillContent);

    // 3. Cursor rule
    const cursorRulesDir = path.join(process.cwd(), ".cursor", "rules");
    if (!fs.existsSync(cursorRulesDir)) fs.mkdirSync(cursorRulesDir, { recursive: true });
    fs.writeFileSync(path.join(cursorRulesDir, "rencanangodingai.mdc"), skillContent);

    console.log("✅ Skill file RencanaNgodingAI berhasil dipasang di:");
    console.log("   • .claude/skills/rencanangodingai.md");
    console.log("   • .opencode/skills/rencanangodingai.md");
    console.log("   • .cursor/rules/rencanangodingai.mdc");
    return;
  }

  if (command === "plan") {
    const subCmd = args[1];
    const planId = args[2];
    if (subCmd === "get" && planId) {
      saveConfig({ activePlanId: planId });
      try {
        const res = await fetch(`${getApiUrl()}/api/plans/${planId}`, { headers: authHeaders });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          console.error(`❌ Error (${res.status}): ${data.error || "Gagal mengambil detail plan"}`);
          process.exit(1);
        }
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error("Gagal terhubung ke server:", err.message);
      }
      return;
    }
  }

  if (command === "task") {
    const subCmd = args[1];

    let planFlagIdx = args.indexOf("--plan");
    let planId = planFlagIdx !== -1 ? args[planFlagIdx + 1] : config.activePlanId;

    if (subCmd === "next") {
      if (!planId) {
        console.error("Error: --plan <plan_id> diperlukan atau login/active plan belum di-set");
        process.exit(1);
      }
      try {
        const res = await fetch(`${getApiUrl()}/api/plans/${planId}`, { headers: authHeaders });
        const data = await res.json();

        if (!res.ok || data.success === false) {
          console.error(`❌ Error (${res.status}): ${data.error || "Akses ditolak"}`);
          process.exit(1);
        }

        const tasks = data.tasks || [];
        if (tasks.length === 0) {
          console.log(args.includes("--json") ? JSON.stringify({ done: true, message: "Belum ada task yang digenerate untuk plan ini." }, null, 2) : "Belum ada task yang digenerate untuk plan ini.");
          return;
        }

        const pendingTask = tasks.find((t) => t.status !== "selesai");

        if (!pendingTask) {
          const isJson = args.includes("--json");
          const out = { done: true, message: "🎉 Semua task telah selesai dikerjakan!" };
          console.log(isJson ? JSON.stringify(out, null, 2) : out.message);
          return;
        }

        const out = {
          done: false,
          task: pendingTask,
          progress: {
            current: tasks.filter((t) => t.status === "selesai").length + 1,
            total: tasks.length,
            layer: pendingTask.layer,
            phase: pendingTask.phase || 1
          }
        };

        if (args.includes("--json")) {
          console.log(JSON.stringify(out, null, 2));
        } else {
          console.log(`Task berikutnya: [${pendingTask.ref}] ${pendingTask.title}`);
          console.log(`Layer: ${pendingTask.layer} | Status: ${pendingTask.status}`);
        }
      } catch (err) {
        console.error("Gagal mengambil task next:", err.message);
      }
      return;
    }

    if (subCmd === "start") {
      const ref = args[2];
      try {
        const res = await fetch(`${getApiUrl()}/api/plans/${planId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ ref, status: "dikerjakan" })
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          console.error(`❌ Error (${res.status}): ${data.error || "Gagal update status task"}`);
          process.exit(1);
        }
        console.log(`✅ Task ${ref} status: dikerjakan`);
      } catch (err) {
        console.error("Gagal update task start:", err.message);
      }
      return;
    }

    if (subCmd === "complete") {
      const ref = args[2];
      try {
        const res = await fetch(`${getApiUrl()}/api/plans/${planId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ ref, status: "selesai" })
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          console.error(`❌ Error (${res.status}): ${data.error || "Gagal update status task"}`);
          process.exit(1);
        }
        console.log(`✅ Task ${ref} status: selesai`);
      } catch (err) {
        console.error("Gagal update task complete:", err.message);
      }
      return;
    }

    if (subCmd === "fail") {
      const ref = args[2];
      const reason = args[3] || "Gagal dieksekusi";
      try {
        const res = await fetch(`${getApiUrl()}/api/plans/${planId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ ref, status: "gagal", failReason: reason })
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          console.error(`❌ Error (${res.status}): ${data.error || "Gagal update status task"}`);
          process.exit(1);
        }
        console.log(`✅ Task ${ref} status: gagal (${reason})`);
      } catch (err) {
        console.error("Gagal update task fail:", err.message);
      }
      return;
    }
  }

  console.log(`Perintah tidak dikenal: ${command}. Jalankan dengan --help untuk bantuan.`);
}

main().catch((err) => {
  console.error("Error CLI:", err.message);
  process.exit(1);
});
