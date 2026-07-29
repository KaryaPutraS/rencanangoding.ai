"use client";

import { useState, useEffect } from "react";

export type AiProvider = "mock" | "deepseek" | "openai" | "anthropic" | "gemini" | "groq";

export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  modelName: string;
}

const SETTINGS_KEY = "rencanangoding_ai_settings";

const DEFAULT_SETTINGS: AiSettings = {
  provider: "mock",
  apiKey: "",
  modelName: ""
};

export function getStoredAiSettings(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveStoredAiSettings(settings: AiSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(getStoredAiSettings());
    setLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<AiSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveStoredAiSettings(updated);
  };

  return { settings, updateSettings, loaded };
}

export function getAiHeaders(): Record<string, string> {
  const s = getStoredAiSettings();
  return {
    "x-ai-provider": s.provider,
    "x-ai-api-key": s.apiKey,
    "x-ai-model-name": s.modelName
  };
}
