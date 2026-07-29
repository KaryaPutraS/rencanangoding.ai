"use client";

import { useState } from "react";
import { X, MessageSquare, Send, Loader2, Bot, User } from "lucide-react";
import { getAiHeaders } from "@/lib/useSettings";

interface StructureRevisionChatProps {
  planId: string;
  isOpen: boolean;
  onClose: () => void;
  onStructureUpdated: (newFeatures: any[]) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const PRESET_REVISION_PROMPTS = [
  "Tambahkan modul Payment Gateway (Midtrans & Stripe)",
  "Tambahkan modul Auth Multi-Factor (OTP & Passkey)",
  "Sederhanakan Fase 1 khusus untuk MVP inti",
  "Tambahkan modul Laporan Analytics & Export PDF"
];

export function StructureRevisionChat({
  planId,
  isOpen,
  onClose,
  onStructureUpdated
}: StructureRevisionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Halo! Saya AI Software Architect. Apa ada fitur atau fase yang ingin ditambah/revisi pada mind map struktur ini sebelum masuk ke PRD Studio?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [revising, setRevising] = useState(false);

  if (!isOpen) return null;

  const handleSendRevision = async (textToSend?: string) => {
    const promptText = (textToSend || inputPrompt).trim();
    if (!promptText) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setRevising(true);

    try {
      const res = await fetch(`/api/plans/${planId}/generate-structure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAiHeaders()
        },
        body: JSON.stringify({ revisionPrompt: promptText })
      });

      const data = await res.json();
      if (data.success && data.features) {
        onStructureUpdated(data.features);

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: "ai",
          text: `Struktur mind map berhasil direvisi berdasarkan instruksi: "${promptText}". Mind map sudah diperbarui!`,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: "ai",
          text: `Gagal merevisi struktur: ${data.error || "Terjadi kesalahan"}`,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: "Gagal terhubung ke server untuk merevisi struktur.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setRevising(false);
    }
  };

  return (
    <>
      {/* Overlay Backdrop for Mobile & Desktop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] tech-panel border-l border-white/[0.1] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-gray-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <span>REVISI STRUKTUR AI</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-mono">
                  LIVE REVISION
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Revisi node mind map sebelum ke PRD</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 min-h-0 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                  m.sender === "user"
                    ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                    : "bg-gray-900 border-cyan-800 text-cyan-400"
                }`}
              >
                {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[80%] p-3 rounded-2xl space-y-1 ${
                  m.sender === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none font-sans shadow-md"
                    : "tech-panel border border-white/[0.08] text-gray-200 rounded-tl-none leading-relaxed"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <span
                  className={`text-[9px] block font-mono ${
                    m.sender === "user" ? "text-emerald-200 text-right" : "text-gray-500 text-left"
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {revising && (
            <div className="flex items-center gap-2.5 text-xs text-emerald-400 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 font-mono animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI sedang memproses revisi struktur mind map...</span>
            </div>
          )}
        </div>

        {/* Quick Preset Revision Chips */}
        <div className="p-3 border-t border-white/[0.08] bg-gray-950/60 shrink-0 space-y-1.5">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
            Rekomendasi Revisi Cepat:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REVISION_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={revising}
                onClick={() => handleSendRevision(p)}
                className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-white/[0.08] text-[10px] text-gray-300 hover:text-white transition-colors truncate max-w-full text-left"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendRevision();
          }}
          className="p-3 border-t border-white/[0.08] bg-gray-950 flex gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={revising}
            placeholder="Ketik instruksi revisi (misal: Tambahkan modul Laporan)..."
            className="flex-1 px-3.5 py-2.5 rounded-xl tech-input text-xs text-gray-100 font-sans focus:ring-1 focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={revising || !inputPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center transition-all shrink-0"
          >
            {revising ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </>
  );
}
