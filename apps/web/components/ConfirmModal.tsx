"use client";

import React from "react";
import { AlertTriangle, Trash2, RotateCcw, ShieldAlert, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in"
      />

      {/* Bespoke Tech Confirmation Dialog Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md tech-panel p-6 rounded-3xl border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 ${
            isDanger
              ? "border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.15)]"
              : isWarning
              ? "border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.15)]"
              : "border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)]"
          }`}
        >
          {/* Header Icon & Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                  isDanger
                    ? "bg-red-950/80 border-red-800/80 text-red-400"
                    : isWarning
                    ? "bg-amber-950/80 border-amber-800/80 text-amber-400"
                    : "bg-emerald-950/80 border-emerald-800/80 text-emerald-400"
                }`}
              >
                {isDanger ? (
                  <Trash2 className="w-5 h-5" />
                ) : isWarning ? (
                  <RotateCcw className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${isDanger ? "text-red-400" : "text-amber-400"}`} />
                  <span>KONFIRMASI TINDAKAN</span>
                </div>
                <h3 className="text-base font-extrabold text-white leading-snug">{title}</h3>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description Message */}
          <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/[0.06] text-xs text-gray-300 leading-relaxed font-sans">
            {message}
          </div>

          {/* Custom Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/[0.08] text-xs font-semibold text-gray-300 transition-colors"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105 ${
                isDanger
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20"
                  : isWarning
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
