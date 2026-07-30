"use client";

import { useState } from "react";
import { X, CreditCard, QrCode, Building2, Wallet, Check, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
}

export function PaymentModal({ isOpen, onClose, planName = "Projek Spec Cloud" }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"qris" | "cc" | "va" | "e-wallet">("qris");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  if (!isOpen) return null;

  const handleProcessPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaid(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-lg rounded-3xl p-6 border border-white/[0.08] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {!paid ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-100 font-mono flex items-center gap-2">
                  <span>UPGRADE AKSES & PEMBAYARAN</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    Midtrans / QRIS
                  </span>
                </h2>
                <p className="text-xs text-gray-400">Pilih metode pembayaran untuk melanjutkan pemrosesan spesifikasi cloud</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-2xl bg-gray-900/80 border border-white/[0.08] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-gray-400">
                <span>Item Layanan:</span>
                <span className="text-white font-bold">{planName}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Akses Level:</span>
                <span className="text-emerald-400 font-bold">Cloud SaaS Pro Specs</span>
              </div>
              <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-gray-200">Total Tagihan:</span>
                <span className="font-extrabold text-emerald-400">Rp 49.000 <span className="text-[10px] text-gray-400 font-normal">/ bulan</span></span>
              </div>
            </div>

            {/* Payment Methods Options */}
            <div className="space-y-2 font-mono">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                Pilih Metode Pembayaran:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("qris")}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 ${
                    selectedMethod === "qris"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/20"
                      : "bg-gray-900/80 hover:bg-gray-800 border-white/[0.08] text-gray-400"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>QRIS / GoPay / OVO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("va")}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 ${
                    selectedMethod === "va"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/20"
                      : "bg-gray-900/80 hover:bg-gray-800 border-white/[0.08] text-gray-400"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Virtual Account Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("cc")}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 ${
                    selectedMethod === "cc"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/20"
                      : "bg-gray-900/80 hover:bg-gray-800 border-white/[0.08] text-gray-400"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Kartu Kredit / Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("e-wallet")}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 ${
                    selectedMethod === "e-wallet"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/20"
                      : "bg-gray-900/80 hover:bg-gray-800 border-white/[0.08] text-gray-400"
                  }`}
                >
                  <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>E-Wallet Transfer</span>
                </button>
              </div>
            </div>

            {/* QRIS / Method Detail View */}
            {selectedMethod === "qris" && (
              <div className="p-4 rounded-2xl bg-gray-950/80 border border-emerald-500/30 text-center space-y-2">
                <div className="w-32 h-32 bg-white p-2 rounded-xl mx-auto flex items-center justify-center">
                  <div className="w-full h-full border-4 border-gray-950 flex items-center justify-center font-mono font-black text-gray-950 text-xs text-center">
                    [ QRIS CODE PLACEHOLDER ]
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 font-mono">Scan QRIS menggunakan Mobile Banking, GoPay, OVO, ShopeePay, atau Dana.</p>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={processing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-wider font-mono shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <span>MEMPROSES PEMBAYARAN...</span>
              ) : (
                <>
                  <span>BAYAR SEKARANG (SIMULASI API)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1 font-mono">
              <h3 className="text-lg font-bold text-white">PEMBAYARAN BERHASIL!</h3>
              <p className="text-xs text-gray-300">Akses Cloud SaaS Pro kamu telah aktif. Kamu sekarang bisa men-generate PRD & Spesifikasi secara unlimited.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono shadow-lg transition-all"
            >
              Lanjutkan Ke Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
