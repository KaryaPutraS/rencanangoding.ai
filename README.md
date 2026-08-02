# RencanaNgoding.ai

> Ubah ide kasar menjadi spesifikasi teknis presisi untuk AI Agent — secara otomatis & terstruktur.

RencanaNgoding.ai adalah platform perencanaan arsitektur aplikasi yang mengubah deskripsi produk menjadi spesifikasi teknis lengkap melalui pipeline: **Discovery → Struktur Fitur → PRD Studio → Task Breakdown → Kanban Board**.

## 🆓 Gratis Sepenuhnya, Setara Versi Cloud

Versi self-host ini memakai **mesin AI yang sama persis** dengan layanan cloud
[rencanangodingai.site](https://rencanangodingai.site) — prompt, penyusun mind map, pemecah task,
dan alur CLI agent-nya identik, jadi hasilnya juga setara.

Bedanya cuma satu: **tidak ada batasan apa pun di sini.**

| | Cloud | Self-host (repo ini) |
|---|---|---|
| Jumlah PRD | dibatasi kuota | **tanpa batas** |
| Chat revisi AI | dibatasi kuota | **tanpa batas** |
| Instruksi eksekusi CLI | perlu aktivasi | **selalu terbuka** |
| Paket / pembayaran | ada | **tidak ada sama sekali** |
| API key AI | dikelola layanan | **punyamu sendiri** |

Kamu memakai API key milikmu sendiri (DeepSeek, OpenAI, Anthropic, Gemini, atau Groq) yang
diisi lewat menu Settings atau environment variable. Tidak ada kuota, tidak ada penguncian
fitur, tidak ada halaman pembayaran — semua kode paywall memang tidak ada di repo ini.

### Laporan Metadata Projek (bisa dimatikan)

Supaya kami tahu fitur mana yang dipakai, instalasi ini **mengirim metadata projek** ke
dashboard RencanaNgodingAI saat komputermu online. Ini menyala secara default dan bisa
dimatikan kapan saja.

**Yang dikirim** — nama projek, cuplikan singkat ide (maks. 200 karakter), tech stack,
versi aplikasi, dan ID instalasi acak.

**Yang TIDAK pernah dikirim** — isi dokumen PRD, mind map, daftar task, jawaban discovery,
riwayat chat AI, dan API key kamu. Semua itu tidak pernah meninggalkan komputermu.

Cara mematikan:

- Lewat aplikasi: **Settings → Kirim Metadata Projek → matikan sakelarnya**, atau
- Lewat environment (permanen, tidak bisa dinyalakan dari UI):
  ```bash
  RENCANANGODING_TELEMETRY=off
  ```

Kalau sedang offline, laporan hanya ditunda dan dicoba lagi nanti — aplikasi tetap jalan
normal tanpa internet. Endpoint tujuan bisa diarahkan ke server lain lewat
`RENCANANGODING_TELEMETRY_URL`.

---

## ⚡ 1-Line Quick Install (Server / VPS)

Jalankan perintah ini di terminal server kamu (Linux / macOS):

```bash
curl -fsSL https://raw.githubusercontent.com/KaryaPutraS/rencanangoding.ai/main/install.sh | bash
```

> **Atau dengan wget:**
> ```bash
> wget -qO- https://raw.githubusercontent.com/KaryaPutraS/rencanangoding.ai/main/install.sh | bash
> ```

Aplikasi akan otomatis terinstall dan berjalan di port **`7518`** (`http://<IP_SERVER>:7518`).

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Discovery Wizard** | Tanya jawab terarah oleh AI untuk menggali kebutuhan aplikasi secara mendalam |
| **Mind Map Interaktif** | Visualisasi struktur fitur dengan React Flow — fase, sub-fitur, dan task dalam bentuk node |
| **PRD Studio** | Dokumen spesifikasi lengkap dengan Mermaid Diagram (System Architecture & ERD) |
| **Chat Revisi AI** | Revisi PRD secara real-time lewat chat — AI langsung menulis ulang dokumen |
| **Kanban Board** | Task breakdown granular per layer (Frontend/Backend) dengan status tracking |
| **Multi AI Provider** | Dukungan DeepSeek, OpenAI, Anthropic (Claude), Google Gemini, Groq, dan Mock Engine |
| **Auto Tunnel** | Akses dari internet via Cloudflare Tunnel atau Tailscale Mesh — termasuk QR Code untuk mobile |
| **CLI Agent** | Perintah terminal siap-pakai untuk eksekusi task secara otomatis |
| **Multi Bahasa** | Output dokumen dalam Bahasa Indonesia, English, Español, 日本語 |
| **Share PRD** | Bagikan dokumen PRD ke publik dengan link read-only |

---

## Tech Stack

```
Frontend     Next.js 15 + React 19 + Turbopack
Styling      Tailwind CSS 4
Database     SQLite (better-sqlite3) — zero config, portable
AI Engine    Vercel AI SDK + multi-provider
Diagram      Mermaid.js + @xyflow/react
Monorepo     Turborepo + pnpm workspace
Tunnel       Cloudflare Quick Tunnel + Tailscale
CLI          Commander.js (npx rencanangoding)
```

---

## Prasyarat

- **Node.js** >= 18.0.0
- **pnpm** >= 10.x

```bash
# Install pnpm jika belum ada
npm install -g pnpm
```

---

## Instalasi & Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/KaryaPutraS/rencanangoding.ai.git
cd rencanangoding.ai
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Jalankan Development Server

```bash
pnpm dev
```

Buka browser ke **[http://localhost:7518](http://localhost:7518)** — aplikasi langsung siap digunakan.

> Database SQLite akan otomatis terbuat saat pertama kali dijalankan. Tidak perlu setup database terpisah.

---

## Konfigurasi AI Provider

Klik ikon **⚙️ Settings** di Navbar untuk mengatur AI provider.

| Provider | Model | API Key |
|---|---|---|
| **Mock** (default) | Mock AI Engine | Tidak perlu — untuk testing offline |
| **DeepSeek** | `deepseek-chat`, `deepseek-coder`, `deepseek-reasoner` | [platform.deepseek.com](https://platform.deepseek.com) |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `o3-mini` | [platform.openai.com](https://platform.openai.com) |
| **Anthropic** | `claude-3-5-sonnet`, `claude-3-opus` | [console.anthropic.com](https://console.anthropic.com) |
| **Google Gemini** | `gemini-2.5-flash`, `gemini-2.5-pro` | [aistudio.google.com](https://aistudio.google.com) |
| **Groq** | `llama-3.3-70b`, `mixtral-8x7b` | [console.groq.com](https://console.groq.com) |

API key disimpan di **localStorage browser** — tidak pernah dikirim ke server manapun selain provider yang dipilih.

---

## Alur Penggunaan

```
1. Tulis Ide       Deskripsikan aplikasi yang ingin dibuat
       ↓
2. Discovery       AI bertanya untuk menggali detail kebutuhan
       ↓
3. Mind Map        Struktur fitur divisualisasikan per fase
       ↓
4. PRD Studio      Dokumen spesifikasi lengkap + Mermaid Diagram
       ↓
5. Kanban Board    Task breakdown per layer, siap dieksekusi
       ↓
6. Implementasi    Download PRD / JSON Bundle / CLI Prompt
```

---

## Struktur Direktori

```
rencanangoding.ai/
├── apps/
│   ├── web/              # Next.js 15 — UI utama
│   │   ├── app/          # App router (pages & API routes)
│   │   └── components/   # React components
│   └── cli/              # CLI agent (npx rencanangoding)
├── packages/
│   ├── ai/               # Multi-provider AI service
│   ├── db/               # SQLite database layer
│   └── shared/           # Shared types & Zod schemas
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Akses Remote (Tunnel)

Klik ikon **🌐 Globe** di Navbar untuk konfigurasi tunnel.

### Tailscale (Rekomendasi)

1. Install [Tailscale](https://tailscale.com/download) di perangkat
2. Login dan pastikan Tailscale aktif
3. Klik **Enable** di panel Tailscale — otomatis terdeteksi
4. Akses dari perangkat lain di jaringan Tailscale

### Cloudflare Quick Tunnel

1. Klik tombol **Power** di panel Cloudflare Tunnel
2. URL publik otomatis digenerate (format `*.trycloudflare.com`)
3. Scan QR Code dari smartphone untuk akses mobile

---

## Docker

```bash
# Build & jalankan
docker compose up --build

# Atau build manual
docker build -t rencanangoding .
docker run -p 7518:7518 rencanangoding
```

---

## Script yang Tersedia

| Script | Deskripsi |
|---|---|
| `pnpm dev` | Jalankan semua package dalam mode development |
| `pnpm build` | Build production semua package |
| `pnpm lint` | Lint check semua package |
| `pnpm format` | Format kode dengan Prettier |

---

## Catatan Teknis

- **Port default**: `7518` — dikonfigurasi di `apps/web/package.json`
- **Database**: SQLite file tersimpan lokal — portable dan zero-config
- **BYOK (Bring Your Own Key)**: API key disimpan di browser, bukan di server
- **Offline mode**: Gunakan Mock Engine untuk development tanpa API key

---

## Lisensi

MIT © [KaryaPutraS](https://github.com/KaryaPutraS)
