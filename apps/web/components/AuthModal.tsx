"use client";

import { useState, useEffect } from "react";
import { X, Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "./AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sign in for the self-hosted app: email, then a password. Two screens, no inbox.
 *
 * The old flow mailed a one-time code, which meant nobody could reach their own app
 * until they had configured Resend or an SMTP server first — a lot of setup for a tool
 * running on their own machine. The password stays, because the built-in tunnel can put
 * this install on the public internet.
 */
type Step = "email" | "password";

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginSession } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [registered, setRegistered] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setStep("email");
      setRegistered(false);
      setError("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean.includes("@")) {
      setError("Masukkan alamat email yang valid (contoh: kamu@domain.com)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean })
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Gagal memeriksa email");
        return;
      }

      setRegistered(Boolean(data.registered));
      setStep("password");
    } catch {
      setError("Gagal terhubung ke server lokal. Pastikan aplikasinya masih jalan.");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (!registered && password !== confirmPassword) {
      setError("Konfirmasi password belum sama");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(registered ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();

      if (data.success && data.user && data.token) {
        loginSession(data.user, data.token);
        onClose();
      } else {
        setError(data.error || (registered ? "Password salah" : "Gagal membuat akun"));
      }
    } catch {
      setError("Gagal terhubung ke server lokal. Pastikan aplikasinya masih jalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-md rounded-3xl p-6 border border-white/[0.08] shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-12">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            {step === "password" && !registered ? <UserPlus className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">
              {step === "email" ? "Masuk atau Daftar" : registered ? "Masukkan Password" : "Buat Password"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === "email"
                ? "Cukup email dan password. Tidak ada kode verifikasi."
                : registered
                  ? `Masuk sebagai ${email.trim()}`
                  : `Akun baru untuk ${email.trim()}`}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={submitEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="block text-xs font-bold text-gray-300">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  autoFocus
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@domain.com"
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl tech-input text-sm text-gray-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{loading ? "Memeriksa…" : "Lanjut"}</span>
            </button>

            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              Data dan dokumenmu tersimpan di komputer ini saja.
            </p>
          </form>
        ) : (
          <form onSubmit={submitPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="block text-xs font-bold text-gray-300">
                {registered ? "Password" : "Password Baru"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  required
                  minLength={6}
                  autoComplete={registered ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full min-h-[44px] pl-10 pr-12 rounded-xl tech-input text-sm text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!registered && (
              <div className="space-y-1.5">
                <label htmlFor="auth-confirm" className="block text-xs font-bold text-gray-300">
                  Ulangi Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password"
                    className="w-full min-h-[44px] pl-10 pr-4 rounded-xl tech-input text-sm text-gray-100"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{loading ? "Memproses…" : registered ? "Masuk" : "Buat Akun & Masuk"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setPassword("");
                setConfirmPassword("");
                setError("");
              }}
              className="w-full min-h-[44px] rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              ← Ganti email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
