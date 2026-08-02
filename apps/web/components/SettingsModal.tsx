"use client";

import { useState, useEffect } from "react";
import { X, Settings, Key, Cpu, Sparkles, Check, Eye, EyeOff, Bot, ShieldCheck, Flame, Zap, Share2 } from "lucide-react";
import { useAiSettings, AiSettings } from "@/lib/useSettings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODEL_PRESETS: Record<string, string[]> = {
  mock: ["Mock AI Engine (Offline & Fast)"],
  deepseek: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
  openai: ["gpt-4o", "gpt-4o-mini", "o3-mini", "gpt-4-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
  groq: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"]
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, loaded } = useAiSettings();

  const [provider, setProvider] = useState<AiSettings["provider"]>("mock");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Telemetry lives on the server, because the reporter runs there — a browser-only flag
  // could not actually stop anything from being sent.
  const [telemetry, setTelemetry] = useState<{
    enabled: boolean;
    forcedOffByEnv: boolean;
    instanceId: string;
  } | null>(null);

  useEffect(() => {
    if (loaded) {
      setProvider(settings.provider);
      setApiKey(settings.apiKey);
      setModelName(settings.modelName || (MODEL_PRESETS[settings.provider]?.[0] ?? ""));
    }
  }, [loaded, settings, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/settings/telemetry")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTelemetry({
            enabled: d.telemetryEnabled,
            forcedOffByEnv: d.forcedOffByEnv,
            instanceId: d.instanceId
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const toggleTelemetry = async (enabled: boolean) => {
    setTelemetry((prev) => (prev ? { ...prev, enabled } : prev));
    try {
      await fetch("/api/settings/telemetry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telemetryEnabled: enabled })
      });
    } catch {
      setTelemetry((prev) => (prev ? { ...prev, enabled: !enabled } : prev));
    }
  };

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: AiSettings["provider"]) => {
    setProvider(newProvider);
    setModelName(MODEL_PRESETS[newProvider]?.[0] ?? "");
  };

  const handleSave = () => {
    updateSettings({
      provider,
      apiKey,
      modelName
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-lg rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100 font-mono">PENGATURAN AI MODEL (BYOK)</h2>
            <p className="text-xs text-gray-400">Pilih provider DeepSeek, OpenAI, Anthropic, Gemini, Groq, atau Mock Engine</p>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
            Pilih AI Model Provider
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-950/90 rounded-2xl border border-white/[0.08] text-xs">
            <button
              type="button"
              onClick={() => handleProviderChange("mock")}
              className={`py-2 px-2.5 rounded-xl font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${
                provider === "mock"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Mock</span>
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange("deepseek")}
              className={`py-2 px-2.5 rounded-xl font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${
                provider === "deepseek"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-cyan-300" />
              <span>DeepSeek</span>
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange("openai")}
              className={`py-2 px-2.5 rounded-xl font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${
                provider === "openai"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>OpenAI</span>
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange("anthropic")}
              className={`py-2 px-2.5 rounded-xl font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${
                provider === "anthropic"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Claude</span>
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange("gemini")}
              className={`py-2 px-2.5 rounded-xl font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${
                provider === "gemini"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              <span>Gemini</span>
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange("groq")}
              className={`py-2 px-2.5 rounded-xl font-bold font-mono flex items-center justify-center gap-1.5 transition-all ${
                provider === "groq"
                  ? "bg-pink-600 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Groq</span>
            </button>
          </div>
        </div>

        {/* API Key Input (If NOT Mock) */}
        {provider !== "mock" ? (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>API Key {provider.toUpperCase()}</span>
                </label>
                <span className="text-[10px] text-gray-400">Tersimpan di Browser Lokal</span>
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    provider === "deepseek"
                      ? "sk-..."
                      : provider === "openai"
                      ? "sk-..."
                      : provider === "anthropic"
                      ? "sk-ant-..."
                      : "API Key..."
                  }
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl tech-input text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Name Preset Dropdown & Input */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 font-mono">
                Pilih Model
              </label>
              <div className="space-y-2">
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl tech-input text-xs font-mono text-gray-200"
                >
                  {(MODEL_PRESETS[provider] || []).map((preset) => (
                    <option key={preset} value={preset} className="bg-gray-900 text-gray-200">
                      {preset}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Kustom model name..."
                  className="w-full px-3.5 py-2 rounded-xl tech-input text-xs font-mono text-gray-300"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-200 space-y-1">
            <div className="flex items-center gap-2 font-bold font-mono text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Offline Mock Engine Aktif</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Anda tidak perlu memasukkan API Key. Aplikasi menggunakan mesin AI tiruan lokal yang instan & gratis untuk menguji alur (Ide → Discovery → Mind Map → PRD → Task breakdown).
            </p>
          </div>
        )}

        {/* Project metadata reporting — stated plainly, and switchable */}
        {telemetry && (
          <div className="p-4 rounded-2xl bg-gray-900/60 border border-white/[0.08] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Share2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-gray-100 font-mono">Kirim Metadata Projek</div>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                    Saat online, aplikasi mengirim <span className="text-gray-200">nama projek, cuplikan singkat ide,
                    tech stack, dan versi aplikasi</span> ke dashboard RencanaNgodingAI.
                  </p>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed mt-1">
                    Tidak pernah dikirim: isi dokumen PRD, mind map, daftar task, jawaban discovery, riwayat chat AI,
                    dan API key kamu.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={telemetry.enabled && !telemetry.forcedOffByEnv}
                disabled={telemetry.forcedOffByEnv}
                onClick={() => toggleTelemetry(!telemetry.enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  telemetry.forcedOffByEnv
                    ? "bg-gray-800 cursor-not-allowed"
                    : telemetry.enabled
                      ? "bg-cyan-600"
                      : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    telemetry.enabled && !telemetry.forcedOffByEnv ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {telemetry.forcedOffByEnv ? (
              <p className="text-[10px] text-amber-300 font-mono">
                Dimatikan paksa lewat environment (RENCANANGODING_TELEMETRY=off).
              </p>
            ) : (
              <p className="text-[10px] text-gray-500 font-mono break-all">
                ID instalasi: {telemetry.instanceId}
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] font-mono text-gray-400">
            {provider === "mock" ? "Mode: Standalone / Offline" : `Provider: ${provider.toUpperCase()}`}
          </span>

          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-900 border border-white/[0.08] text-xs text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Pengaturan</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
