import { generateText } from "ai";
import { FeatureNode } from "@rencanangoding/shared";
import { getAiModel, AiConfig } from "../providers";

export async function generatePrdMarkdown(
  idea: string,
  techPreference: string,
  features: FeatureNode[],
  answersSummary: string,
  language: string = "id",
  config?: AiConfig
): Promise<string> {
  const modelInfo = getAiModel(config);
  const isIndo = language === "id";

  const featureSummaryStr = features
    .map(
      (f) =>
        `### ${f.name} (Phase ${f.phase})\n` +
        (f.subFeatures || []).map((sf) => `- **${sf.name}**: ${sf.description}`).join("\n")
    )
    .join("\n\n");

  if (modelInfo.type !== "mock" && modelInfo.model) {
    try {
      const result = await generateText({
        model: modelInfo.model,
        prompt: `Anda adalah Principal Technical Product Manager & Lead System Architect.
Tugas Anda adalah membuat dokumen Product Requirement Document (PRD) yang komprehensif, sangat rapi, dan siap dieksekusi langsung oleh AI Coding Agent (seperti Claude Code, Cursor, Codex).

Konteks Aplikasi:
- Ide Utama: "${idea}"
- Preferensi Teknologi: ${techPreference}
- Hasil Discovery Context: "${answersSummary}"
- Struktur Fitur:
${featureSummaryStr}

Bahasa Dokumen: ${isIndo ? "Bahasa Indonesia" : "English"}

STRUKTUR PRD YANG WAJIB ADA (Gunakan Markdown standar profesional dengan Mermaid Diagrams):
# [Judul Aplikasi] — Product Requirement Document (PRD)

> Dokumen spesifikasi teknis & arsitektur ini dibuat secara otomatis untuk agentic execution.

---

## 1. Overview & Vision
- Problem Statement
- Proposed Solution
- Target Audience & User Personas

---

## 2. System Requirements
- Functional Requirements (FR-01, FR-02, FR-03, dst)
- Non-Functional Requirements (Performance, Security, Scalability)

---

## 3. Core Features Breakdown
Detailkan tiap fase & sub-fitur dengan spesifikasi perilaku (behavioral specs).

---

## 4. User Flow Diagram
Gunakan Mermaid Diagram (\`\`\`mermaid graph TD ... \`\`\`) untuk memetakan alur pengguna dari entry point hingga goal.

---

## 5. System Architecture & Component Diagram
- Deskripsi komponen Frontend, Backend API, Service Layer, dan External Integrations.
- Gunakan Mermaid Diagram (\`\`\`mermaid graph TB ... \`\`\`) untuk memvisualisasikan arsitektur sistem.

---

## 6. Database Schema & Entity Relationship Diagram (ERD)
- Penjelasan entitas & tabel utama.
- Gunakan Mermaid ERD (\`\`\`mermaid erDiagram ... \`\`\`) yang mendetail dengan atribut field dan relasi antar tabel.

---

## 7. Tech Stack & Dependencies
- Core Runtimes & Frameworks
- Database & ORM
- External APIs, Libraries, & Services`
      });
      return result.text;
    } catch (err) {
      console.warn("AI generation fallback to mock for PRD:", err);
    }
  }

  // Mock PRD Generator with rich diagrams
  const title = idea.split("\n")[0].slice(0, 45) || "Aplikasi Impian";

  return `# ${title} — Product Requirement Document (PRD)

> Dokumen spesifikasi teknis, arsitektur sistem, dan skema database ini disusun secara otomatis oleh **RencanaNgoding.ai** untuk siap dieksekusi secara presisi oleh AI Coding Agent (Claude Code / Cursor / Codex).

---

## 1. Ringkasan Produk (Overview & Vision)

### 1.1 Masalah (Problem Statement)
Pengembang dan tim produk sering mengabaikan perancangan teknis terstruktur sebelum mulai menulis kode. Akibatnya, AI coding agent menghasilkan arsitektur yang acak-acakan, tabel database yang tidak konsisten, dan fitur yang tumpang tindih.

### 1.2 Solusi (Proposed Solution)
Aplikasi ini memetakan ide secara otomatis menjadi **Mind Map Fitur**, **Spesifikasi PRD Komprehensif dengan Diagram Arsitektur & ERD Database**, serta **Task Breakdown Granular** yang dapat dijalankan secara mandiri melalui CLI runner.

### 1.3 Target Pengguna
- Independent Developers & Solo Founders
- Technical Product Managers & Lead Engineers
- Tim Software Engineering yang mengadopsi AI Pair Programming (Claude Code / Cursor / Codex)

---

## 2. Kebutuhan Sistem (System Requirements)

### 2.1 Kebutuhan Fungsional (Functional Requirements)
- **FR-01**: Input ide bebas dengan dukungan NLP dan dropdown opsi bahasa output.
- **FR-02**: Kuisioner discovery adaptif 5 pertanyaan untuk menangkap batasan teknis & preferensi stack.
- **FR-03**: Diagram Mind Map interaktif dengan status node, kurva bezier melengkung, dan expandable sub-fitur.
- **FR-04**: PRD Studio split-view dengan rendering diagram arsitektur Mermaid, ERD database, dan revisi AI chat real-time.
- **FR-05**: Task runner CLI agent dengan auto-checkpointing dan pencatatan riwayat eksekusi.

### 2.2 Kebutuhan Non-Fungsional (Non-Functional Requirements)
- **NFR-01 (Performa)**: Rendering diagram & dokumen memuat dalam waktu kurang dari 1.2 detik.
- **NFR-02 (Keamanan)**: Token otentikasi CLI terenkripsi dan dapat dicabut (*revokable*) secara instan.
- **NFR-03 (Skalabilitas)**: Database terstruktur dengan row-level concurrency safety untuk eksekusi task paralel.

---

## 3. Breakdown Fitur Utama (Core Features)

${featureSummaryStr}

---

## 4. Diagram Alur Pengguna (User Flow Diagram)

\`\`\`mermaid
graph TD
    A[Landing Page: Input Ide Aplikasi] --> B[Discovery Questions Wizard]
    B --> C[Generate Mind Map Fitur & Sub-fitur]
    C --> D[Generate Dokumen PRD + Diagram Arsitektur & ERD]
    D --> E[Refine PRD via AI Chat Revisi / Edit Manual]
    E --> F[Generate Task Breakdown & Kanban Board]
    F --> G[Mulai Eksekusi CLI Runner / Prompt Agent]
\`\`\`

---

## 5. Arsitektur Sistem (System Architecture)

Sistem dirancang menggunakan arsitektur monorepo terpisah antara presentation layer, API layer, shared domain schema, dan CLI client runner.

\`\`\`mermaid
graph TB
    subgraph Client_Layer ["Client Presentation Layer"]
        WebStudio["Next.js Web Studio Studio (React 19 + React Flow)"]
        CLIApp["Node.js CLI Runner (Commander + Task Executor)"]
    end

    subgraph API_Layer ["API & Domain Business Logic"]
        NextAPI["Next.js Route Handlers / REST Endpoints"]
        AIService["Multi-Provider AI Engine (Anthropic / OpenAI / Mock)"]
    end

    subgraph Data_Layer ["Data & Persistence Layer"]
        DBStore["Persistent Store / Drizzle ORM"]
        LocalDisk["Disk Checkpoint Store (~/.rencanangoding)"]
    end

    WebStudio -->|HTTP REST / JSON| NextAPI
    CLIApp -->|API Token Auth & Task Fetch| NextAPI
    NextAPI --> AIService
    NextAPI --> DBStore
    CLIApp --> LocalDisk
\`\`\`

---

## 6. Skema Database & Entity Relationship Diagram (ERD)

Desain basis data terdiri dari entitas utama pengelola rencana, fitur, sub-fitur granular, dokumen PRD, dan antrean tugas (*task execution queue*).

\`\`\`mermaid
erDiagram
    PLANS {
        string id PK
        string userId
        string name
        string rawIdea
        string outputLanguage
        string techPreference
        string status
        datetime createdAt
        datetime updatedAt
    }

    DISCOVERY_ANSWERS {
        string id PK
        string planId FK
        int questionIndex
        string questionText
        string answerText
    }

    FEATURES {
        string id PK
        string planId FK
        string name
        int phase
        string status
        int orderIndex
    }

    SUB_FEATURES {
        string id PK
        string featureId FK
        string name
        string description
        int orderIndex
    }

    TASKS {
        string id PK
        string planId FK
        string subFeatureId FK
        string ref
        string title
        string layer
        string status
        string failReason
    }

    PRD_DOCUMENTS {
        string id PK
        string planId FK
        string contentMarkdown
        int version
        boolean isPublic
        string publicSlug
    }

    PLANS ||--o{ DISCOVERY_ANSWERS : "contains"
    PLANS ||--o{ FEATURES : "structures"
    FEATURES ||--o{ SUB_FEATURES : "breaks down"
    SUB_FEATURES ||--o{ TASKS : "generates"
    PLANS ||--o{ PRD_DOCUMENTS : "produces"
\`\`\`

---

## 7. Preferensi Teknologi & Dependencies

- **Core Framework**: Next.js 15 (React 19, TypeScript)
- **UI Components & Styling**: Tailwind CSS, Lucide Icons, Glassmorphism design
- **Mind Map Engine**: \`@xyflow/react\` (React Flow 12)
- **Diagram Rendering**: Mermaid.js
- **Persistence & ORM**: Drizzle ORM + Persistent JSON Store fallback
- **AI Integration**: Vercel AI SDK (\`ai\` package) dengan Anthropic & OpenAI adapters
`;
}
