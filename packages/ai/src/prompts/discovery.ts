import { generateObject } from "ai";
import { z } from "zod";
import { getAiModel, AiConfig } from "../providers";

export const AdaptiveQuestionSchema = z.object({
  questionIndex: z.number(),
  questionText: z.string(),
  suggestedChips: z.array(z.string()).min(2).max(5)
});

export const DiscoveryResponseSchema = z.object({
  questions: z.array(AdaptiveQuestionSchema).length(5)
});

export type DiscoveryResponse = z.infer<typeof DiscoveryResponseSchema>;

export async function generateDiscoveryQuestions(
  idea: string,
  language: string = "id",
  config?: AiConfig
): Promise<DiscoveryResponse> {
  const modelInfo = getAiModel(config);

  if (modelInfo.type !== "mock" && modelInfo.model) {
    try {
      const result = await generateObject({
        model: modelInfo.model,
        schema: DiscoveryResponseSchema,
        prompt: `Anda adalah Product Strategist AI senior.
User ingin membuat aplikasi dengan ide: "${idea}"
Bahasa output: ${language === "id" ? "Bahasa Indonesia" : "English"}.

Buatkan 5 pertanyaan adaptif mendalam untuk memperjelas kebutuhan aplikasi ini (target user, model bisnis/auth, integrasi 3rd party, prioritas utama MVP, & skalabilitas).
Setiap pertanyaan WAJIB disertai 3-4 chip pilihan jawaban cepat yang kontekstual dan relevan dengan ide tersebut (BUKAN pilihan generik).`
      });
      return result.object;
    } catch (err) {
      console.warn("AI generation fallback to mock for discovery questions:", err);
    }
  }

  // Fallback / Mock generator
  const isIndo = language === "id";
  return {
    questions: [
      {
        questionIndex: 1,
        questionText: isIndo
          ? `Siapa target pengguna utama aplikasi "${idea.slice(0, 30)}..."?`
          : `Who is the primary target audience for "${idea.slice(0, 30)}..."?`,
        suggestedChips: isIndo
          ? ["B2C (Pengguna Umum/Masyarakat)", "B2B (UMKM & Perusahaan)", "Internal Tim / Operational", "Developer & Freelancer"]
          : ["B2C (General Consumers)", "B2B (SMEs & Enterprises)", "Internal Teams", "Developers & Freelancers"]
      },
      {
        questionIndex: 2,
        questionText: isIndo
          ? "Metode autentikasi & keamanan pengguna apa yang kamu butuhkan?"
          : "What user authentication & security method do you require?",
        suggestedChips: isIndo
          ? ["Email & Password + Magic Link", "Social Auth (Google/GitHub/Apple)", "OTP Whatsapp / Phone", "Multi-tenant API Token (CLI / SDK)"]
          : ["Email & Password + Magic Link", "Social Auth (Google/GitHub/Apple)", "WhatsApp OTP", "Multi-tenant API Token"]
      },
      {
        questionIndex: 3,
        questionText: isIndo
          ? "Integrasi pihak ketiga atau API eksternal apa yang paling krusial?"
          : "What key third-party integrations or external APIs are required?",
        suggestedChips: isIndo
          ? ["Payment Gateway (Midtrans/Xendit/Stripe)", "LLM / AI Model (OpenAI/Anthropic)", "Cloud Storage (S3/Uploadthing)", "Layanan WhatsApp / Email Auto-responder"]
          : ["Payment Gateway (Stripe/Midtrans)", "LLM / AI Models (OpenAI/Anthropic)", "Cloud Storage (AWS S3/Uploadthing)", "Email / Notification Service"]
      },
      {
        questionIndex: 4,
        questionText: isIndo
          ? "Bagaimana preferensi antarmuka pengguna (UI) & platform utamanya?"
          : "What is your preference for UI & main platform target?",
        suggestedChips: isIndo
          ? ["Web App Responsive (Desktop & Mobile)", "Mobile Native App (iOS & Android)", "CLI / Terminal Tool", "Chrome Extension / Desktop App"]
          : ["Responsive Web App (Desktop & Mobile)", "Mobile Native App", "CLI / Terminal Tool", "Desktop / Extension App"]
      },
      {
        questionIndex: 5,
        questionText: isIndo
          ? "Fokus utama untuk rilisan Fase 1 (MVP) ini apa?"
          : "What is the primary milestone focus for Phase 1 (MVP)?",
        suggestedChips: isIndo
          ? ["Alur Utama & Core Feature Berjalan Dulu", "Performa & UI/UX Super Polish", "Integrasi Pembayaran & Auth Komplit", "Skalabilitas & Multi-tenant Ready"]
          : ["Core Functional Workflow First", "High UI/UX Polish", "Full Auth & Payment Integration", "Multi-tenant Readiness"]
      }
    ]
  };
}
