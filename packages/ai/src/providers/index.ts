import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export interface AiConfig {
  provider?: "openai" | "anthropic" | "deepseek" | "gemini" | "groq" | "mock";
  apiKey?: string;
  modelName?: string;
}

export function getAiModel(config?: AiConfig) {
  const provider = config?.provider || process.env.AI_PROVIDER || "mock";

  // DeepSeek AI Provider (OpenAI Compatible)
  if (provider === "deepseek") {
    const apiKey = config?.apiKey || process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      const deepseek = createOpenAI({
        baseURL: "https://api.deepseek.com/v1",
        apiKey
      });
      return {
        type: "deepseek" as const,
        model: deepseek(config?.modelName || "deepseek-chat")
      };
    }
  }

  // Google Gemini Provider (OpenAI Compatible)
  if (provider === "gemini") {
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      const gemini = createOpenAI({
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey
      });
      return {
        type: "gemini" as const,
        model: gemini(config?.modelName || "gemini-2.5-flash")
      };
    }
  }

  // Groq Llama Provider (OpenAI Compatible)
  if (provider === "groq") {
    const apiKey = config?.apiKey || process.env.GROQ_API_KEY;
    if (apiKey) {
      const groq = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey
      });
      return {
        type: "groq" as const,
        model: groq(config?.modelName || "llama-3.3-70b-versatile")
      };
    }
  }

  // Anthropic Claude Provider
  if (provider === "anthropic") {
    const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      const anthropic = createAnthropic({ apiKey });
      return {
        type: "anthropic" as const,
        model: anthropic(config?.modelName || "claude-3-5-sonnet-20241022")
      };
    }
  }

  // OpenAI ChatGPT Provider
  if (provider === "openai") {
    const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
    if (apiKey) {
      const openai = createOpenAI({ apiKey });
      return {
        type: "openai" as const,
        model: openai(config?.modelName || "gpt-4o")
      };
    }
  }

  // Mock Engine Fallback
  return {
    type: "mock" as const,
    model: null
  };
}
