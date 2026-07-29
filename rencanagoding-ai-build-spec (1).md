# RencanaGoding.ai — Build Specification & Agent Prompt

> Dokumen ini adalah spesifikasi lengkap untuk membangun **rencanagoding.ai**: platform open-source yang mengubah ide aplikasi menjadi Struktur fitur → PRD → Task breakdown → eksekusi otomatis via CLI + AI coding agent (Claude Code, Cursor, Codex, dll).
>
> Dokumen ini didesain untuk dipakai langsung sebagai prompt awal ke AI coding agent (Claude Code) untuk mulai membangun project dari nol.

---

## 1. Ringkasan Produk

**Nama:** RencanaGoding.ai
**Tagline:** Dari ide jadi rencana yang siap dikerjakan AI agent kamu.

**Alur inti (5 tahap):**
1. **Input Ide** — user tulis ide aplikasi bebas + pilih bahasa output (dropdown bahasa, minimal Indonesia & Inggris di awal, arsitektur i18n-ready untuk nambah bahasa lain)
2. **Preferensi Teknologi** — "Biarkan AI pilih" atau "Pilih sendiri"
3. **Discovery Questions** — 5 pertanyaan adaptif (open text + chip pilihan, boleh skip per pertanyaan) untuk memperdalam konteks; chip jawaban di-generate AI menyesuaikan ide (bukan hardcode statis)
4. **Struktur** — AI generate mind map fitur (Fase 1, dst) + sub-fitur, ditampilkan sebagai diagram interaktif (zoom/pan/expand, expand "Lihat semua" per sub-fitur)
5. **PRD** — AI generate dokumen lengkap (Overview, Requirements, Core Features, User Flow, Architecture, Database Schema + ER Diagram, Tech Stack), dengan:
   - Panel **"Perencanaan"** split-view: dokumen PRD di kiri + mind map di kanan, toggle mode preview (👁) / source markdown (`</>`), tombol refresh, expand, close
   - **Edit markdown manual** langsung di dokumen (icon pensil)
   - **Tombol salin** (copy to clipboard) untuk konten PRD/blok kode
   - Chat AI untuk revisi dengan quick-chip (Prioritas MVP, Fitur kurang, Cek auth flow, Notifikasi) + mention `@` untuk sebut PRD/fitur tertentu
   - **Share publik** (read-only link) via icon share di sebelah judul
6. **Fitur & Task** — breakdown task konkret per sub-fitur, ditambahkan ke mind map sebagai kolom baru + halaman "Semua Task" (list) + kanban board
7. **Implementasi** — 3 opsi lewat tombol "Mulai Implementasi": **Download PRD** (.md), **Download ZIP** (PRD + spesifikasi fitur & task), atau **Prompt AI Agent** (generate prompt CLI siap-pakai untuk Claude Code/Cursor/Codex, dengan token akses tersemat + warning keamanan sebelum di-copy)

**Karakteristik kunci yang membedakan produk ini:**
- Task **tidak** dipilih bebas oleh agent — server yang menentukan urutan (`task next`), agent hanya eksekusi satu per satu
- **Checkpoint otomatis** tiap pergantian fase/layer (frontend→backend, fase 1→2) — agent wajib berhenti & lapor, tunggu konfirmasi user
- Prinsip: frontend dulu di atas data tiruan/stub, backend menyusul
- Status task ter-update otomatis dari CLI ke dashboard (real-time sync)
- Open source, self-hostable, install 1 baris perintah

---

## 2. Tech Stack (Rekomendasi — Scalable & Maintainable)

Prioritas: **mudah di-maintain, mudah ditambah fitur, scalable untuk multi-tenant SaaS, dan tetap ringan untuk self-hosting oleh komunitas open-source.**

### Monorepo
- **Turborepo** + **pnpm workspaces** — pisah `apps/web`, `apps/cli`, `packages/db`, `packages/ai`, `packages/shared` agar setiap bagian bisa berkembang independen tanpa saling tabrak.

### Web App (Dashboard)
- **Next.js 15 (App Router)** + **TypeScript** — SSR/RSC untuk performa, ekosistem besar, mudah cari kontributor open-source
- **Tailwind CSS + shadcn/ui** — sama seperti referensi, konsisten & cepat dikustom
- **React Flow (`@xyflow/react`)** — untuk render mind map interaktif (Struktur/PRD/Task view) — jauh lebih maintainable daripada bikin canvas custom
- **TipTap / MDX editor** — untuk mode edit markdown manual pada PRD
- **Zustand / TanStack Query** — state management ringan + data fetching/cache

### Backend / API
- **Next.js Route Handlers (API routes)** sebagai backend utama — hindari over-engineering microservice di awal; bisa dipecah ke service terpisah nanti kalau perlu scale
- **tRPC** (opsional tapi direkomendasikan) — type-safety end-to-end antara frontend & backend tanpa perlu maintain OpenAPI manual

### Database
- **PostgreSQL** (bukan SQLite seperti referensi) — karena ini SaaS multi-tenant yang perlu scale, concurrent write dari banyak CLI, dan butuh fitur seperti row-level locking untuk task queue
- **Drizzle ORM** — ringan, type-safe, migration jelas, gampang di-maintain kontributor baru
- Hosting DB: **Neon** atau **Supabase Postgres** (serverless, cocok untuk self-host maupun cloud gratis-tier)

### Auth
- **Better Auth** — sama seperti referensi, modern, mendukung API token untuk CLI (bukan cuma session browser) — penting karena CLI login pakai token bukan OAuth browser flow

### AI Layer (Multi-provider, configurable)
- **Vercel AI SDK (`ai` package)** — abstraksi resmi yang mendukung Anthropic, OpenAI, Google, dan provider lain lewat interface sama (`generateObject`, `streamText`, dll)
- Desain `packages/ai` sebagai adapter layer:
  ```
  packages/ai/
    providers/anthropic.ts
    providers/openai.ts
    providers/index.ts   // pilih provider dari config/env
    prompts/structure.ts // prompt generate Struktur
    prompts/prd.ts       // prompt generate PRD
    prompts/tasks.ts     // prompt generate Task breakdown
  ```
- API key provider disimpan per-user (BYOK — Bring Your Own Key) ATAU default project key — buat dua mode via env `AI_PROVIDER=anthropic|openai` dan user bisa override di settings

### CLI (`ngodingpakeai` versi kamu, misal `rencanagoding`)
- **Node.js + TypeScript**, dibangun pakai **oclif** atau **commander.js** (commander lebih ringan, cukup untuk scope ini)
- Publish ke **npm registry** agar bisa dijalankan `npx rencanagoding <command>` tanpa install manual
- Simpan token login di `~/.rencanagoding/config.json` (bukan browser session)
- Command: `login --token`, `init` (pasang skill file ke agent — file instruksi markdown yang di-load Claude Code/Cursor), `plan get <id>`, `task next --plan <id> --json`, `task start <ref>`, `task complete <ref>`, `task fail <ref> "<reason>"`

### Realtime Sync (Dashboard ⟷ CLI)
- **Postgres LISTEN/NOTIFY** atau **Supabase Realtime** — supaya saat CLI update status task, dashboard (kanban board) langsung refresh tanpa polling manual. Alternatif ringan: polling interval 3-5 detik kalau mau hindari kompleksitas realtime di awal.

### Deployment
- **Vercel** untuk web app (gratis tier cukup untuk MVP, auto-scale)
- **Docker Compose** sebagai opsi self-host (web + Postgres + CLI build) — ini yang memungkinkan **install 1 baris perintah**:
  ```bash
  curl -fsSL https://rencanagoding.ai/install.sh | bash
  ```
  Script ini men-download `docker-compose.yml` + `.env.example`, lalu `docker compose up -d`.

### Observability & Testing
- **Vitest** untuk unit test, **Playwright** untuk e2e flow (ide→PRD→task)
- **Sentry** (opsional) untuk error tracking di production

---

## 3. Data Model (Skema Utama)

```
users
  id, email, password_hash, name, created_at

api_tokens          -- untuk login CLI
  id, user_id (FK), token_hash, created_at, last_used_at, revoked_at

plans               -- satu "project/ide" = satu plan
  id, user_id (FK), name, raw_idea (text), tech_preference (enum: ai_choice | manual),
  tech_stack_json, status (enum: draft | structure_ready | prd_ready | tasks_ready),
  created_at, updated_at

discovery_answers
  id, plan_id (FK), question_index, question_text, answer_text

features            -- node "Fase 1" dst di mind map
  id, plan_id (FK), name, phase (int), status (enum: direncanakan|dikerjakan|selesai),
  order_index

sub_features
  id, feature_id (FK), name, description, order_index

prd_documents
  id, plan_id (FK), content_markdown, version (int), is_public (bool), public_slug,
  created_at, updated_at

tasks
  id, sub_feature_id (FK), plan_id (FK, denormalized untuk query cepat),
  ref (string, unik per plan, dipakai CLI), title, description,
  layer (enum: frontend | backend), phase (int),
  priority (enum: utama | medium | rendah),
  status (enum: belum_mulai | dikerjakan | selesai | gagal),
  fail_reason (text, nullable),
  order_index, created_at, updated_at

ai_chat_messages     -- histori chat revisi PRD/fitur
  id, plan_id (FK), role (enum: user|assistant), content, created_at
```

**Catatan desain:**
- `tasks.ref` harus unik & stabil per plan (dipakai CLI di command `task start <ref>`) — gunakan slug pendek, bukan UUID panjang, biar gampang dipanggil dari terminal.
- `phase` & `layer` di tabel `tasks` adalah dasar dari logika **checkpoint** — endpoint `task next` harus membandingkan task yang baru saja `complete` dengan kandidat task berikutnya.

---

## 4. Endpoint API Utama (dipakai Web App & CLI)

```
POST   /api/auth/token                 -- generate token API baru (dari dashboard, ditampilkan sekali)
POST   /api/cli/login                  -- validasi token, dipakai CLI
POST   /api/cli/init                   -- return isi "skill file" markdown untuk agent

POST   /api/plans                      -- buat plan baru dari ide
GET    /api/plans/:id                  -- detail plan
POST   /api/plans/:id/tech-preference  -- simpan pilihan AI/manual
POST   /api/plans/:id/discovery        -- simpan jawaban 5 pertanyaan

POST   /api/plans/:id/generate-structure  -- trigger AI generate mind map fitur
POST   /api/plans/:id/generate-prd        -- trigger AI generate PRD dari struktur
PATCH  /api/plans/:id/prd                 -- edit manual (markdown) / revisi via chat
POST   /api/plans/:id/prd/share           -- toggle public + generate slug

POST   /api/plans/:id/generate-tasks   -- breakdown task dari tiap sub-fitur

GET    /api/plans/:id/tasks            -- list semua task (untuk halaman "Semua Task" & kanban board)
GET    /api/plans/:id/export/zip       -- generate & download ZIP (PRD + spesifikasi fitur & task)
GET    /api/public/prd/:slug           -- halaman PRD publik read-only (dari share)
GET    /api/cli/plans/:id              -- "plan get" versi CLI (return PRD lengkap sbg konteks)
GET    /api/cli/plans/:id/task-next    -- logika pemilihan task berikutnya + checkpoint flag
POST   /api/cli/tasks/:ref/start
POST   /api/cli/tasks/:ref/complete
POST   /api/cli/tasks/:ref/fail
```

---

## 5. Spesifikasi CLI (`npx rencanagoding`)

```bash
# Sekali saja, saat mulai
rencanagoding login --token <token>     # simpan token di ~/.rencanagoding/config.json
rencanagoding init                       # tulis skill file ke .claude/skills/ atau .cursor/rules/

# Ambil konteks project (sekali per sesi)
rencanagoding plan get <plan_id>

# Loop kerja
rencanagoding task next --plan <plan_id> --json
  # → { done, task: { ref, title, layer, phase }, checkpoint: boolean, message? }
rencanagoding task start <ref>
rencanagoding task complete <ref>
rencanagoding task fail <ref> "<alasan>"
```

**Logika `task next` (di server, bukan CLI):**
1. Ambil task dengan status `belum_mulai`, urutkan by `phase ASC, layer (frontend dulu), order_index ASC`
2. Bandingkan `phase`/`layer` kandidat dengan task terakhir yang `selesai` di plan tsb
3. Kalau beda → set `checkpoint: true` + pesan human-readable ("✅ Frontend fase 1 selesai — coba klik-klik dulu di browser")
4. CLI/agent yang menerima `checkpoint: true` **wajib berhenti**, tidak boleh lanjut `task start` otomatis

---

## 6. Rencana Bertahap (Phased Delivery)

**Fase 1 — Core Flow (MVP)**
- Auth (register/login web)
- Landing input ide dengan pilihan bahasa output (dropdown, i18n-ready)
- Input ide → generate Struktur (AI) → tampil sebagai React Flow diagram
- Generate PRD dari struktur, tampil di panel "Perencanaan" split-view (dokumen kiri + mind map kanan), dengan toggle preview/source markdown, edit manual, dan tombol salin
- Simpan riwayat plan per user (sidebar menu)

**Fase 2 — Task & Kanban**
- Generate Fitur & Task breakdown
- Kanban board (Belum mulai / Dikerjakan / Selesai / Gagal)
- Chat revisi PRD (quick chip: Prioritas MVP, Fitur kurang, Cek auth flow, dll)

**Fase 3 — CLI & Agent Integration**
- API token generation
- Publish CLI package ke npm
- Endpoint `task next` dengan logika checkpoint
- Modal "Mulai Implementasi" dengan 3 opsi (Download PRD, Download ZIP, Prompt AI Agent)
- Realtime sync status task dari CLI ke dashboard

**Fase 4 — Open Source & Self-host**
- Docker Compose setup
- `install.sh` untuk instalasi 1 baris perintah
- Dokumentasi kontribusi (CONTRIBUTING.md) + lisensi (MIT/Apache 2.0)
- Multi-provider AI config (Anthropic/OpenAI, BYOK)

**Fase 5 — Polish**
- Share PRD publik (read-only slug)
- Roadmap view
- Export ZIP lengkap

---

## 7. Prompt untuk AI Coding Agent (Siap Pakai)

Salin bagian di bawah ini untuk memulai implementasi dengan Claude Code/agent lain:

```
Kamu akan membangun "RencanaGoding.ai" — platform open-source yang mengubah ide
aplikasi jadi Struktur fitur → PRD → Task breakdown → eksekusi otomatis via CLI +
AI coding agent. Spesifikasi lengkap ada di dokumen build-spec ini (rujuk bagian
2-6 untuk tech stack, data model, endpoint, CLI, dan urutan fase).

Mulai dari Fase 1 (Core Flow MVP):
1. Setup monorepo: Turborepo + pnpm workspaces, apps/web (Next.js 15 App Router
   + TypeScript + Tailwind + shadcn/ui), packages/db (Drizzle + Postgres),
   packages/ai (adapter Anthropic/OpenAI via Vercel AI SDK).
2. Setup auth pakai Better Auth (email/password dulu, cukup untuk MVP).
3. Buat skema database sesuai bagian 3 (mulai dari: users, plans,
   discovery_answers, features, sub_features, prd_documents).
4. Bangun halaman: landing "Mau bikin apa?" (textarea ide + pilih bahasa) →
   preferensi teknologi (AI pilih / manual) → 5 pertanyaan discovery (open text
   + chip, boleh skip) → halaman Struktur (React Flow, node fitur+sub-fitur) →
   halaman PRD (dokumen + edit manual + chat revisi).
5. Kerjakan HANYA satu halaman/komponen per task, ikuti pola kode yang sudah
   ada, jangan sentuh Fase 2+ dulu.

Setelah Fase 1 selesai dan saya verifikasi, kita lanjut ke Fase 2 (Task &
Kanban), lalu Fase 3 (CLI & Agent Integration).
```

---

*Dokumen ini bisa direvisi sesuai kebutuhan — beri tahu kalau ada bagian yang mau diperdalam (misal skema database lebih detail, contoh prompt AI untuk generate PRD, atau struktur folder monorepo lengkap).*
