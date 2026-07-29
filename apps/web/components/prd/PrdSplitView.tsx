"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";
import {
  Eye,
  Code,
  Pencil,
  Copy,
  Share2,
  RefreshCw,
  Maximize2,
  Minimize2,
  Check,
  Rocket,
  MessageSquarePlus,
  Sparkles,
  FileText,
  Network,
  KanbanSquare
} from "lucide-react";
import { ReactFlowMindMap } from "../mindmap/ReactFlowMindMap";
import { RevisionChat } from "./RevisionChat";
import { ImplementationModal } from "../ImplementationModal";
import { FeatureNode, TaskItem } from "@rencanangoding/shared";

// Initialize Mermaid theme once
if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    themeVariables: {
      darkMode: true,
      background: "#090d16",
      primaryColor: "#4f46e5",
      secondaryColor: "#9333ea",
      tertiaryColor: "#0284c7",
      primaryTextColor: "#f3f4f6",
      lineColor: "#6366f1",
      fontFamily: "ui-sans-serif, system-ui, sans-serif"
    }
  });
}

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");
  const [svgHtml, setSvgHtml] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const renderId = `mermaid-${reactId}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      mermaid
        .render(renderId, code)
        .then(({ svg }) => {
          if (isMounted) {
            setSvgHtml(svg);
          }
        })
        .catch((err) => {
          console.warn("Mermaid render error:", err);
        });
    } catch (err) {
      console.warn("Mermaid sync render error:", err);
    }

    return () => {
      isMounted = false;
    };
  }, [code, reactId]);

  if (!svgHtml) {
    return (
      <div className="my-4 p-4 rounded-xl bg-gray-950/80 border border-gray-800 font-mono text-[11px] text-gray-400 overflow-x-auto">
        <pre>{code}</pre>
      </div>
    );
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svgHtml }}
      className="my-5 p-4 rounded-2xl bg-gray-950/90 border border-gray-800 flex justify-center overflow-x-auto shadow-xl [&>svg]:max-w-full [&>svg]:h-auto"
    />
  );
}

interface PrdSplitViewProps {
  planId: string;
  planName: string;
  initialMarkdown: string;
  features?: FeatureNode[];
  tasks?: TaskItem[];
}

export function PrdSplitView({
  planId,
  planName,
  initialMarkdown,
  features = [],
  tasks = []
}: PrdSplitViewProps) {
  const router = useRouter();
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [mode, setMode] = useState<"preview" | "source">("preview");
  const [mobileTab, setMobileTab] = useState<"prd" | "mindmap">("prd");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showImplModal, setShowImplModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSharePrd = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}/prd/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true })
      });
      const data = await res.json();
      if (data.success) {
        const fullUrl = `${window.location.origin}${data.shareUrl}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 3000);
      }
    } catch (err) {
      console.error("Error sharing PRD:", err);
    }
  };

  const saveManualEdit = async () => {
    setIsEditing(false);
    try {
      await fetch(`/api/plans/${planId}/prd`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentMarkdown: markdown })
      });
    } catch (err) {
      console.error("Error saving manual edit:", err);
    }
  };

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden ${isExpanded ? "fixed inset-0 z-50 bg-dot-grid p-3 sm:p-4" : ""}`}>
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-3 tech-panel rounded-2xl border border-white/[0.08] mb-3 shrink-0">
        {/* Document Title & Public Share */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <span className="font-extrabold text-xs sm:text-sm text-gray-100 flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">Perencanaan & PRD Studio</span>
          </span>

          <button
            onClick={handleSharePrd}
            title="Bagikan PRD publik (Read-only link)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/[0.08] text-xs text-gray-300 transition-colors shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">
              {copiedShare ? "Link Tersalin!" : "Share Link"}
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto">
          {/* Mode Switch (Preview vs Source) */}
          <div className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-white/[0.08] text-xs shrink-0">
            <button
              onClick={() => {
                setMode("preview");
                setIsEditing(false);
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                mode === "preview" && !isEditing ? "bg-emerald-600 text-white font-semibold" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => {
                setMode("source");
                setIsEditing(false);
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                mode === "source" && !isEditing ? "bg-emerald-600 text-white font-semibold" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Source</span>
            </button>
          </div>

          {/* Edit Manual Pencil */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Edit markdown manual"
            className={`p-2 rounded-xl border text-xs transition-colors shrink-0 ${
              isEditing ? "bg-amber-600 text-white border-amber-500" : "bg-gray-900 border-white/[0.08] text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyMarkdown}
            title="Salin isi PRD"
            className="p-2 rounded-xl bg-gray-900 border border-white/[0.08] text-gray-300 hover:bg-gray-800 text-xs transition-colors shrink-0 flex items-center gap-1"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Chat AI Revision Drawer Toggle */}
          <button
            onClick={() => setShowChatDrawer(!showChatDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              showChatDrawer
                ? "bg-emerald-600 text-white border-emerald-500 shadow-lg"
                : "bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60"
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Chat Revisi</span>
          </button>

          {/* Task Kanban Page Button */}
          <button
            onClick={() => router.push(`/plan/${planId}/kanban`)}
            title="Buka Papan Task Kanban"
            className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-gray-900 hover:bg-gray-800 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 hover:scale-105"
          >
            <KanbanSquare className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Task Kanban</span>
          </button>

          {/* Expand Fullscreen Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Kecilkan Tampilan" : "Perluas Fullscreen"}
            className="p-2 rounded-xl bg-gray-900 border border-white/[0.08] text-gray-300 hover:bg-gray-800 text-xs transition-colors shrink-0"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Start Implementation Modal Trigger */}
          <button
            onClick={() => setShowImplModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 shrink-0"
          >
            <Rocket className="w-4 h-4 animate-bounce" />
            <span className="hidden sm:inline">Mulai Implementasi</span>
            <span className="sm:hidden">Mulai</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on screens < lg) */}
      <div className="lg:hidden flex items-center p-1 bg-gray-950/90 rounded-xl border border-white/[0.08] mb-3 text-xs shrink-0">
        <button
          onClick={() => setMobileTab("prd")}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            mobileTab === "prd" ? "bg-emerald-600 text-white shadow-md" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Dokumen PRD</span>
        </button>
        <button
          onClick={() => setMobileTab("mindmap")}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            mobileTab === "mindmap" ? "bg-emerald-600 text-white shadow-md" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Mind Map Diagram</span>
        </button>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left Column: PRD Document */}
        <div className={`h-full overflow-hidden flex-col tech-panel rounded-2xl border border-white/[0.08] min-h-0 ${
          mobileTab === "prd" ? "flex" : "hidden lg:flex"
        } ${showChatDrawer ? "lg:col-span-4" : "lg:col-span-6"}`}>
          <div className="px-4 py-2.5 border-b border-white/[0.08] bg-gray-950/40 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Dokumen PRD Spesifikasi</span>
            {isEditing && (
              <button
                onClick={saveManualEdit}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
              >
                Simpan Perubahan
              </button>
            )}
          </div>

          {/* Independent Scrollable PRD View Box */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-gray-200 min-h-0 custom-scrollbar">
            {isEditing ? (
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full h-full min-h-[400px] p-4 font-mono text-xs tech-input rounded-xl leading-relaxed resize-none focus:outline-none"
              />
            ) : mode === "source" ? (
              <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
                {markdown}
              </pre>
            ) : (
              <article className="prose prose-invert max-w-none prose-headings:text-emerald-200 prose-a:text-sky-400 prose-code:text-emerald-300 text-xs leading-relaxed space-y-4">
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isMermaid = match && match[1] === "mermaid";

                      if (isMermaid) {
                        return <MermaidDiagram code={String(children).replace(/\n$/, "")} />;
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>

        {/* Middle Column (Optional Chat Drawer) */}
        {showChatDrawer && (
          <div className="lg:col-span-4 h-full overflow-hidden min-h-0 flex flex-col">
            <RevisionChat
              planId={planId}
              onPrdUpdated={(newMd) => setMarkdown(newMd)}
            />
          </div>
        )}

        {/* Right Column: React Flow Mind Map */}
        <div className={`h-full overflow-hidden rounded-2xl flex-col min-h-0 ${
          mobileTab === "mindmap" ? "flex" : "hidden lg:flex"
        } ${showChatDrawer ? "lg:col-span-4" : "lg:col-span-6"}`}>
          <ReactFlowMindMap planName={planName} features={features} tasks={tasks} />
        </div>
      </div>

      {/* Implementation Modal Dialog */}
      <ImplementationModal
        isOpen={showImplModal}
        onClose={() => setShowImplModal(false)}
        planId={planId}
        planName={planName}
        prdMarkdown={markdown}
        features={features}
        tasks={tasks}
      />
    </div>
  );
}
