#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const program = new Command();
const CONFIG_DIR = path.join(os.homedir(), ".rencanangoding");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function getApiUrl(): string {
  return process.env.RENCANANGODING_SERVER_URL || "http://localhost:7518";
}

function loadConfig(): { token?: string; activePlanId?: string } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveConfig(data: Record<string, any>) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const current = loadConfig();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...data }, null, 2));
}

program
  .name("rencanangoding")
  .description("RencanaNgoding.ai CLI agent runner & task manager")
  .version("0.1.0");

// Command: login
program
  .command("login")
  .description("Login ke server RencanaNgoding.ai dengan token API")
  .requiredOption("-t, --token <token>", "API Access Token")
  .action((options) => {
    saveConfig({ token: options.token });
    console.log(`✅ Token berhasil disimpan di ${CONFIG_FILE}`);
  });

// Command: init
program
  .command("init")
  .description("Pasang skill file instruksi agent ke .claude/skills/, .opencode/skills/, dan .cursor/rules/")
  .action(() => {
    const skillContent = `# RencanaNgoding.ai Skill Instruction for Coding Agents

## 🔴 ATURAN UTAMA LOKASI FOLDER PROYEK:
1. SELALU buat file, folder, komponen, dan kode proyek LANGSUNG di DIREKTORI KERJA SAAT INI (Current Working Directory: \`./\`). JANGAN PERNAH membuat file/folder di direktori temporary/temp (\`$env:TEMP\` atau \`AppData\\Local\\Temp\`)!
2. Jalankan \`npx rencanangoding task next --plan <plan_id> --json\` untuk mengambil task berikutnya.
3. Jika \`checkpoint: true\` dikembalikan, kamu WAJIB BERHENTI dan melapor kepada user! Jangan eksekusi \`task start\` otomatis.
4. Jalankan \`npx rencanangoding task start <ref>\` saat mulai mengerjakan task.
5. Setelah selesai dan terverifikasi, jalankan \`npx rencanangoding task complete <ref>\`.
6. Jika menemui error yang tidak bisa diselesaikan, jalankan \`npx rencanangoding task fail <ref> "<alasan>"\`.
`;

    // 1. Claude Code skill
    const claudeSkillDir = path.join(process.cwd(), ".claude", "skills");
    if (!fs.existsSync(claudeSkillDir)) {
      fs.mkdirSync(claudeSkillDir, { recursive: true });
    }
    fs.writeFileSync(path.join(claudeSkillDir, "rencanangoding.md"), skillContent);

    // 2. OpenCode skill
    const openCodeSkillDir = path.join(process.cwd(), ".opencode", "skills");
    if (!fs.existsSync(openCodeSkillDir)) {
      fs.mkdirSync(openCodeSkillDir, { recursive: true });
    }
    fs.writeFileSync(path.join(openCodeSkillDir, "rencanangoding.md"), skillContent);

    // 3. Cursor rule
    const cursorRulesDir = path.join(process.cwd(), ".cursor", "rules");
    if (!fs.existsSync(cursorRulesDir)) {
      fs.mkdirSync(cursorRulesDir, { recursive: true });
    }
    fs.writeFileSync(path.join(cursorRulesDir, "rencanangoding.mdc"), skillContent);

    console.log("✅ Skill file RencanaNgoding berhasil dipasang di:");
    console.log("   • .claude/skills/rencanangoding.md");
    console.log("   • .opencode/skills/rencanangoding.md");
    console.log("   • .cursor/rules/rencanangoding.mdc");
  });

// Parent commands
const planCmd = program.command("plan").description("Kelola plan RencanaNgoding");
const taskCmd = program.command("task").description("Kelola task RencanaNgoding");

// Command: plan get
planCmd
  .command("get <plan_id>")
  .description("Ambil detail konteks plan dan dokumen PRD")
  .action(async (planId) => {
    saveConfig({ activePlanId: planId });
    try {
      const res = await fetch(`${getApiUrl()}/api/cli/plans/${planId}`);
      if (!res.ok) {
        // Fallback to main plan endpoint
        const res2 = await fetch(`${getApiUrl()}/api/plans/${planId}`);
        const data2 = await res2.json();
        console.log(JSON.stringify(data2, null, 2));
        return;
      }
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error("Gagal terhubung ke server:", err.message);
    }
  });

// Command: task next
taskCmd
  .command("next")
  .description("Ambil task berikutnya sesuai urutan queue dan cek status checkpoint")
  .option("--plan <plan_id>", "ID plan aplikasi")
  .option("--json", "Output format JSON")
  .action(async (options) => {
    const config = loadConfig();
    const planId = options.plan || config.activePlanId;
    if (!planId) {
      console.error("Error: --plan <plan_id> diperlukan atau login/active plan belum di-set");
      process.exit(1);
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/cli/plans/${planId}/task-next`);
      if (!res.ok) {
        console.error(`Error (${res.status}): Gagal mengambil task next dari server.`);
        return;
      }
      const data = await res.json();

      if (options.json) {
        console.log(JSON.stringify(data, null, 2));
      } else {
        if (data.done) {
          console.log(`🎉 ${data.message || "Semua task selesai!"}`);
        } else if (data.task) {
          if (data.checkpoint && data.message) {
            console.log(`\n${data.message}\n`);
          }
          console.log(`Task berikutnya: [${data.task.ref}] ${data.task.title}`);
          console.log(`Layer: ${data.task.layer} | Phase: ${data.task.phase}`);
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      }
    } catch (err: any) {
      console.error("Gagal mengambil task next:", err.message);
    }
  });

// Command: task start
taskCmd
  .command("start <ref>")
  .description("Tandai status task sebagai dikerjakan")
  .option("--plan <plan_id>", "ID plan")
  .action(async (ref, options) => {
    const config = loadConfig();
    const planId = options.plan || config.activePlanId;
    if (!planId) {
      console.error("Error: --plan <plan_id> diperlukan atau login/active plan belum di-set");
      process.exit(1);
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/cli/tasks/${ref}/start?planId=${planId}`, {
        method: "POST"
      });
      if (!res.ok) {
        console.error(`Error (${res.status}): Gagal update task start.`);
        return;
      }
      const data = await res.json();
      console.log(`Task ${ref} status: dikerjakan`);
    } catch (err: any) {
      console.error("Gagal update task start:", err.message);
    }
  });

// Command: task complete
taskCmd
  .command("complete <ref>")
  .description("Tandai status task sebagai selesai")
  .option("--plan <plan_id>", "ID plan")
  .action(async (ref, options) => {
    const config = loadConfig();
    const planId = options.plan || config.activePlanId;
    if (!planId) {
      console.error("Error: --plan <plan_id> diperlukan atau login/active plan belum di-set");
      process.exit(1);
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/cli/tasks/${ref}/complete?planId=${planId}`, {
        method: "POST"
      });
      if (!res.ok) {
        console.error(`Error (${res.status}): Gagal update task complete.`);
        return;
      }
      const data = await res.json();
      console.log(`Task ${ref} status: selesai`);
    } catch (err: any) {
      console.error("Gagal update task complete:", err.message);
    }
  });

// Command: task fail
taskCmd
  .command("fail <ref> [reason]")
  .description("Tandai status task sebagai gagal")
  .option("--plan <plan_id>", "ID plan")
  .action(async (ref, reason, options) => {
    const config = loadConfig();
    const planId = options.plan || config.activePlanId;
    if (!planId) {
      console.error("Error: --plan <plan_id> diperlukan atau login/active plan belum di-set");
      process.exit(1);
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/cli/tasks/${ref}/fail?planId=${planId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Task gagal dieksekusi" })
      });
      if (!res.ok) {
        console.error(`Error (${res.status}): Gagal update task fail.`);
        return;
      }
      const data = await res.json();
      console.log(`Task ${ref} status: gagal`);
    } catch (err: any) {
      console.error("Gagal update task fail:", err.message);
    }
  });

// Command: tunnel
program
  .command("tunnel")
  .description("Aktifkan Auto Tunnel Public HTTPS URL (Konsep 9router)")
  .option("--stop", "Hentikan tunnel yang sedang berjalan")
  .action(async (options) => {
    try {
      const action = options.stop ? "stop" : "start";
      const res = await fetch(`${getApiUrl()}/api/tunnel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        if (data.active && data.url) {
          console.log("\n🌐 Auto Tunnel Public Access Aktif!");
          console.log(`👉 Public URL: ${data.url}`);
          console.log("Buka URL di atas dari HP / internet mana saja untuk mengakses studio secara langsung.\n");
        } else {
          console.log("🔴 Auto Tunnel telah dihentikan.");
        }
      } else {
        console.error("Gagal mengaktifkan tunnel:", data.error);
      }
    } catch (err: any) {
      console.error("Gagal terhubung ke server:", err.message);
    }
  });

program.parse();
