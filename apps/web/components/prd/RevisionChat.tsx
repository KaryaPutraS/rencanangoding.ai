"use client";

import { useState } from "react";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { AiChatMessage } from "@rencanangoding/shared";
import { getAiHeaders } from "@/lib/useSettings";

interface RevisionChatProps {
  planId: string;
  initialMessages?: AiChatMessage[];
  onPrdUpdated: (newMarkdown: string) => void;
}

const QUICK_CHIPS = [
  "Prioritas MVP",
  "Fitur kurang",
  "Cek auth flow",
  "Tambah notifikasi & webhook",
  "Skalabilitas & DB Indexing"
];

export function RevisionChat({ planId, initialMessages = [], onPrdUpdated }: RevisionChatProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend;
    setInput("");
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: AiChatMessage = {
      id: crypto.randomUUID(),
      planId,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/plans/${planId}/prd`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAiHeaders() },
        body: JSON.stringify({ chatMessage: userText })
      });
      const data = await res.json();

      if (data.success) {
        if (data.prd?.contentMarkdown) {
          onPrdUpdated(data.prd.contentMarkdown);
        }
        if (data.chatHistory) {
          setMessages(data.chatHistory);
        }
      }
    } catch (err) {
      console.error("Chat revision error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/90 rounded-2xl border border-white/[0.08] overflow-hidden tech-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-2.5 bg-gray-950/40">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-200">Chat Revisi PRD</h3>
          <p className="text-[10px] text-gray-400">Diskusi & sesuaikan kebutuhan dokumen</p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.length === 0 ? (
          <div className="text-center py-6 px-4">
            <Bot className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80 animate-pulse-slow" />
            <p className="text-gray-300 font-semibold mb-1">Ada bagian PRD yang ingin disesuaikan?</p>
            <p className="text-[11px] text-gray-500">
              Ketik instruksi kamu atau klik rekomendasi chip di bawah ini untuk revisi cepat.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    isUser ? "bg-emerald-600 text-white" : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  }`}
                >
                  {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    isUser
                      ? "bg-emerald-600/90 text-white rounded-tr-none shadow-md"
                      : "bg-gray-800/90 text-gray-200 border border-gray-700/60 rounded-tl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI sedang menyesuaikan dokumen PRD...</span>
          </div>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 py-2 border-t border-white/[0.08] bg-gray-950/30 overflow-x-auto flex gap-1.5 no-scrollbar">
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => sendMessage(`Revisi PRD untuk: ${chip}`)}
            className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 whitespace-nowrap transition-colors"
          >
            + {chip}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-3 border-t border-white/[0.08] bg-gray-950/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik revisi (misal: 'Tambahkan OAuth Google')..."
          className="flex-1 px-3 py-2 rounded-xl text-xs tech-input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
