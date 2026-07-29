"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Globe,
  Copy,
  Check,
  Power,
  ShieldCheck,
  Smartphone,
  Loader2,
  Wifi,
  Lock,
  AlertCircle,
  Shield,
  Layers
} from "lucide-react";

interface TailscaleInfo {
  installed: boolean;
  running: boolean;
  ip?: string;
  dnsName?: string;
  url?: string;
}

interface TunnelStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TunnelStatusModal({ isOpen, onClose }: TunnelStatusModalProps) {
  const [activeCloudflare, setActiveCloudflare] = useState(false);
  const [cloudflareUrl, setCloudflareUrl] = useState<string | null>(null);
  const [localNetworkUrl, setLocalNetworkUrl] = useState<string | null>(null);
  const [tailscale, setTailscale] = useState<TailscaleInfo>({ installed: false, running: false });
  const [tailscaleEnabled, setTailscaleEnabled] = useState(false);
  const [loadingCloudflare, setLoadingCloudflare] = useState(false);
  const [loadingTailscale, setLoadingTailscale] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState<string>("http://localhost:7518");

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/tunnel");
      const data = await res.json();
      if (data.success) {
        setActiveCloudflare(data.active && data.provider === "cloudflare");
        setCloudflareUrl(data.url);
        setLocalNetworkUrl(data.localNetworkUrl || null);
        if (data.tailscale) {
          setTailscale(data.tailscale);
          if (data.active && data.provider === "tailscale") {
            setTailscaleEnabled(true);
          }
        }

        // Set default QR URL
        if (data.tailscale?.url) {
          setQrUrl(data.tailscale.url);
        } else if (data.localNetworkUrl) {
          setQrUrl(data.localNetworkUrl);
        }
      }
    } catch (err) {
      console.error("Error checking tunnel status:", err);
    }
  };

  const handleToggleCloudflare = async () => {
    setLoadingCloudflare(true);
    setError("");
    try {
      const res = await fetch("/api/tunnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: activeCloudflare ? "stop" : "start",
          provider: "cloudflare"
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveCloudflare(data.active && data.provider === "cloudflare");
        setCloudflareUrl(data.url);
        if (data.url) setQrUrl(data.url);
      } else {
        setError(data.error || "Gagal mengubah status Cloudflare Tunnel");
      }
    } catch {
      setError("Gagal terhubung ke service tunnel");
    } finally {
      setLoadingCloudflare(false);
    }
  };

  const handleToggleTailscale = async () => {
    setLoadingTailscale(true);
    setError("");
    try {
      const res = await fetch("/api/tunnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: tailscaleEnabled ? "stop" : "start",
          provider: "tailscale"
        })
      });
      const data = await res.json();
      if (data.success) {
        setTailscaleEnabled(data.active && data.provider === "tailscale");
        if (data.url) setQrUrl(data.url);
      } else {
        setError(data.error || "Gagal mengaktifkan Tailscale Endpoint");
      }
    } catch {
      setError("Gagal mengaktifkan Tailscale");
    } finally {
      setLoadingTailscale(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-xl rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <span>Endpoint & Tunnel Configuration</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-mono">
                9Router Concept
              </span>
            </h2>
            <p className="text-xs text-gray-400">Konfigurasi endpoint lokal, Tailscale mesh, & Cloudflare tunnel</p>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* API Endpoint Section (9Router UI Style) */}
        <div className="p-5 rounded-2xl bg-gray-950/90 border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              API Endpoint & Remote Access
            </h3>
          </div>

          {/* 1. Local Endpoint */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-gray-800 font-mono text-gray-300 text-[10px]">Local</span>
                <span>Localhost Studio Endpoint:</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="http://localhost:7518"
                className="flex-1 px-3 py-2 rounded-xl bg-gray-900 border border-white/[0.08] font-mono text-xs text-gray-200"
              />
              <button
                onClick={() => copyToClipboard("http://localhost:7518", "local")}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                title="Salin Link"
              >
                {copiedField === "local" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. Tailscale Mesh Endpoint (9Router Style) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono text-[10px] font-bold">
                  Tailscale
                </span>
                <span>Tailscale Secure Mesh Access:</span>
              </span>

              {tailscale.running && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>IP: {tailscale.ip}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={tailscale.url || (tailscale.installed ? "Tailscale terdeteksi (Klik Enable)" : "Tailscale tidak terdeteksi")}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-900 border border-white/[0.08] font-mono text-xs text-purple-300"
              />

              {tailscale.running ? (
                <button
                  onClick={handleToggleTailscale}
                  disabled={loadingTailscale}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                    tailscaleEnabled
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                  }`}
                >
                  {loadingTailscale ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  <span>{tailscaleEnabled ? "Active 🟢" : "Enable ⚡"}</span>
                </button>
              ) : (
                <button
                  disabled
                  className="px-3 py-2 rounded-xl bg-gray-800 text-gray-500 font-bold text-xs cursor-not-allowed"
                >
                  Not Running
                </button>
              )}
            </div>
          </div>

          {/* 3. Cloudflare Public Tunnel */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono text-[10px] font-bold">
                  Tunnel
                </span>
                <span>Cloudflare Official Public Tunnel:</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={cloudflareUrl || "Tunnel tidak aktif (Klik Power Button)"}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-900 border border-white/[0.08] font-mono text-xs text-sky-300"
              />

              <button
                onClick={() => cloudflareUrl && copyToClipboard(cloudflareUrl, "public")}
                disabled={!cloudflareUrl}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-40"
                title="Salin Link"
              >
                {copiedField === "public" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleToggleCloudflare}
                disabled={loadingCloudflare}
                title={activeCloudflare ? "Matikan Public Tunnel" : "Aktifkan Public Tunnel"}
                className={`p-2 rounded-xl transition-all shadow-md ${
                  activeCloudflare
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                {loadingCloudflare ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Section for Mobile Phone Access */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2.5 bg-white rounded-2xl shadow-xl shrink-0">
            <QRCodeSVG value={qrUrl} size={100} level="M" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xs font-bold text-emerald-200 flex items-center justify-center sm:justify-start gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Scan QR Code dari Smartphone HP</span>
            </h4>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Arahkan kamera HP ke QR Code di atas untuk langsung membuka studio di perangkat mobile kamu melalui jaringan terenkripsi Tailscale / Wi-Fi lokal.
            </p>
            <span className="inline-block px-2 py-0.5 rounded bg-gray-900 border border-white/[0.08] font-mono text-[10px] text-sky-300">
              Active Link: {qrUrl}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 border border-white/[0.08] text-xs text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
