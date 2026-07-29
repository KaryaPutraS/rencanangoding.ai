"use client";

import { useState, useEffect } from "react";
import { X, Mail, ShieldCheck, Key, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, Sparkles, UserCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import { getAiHeaders } from "@/lib/useSettings";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = "email" | "otp" | "create-password" | "login-password";

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginSession } = useAuth();

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setStep("email");
      setError("");
      setSuccessMsg("");
      setDevOtpCode(null);
      setOtpCode("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Masukkan alamat email yang valid (contoh: user@domain.com)");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAiHeaders() },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setIsExistingUser(data.isExistingUser);
        if (data.devOtpCode) {
          setDevOtpCode(data.devOtpCode);
        }
        setSuccessMsg(data.message || "Kode OTP dikirim!");
        setStep("otp");
      } else {
        setError(data.error || "Gagal meminta kode OTP");
      }
    } catch {
      setError("Gagal terhubung ke server auth");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Masukkan 6-digit kode OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otpCode.trim() })
      });
      const data = await res.json();

      if (data.success) {
        if (data.isExistingUser) {
          // If existing user verified OTP, prompt password or log in directly
          setStep("login-password");
          setSuccessMsg("Email terverifikasi! Masukkan password kamu untuk melanjutkan.");
        } else {
          // New user -> prompt create password
          setStep("create-password");
          setSuccessMsg("Email aktif terverifikasi! Sekarang buat password akun kamu.");
        }
      } else {
        setError(data.error || "Kode OTP tidak valid");
      }
    } catch {
      setError("Gagal terhubung ke server auth");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create Password & Register
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/create-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otpCode: otpCode.trim(),
          password
        })
      });
      const data = await res.json();

      if (data.success && data.user) {
        loginSession(data.user, data.token);
        onClose();
      } else {
        setError(data.error || "Gagal membuat password");
      }
    } catch {
      setError("Gagal terhubung ke server auth");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Login with Password
  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Masukkan password kamu");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();

      if (data.success && data.user) {
        loginSession(data.user, data.token);
        onClose();
      } else {
        setError(data.error || "Password salah");
      }
    } catch {
      setError("Gagal terhubung ke server auth");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-md rounded-3xl p-6 border border-white/[0.08] shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100 font-mono flex items-center gap-2">
              <span>PROTEKSI DASHBOARD & USER</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                Verifikasi OTP
              </span>
            </h2>
            <p className="text-xs text-gray-400">Verifikasi email aktif untuk mengamankan projek kamu</p>
          </div>
        </div>

        {/* Success Alert Notice */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert Notice */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dev Mode OTP Banner (For Open Source Zero-Setup Convenience) */}
        {devOtpCode && step === "otp" && (
          <div className="p-3.5 rounded-2xl bg-cyan-950/50 border border-cyan-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>KODE OTP DEMO / AUTO:</span>
              </span>
              <span className="px-2 py-0.5 bg-cyan-900 rounded text-cyan-200 font-bold text-sm tracking-widest">
                {devOtpCode}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-snug">
              Salin kode 6-digit <span className="font-mono text-cyan-300">{devOtpCode}</span> di atas untuk langsung verifikasi tanpa perlu setup SMTP terpisah.
            </p>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                Alamat Email Kamu
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl tech-input text-xs text-gray-100 font-mono focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Kami akan mengirimkan 6-digit kode OTP untuk verifikasi keaktifan email kamu.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Kode OTP...</span>
                </>
              ) : (
                <>
                  <span>Minta Kode OTP Verifikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP Code */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Masukkan 6-Digit Kode OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-[10px] text-emerald-400 hover:underline font-mono"
                >
                  Ubah Email
                </button>
              </div>

              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl tech-input text-sm font-mono text-center tracking-[0.4em] font-bold text-emerald-300 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-gray-400">Email: <span className="text-gray-200 font-mono">{email}</span></p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi OTP...</span>
                </>
              ) : (
                <>
                  <span>Verifikasi Email & Lanjut</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Create Password (New User) */}
        {step === "create-password" && (
          <form onSubmit={handleCreatePassword} className="space-y-4">
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Email <span className="font-mono font-bold">{email}</span> terverifikasi! Buat password kamu:</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                Buat Password Akun
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl tech-input text-xs text-gray-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl tech-input text-xs text-gray-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                <>
                  <span>Simpan Password & Masuk Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Login with Password (Existing User) */}
        {step === "login-password" && (
          <form onSubmit={handleLoginPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                Password Akun (<span className="text-emerald-400 font-normal">{email}</span>)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password kamu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl tech-input text-xs text-gray-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Masuk Ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
