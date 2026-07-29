import { z } from "zod";

export const SupportedLanguages = [
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
] as const;

export type SupportedLanguageCode = typeof SupportedLanguages[number]["code"];

export const TechPreferenceEnum = z.enum(["ai_choice", "manual"]);
export type TechPreference = z.infer<typeof TechPreferenceEnum>;

export const PlanStatusEnum = z.enum([
  "draft",
  "discovery_ready",
  "structure_ready",
  "prd_ready",
  "tasks_ready"
]);
export type PlanStatus = z.infer<typeof PlanStatusEnum>;

export const TaskLayerEnum = z.enum(["frontend", "backend"]);
export type TaskLayer = z.infer<typeof TaskLayerEnum>;

export const TaskPriorityEnum = z.enum(["utama", "medium", "rendah"]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const TaskStatusEnum = z.enum([
  "belum_mulai",
  "dikerjakan",
  "selesai",
  "gagal"
]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export interface Plan {
  id: string;
  userId?: string;
  name: string;
  rawIdea: string;
  outputLanguage: SupportedLanguageCode;
  techPreference: TechPreference;
  techStackJson?: any;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryQuestionAnswer {
  id: string;
  planId: string;
  questionIndex: number;
  questionText: string;
  suggestedChips: string[];
  answerText: string;
}

export interface FeatureNode {
  id: string;
  planId: string;
  name: string;
  phase: number;
  status: "direncanakan" | "dikerjakan" | "selesai";
  orderIndex: number;
  subFeatures?: SubFeatureNode[];
}

export interface SubFeatureNode {
  id: string;
  featureId: string;
  name: string;
  description: string;
  orderIndex: number;
  tasks?: TaskItem[];
}

export interface PrdDocument {
  id: string;
  planId: string;
  contentMarkdown: string;
  version: number;
  isPublic: boolean;
  publicSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  subFeatureId: string;
  planId: string;
  ref: string;
  title: string;
  description: string;
  layer: TaskLayer;
  phase: number;
  priority: TaskPriority;
  status: TaskStatus;
  failReason?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  id: string;
  planId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// Schemas for API payloads
export const CreatePlanSchema = z.object({
  rawIdea: z.string().min(5, "Ide terlalu pendek, tuliskan lebih detail (min. 5 karakter)"),
  outputLanguage: z.enum(["id", "en", "es", "ja"]).default("id"),
  techPreference: TechPreferenceEnum.default("ai_choice"),
  manualTechStack: z.array(z.string()).optional()
});
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;

export const SaveDiscoverySchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number(),
      questionText: z.string(),
      answerText: z.string()
    })
  )
});

export const PrdUpdateSchema = z.object({
  contentMarkdown: z.string()
});

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface UserSession {
  user: User;
  token: string;
}

// Auth API Schemas
export const RequestOtpSchema = z.object({
  email: z.string().email("Format email tidak valid (contoh: user@domain.com)")
});

export const VerifyOtpSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  code: z.string().length(6, "Kode OTP harus 6 digit angka")
});

export const CreatePasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  otpCode: z.string().length(6, "Kode OTP harus 6 digit angka"),
  password: z.string().min(6, "Password minimal 6 karakter")
});

export const LoginPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong")
});

export const PrdRevisionChatSchema = z.object({
  message: z.string().min(1, "Pesan tidak boleh kosong")
});

