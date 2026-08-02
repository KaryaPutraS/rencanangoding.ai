import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Provider resolution for the self-hosted build.
 *
 * Same engine as the hosted service, with one difference: there is no superadmin
 * handing out managed keys. Everything comes from the user's own Settings dialog
 * (sent per request) or from environment variables on their own machine — so the
 * self-hosted app stays free and uses only the keys its owner supplies.
 */
export interface AiConfig {
  provider?: "openai" | "anthropic" | "deepseek" | "gemini" | "google" | "groq" | "mock";
  apiKey?: string;
  modelName?: string;
}

export type ResolvedProviderId = "openai" | "anthropic" | "deepseek" | "gemini" | "groq" | "mock";

export interface ResolvedModel {
  type: ResolvedProviderId;
  model: any | null;
  /** Model id actually handed to the provider (useful for diagnostics / admin test). */
  modelId?: string;
  /** True when the requested provider had no API key and another one was used instead. */
  switchedFromRequested?: boolean;
}

/** Default model per provider, used when the configured model belongs to a different provider. */
const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  google: "gemini-2.0-flash",
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
  deepseek: "deepseek-chat",
  groq: "llama-3.3-70b-versatile"
};

/** Base URLs are overridable so self-hosted deployments can point at a proxy/mirror. */
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || undefined;

export function getAiModel(config?: AiConfig): ResolvedModel {
  const requestedProvider = config?.provider || process.env.AI_PROVIDER || "deepseek";
  let provider = requestedProvider;

  // Helper to resolve API key for a provider.
  // Always returns a trimmed string ("" when unavailable) so callers can rely on truthiness.
  const getKey = (p: string): string => {
    if (config?.apiKey && requestedProvider === p) return config.apiKey.trim();
    let key: string | undefined;
    if (p === "google" || p === "gemini") key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    else if (p === "openai") key = process.env.OPENAI_API_KEY;
    else if (p === "anthropic") key = process.env.ANTHROPIC_API_KEY;
    else if (p === "deepseek") key = process.env.DEEPSEEK_API_KEY;
    else if (p === "groq") key = process.env.GROQ_API_KEY;
    return (key || "").trim();
  };

  // If the requested provider has no key, switch to the first provider that actually has one.
  if (!getKey(provider)) {
    const availableProviders = ["deepseek", "google", "openai", "anthropic", "groq"];
    const workingProvider = availableProviders.find((p) => getKey(p) !== "");
    if (workingProvider) {
      provider = workingProvider as any;
    }
  }

  const switchedFromRequested = provider !== requestedProvider;

  /**
   * A model name only applies to the provider it was configured for. When we had to fall
   * back to a different provider, its own default is used instead — otherwise a DeepSeek
   * model id would be sent to Gemini and every call would 404.
   */
  const resolveModelName = (p: string): string => {
    if (!switchedFromRequested && config?.modelName) return config.modelName;
    const normalized = p === "gemini" ? "google" : p;
    return PROVIDER_DEFAULT_MODEL[p] || PROVIDER_DEFAULT_MODEL[normalized];
  };

  // DeepSeek AI Provider (OpenAI Compatible — chat completions only, no /responses endpoint)
  if (provider === "deepseek") {
    const apiKey = getKey("deepseek");
    if (apiKey) {
      const deepseek = createOpenAI({ baseURL: DEEPSEEK_BASE_URL, apiKey });
      const modelId = resolveModelName("deepseek");
      return { type: "deepseek", model: deepseek.chat(modelId), modelId, switchedFromRequested };
    }
  }

  // Google Gemini Provider (Native @ai-sdk/google)
  if (provider === "gemini" || provider === "google") {
    const apiKey = getKey("google");
    if (apiKey) {
      const google = createGoogleGenerativeAI({ apiKey });
      const modelId = resolveModelName("google");
      return { type: "gemini", model: google(modelId), modelId, switchedFromRequested };
    }
  }

  // Groq Llama Provider (OpenAI Compatible — chat completions only)
  if (provider === "groq") {
    const apiKey = getKey("groq");
    if (apiKey) {
      const groq = createOpenAI({ baseURL: GROQ_BASE_URL, apiKey });
      const modelId = resolveModelName("groq");
      return { type: "groq", model: groq.chat(modelId), modelId, switchedFromRequested };
    }
  }

  // Anthropic Claude Provider
  if (provider === "anthropic") {
    const apiKey = getKey("anthropic");
    if (apiKey) {
      const anthropic = createAnthropic({ apiKey });
      const modelId = resolveModelName("anthropic");
      return { type: "anthropic", model: anthropic(modelId), modelId, switchedFromRequested };
    }
  }

  // OpenAI ChatGPT Provider
  if (provider === "openai") {
    const apiKey = getKey("openai");
    if (apiKey) {
      const openai = createOpenAI({ apiKey, ...(OPENAI_BASE_URL ? { baseURL: OPENAI_BASE_URL } : {}) });
      const modelId = resolveModelName("openai");
      // .chat() targets /chat/completions, which every OpenAI-compatible gateway supports.
      return { type: "openai", model: openai.chat(modelId), modelId, switchedFromRequested };
    }
  }

  // Mock Engine Fallback
  return { type: "mock", model: null };
}
