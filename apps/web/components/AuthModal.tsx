"use client";

import { useState, useEffect } from "react";
import { X, Mail, ShieldCheck, Key, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, Sparkles, UserCheck, RefreshCw } from "lucide-react";
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

  // Step 1: Request OTP or Check Registered Password
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
        // Registered User with Password -> Skip OTP, prompt Password directly
        if (data.hasPassword) {
          setStep("login-password");
          setSuccessMsg("Email terdaftar! Masukkan password kamu untuk login.");
          return;
        }

        // New User -> Require OTP 1 time to verify & set password
        if (data.devOtpCode) {
          setDevOtpCode(data.devOtpCode);
          setOtpCode(data.devOtpCode);
        }
        setSuccessMsg(data.message || "Kode OTP dikirim ke email kamu!");
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

  // Force OTP Reset for Registered User who forgot Password
  const handleForceOtpReset = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAiHeaders() },
        body: JSON.stringify({ email: email.trim(), forceOtp: true })
      });
      const data = await res.json();

      if (data.success) {
        if (data.devOtpCode) {
          setDevOtpCode(data.devOtpCode);
          setOtpCode(data.devOtpCode);
        }
        setSuccessMsg(data.message || "Kode OTP reset dikirim!");
        setStep("otp");
      } else {
        setError(data.error || "Gagal meminta kode OTP reset");
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
        setStep("create-password");
        setSuccessMsg("Email aktif terverifikasi! Sekarang atur password akun kamu.");
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

  // Step 4: Login with Password (Subsequent sessions)
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
        setError(data.error || "Password salah. Silakan coba lagi.");
      }
    } catch {
      setError("Gagal terhubung ke server auth");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="tech-panel w-full max-w-md rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100 font-mono flex items-center gap-2">
              <span>AKUN USER</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                {step === "login-password" ? "Login Password" : "Pendaftaran Email"}
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              {step === "login-password"
                ? "Masukkan password akun kamu untuk masuk ke dashboard"
                : "Masukkan email kamu untuk mulai menggunakan RencanaNgodingAI"}
            </p>
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
          <div className="p-3.5 rounded-2xl bg-cyan-950/50 border border-cyan-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>KODE OTP DEV / LOKAL:</span>
              </span>
              <span className="px-2.5 py-0.5 bg-cyan-900 rounded-lg text-cyan-200 font-bold text-sm tracking-widest font-mono">
                {devOtpCode}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOtpCode(devOtpCode)}
              className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs font-mono transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Klik Auto-Isi OTP ({devOtpCode})</span>
            </button>
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
                Email terdaftar akan langsung login dengan Password. Email baru cukup verifikasi 1 kali.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memeriksa Email...</span>
                </>
              ) : (
                <>
                  <span>Lanjutkan Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP Code (1-time verification for new users) */}
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
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi OTP...</span>
                </>
              ) : (
                <>
                  <span>Verifikasi Email 1-Kali & Lanjut</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Create Password (New User - 1 time setup) */}
        {step === "create-password" && (
          <form onSubmit={handleCreatePassword} className="space-y-4">
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Email <span className="font-mono font-bold">{email}</span> aktif! Atur password untuk login berikutnya:</span>
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
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                <>
                  <span>Simpan Password & Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Login with Password (Registered User - Direct Password Login) */}
        {step === "login-password" && (
          <form onSubmit={handleLoginPassword} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Password Akun
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
                <Key className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password kamu"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl tech-input text-xs text-gray-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-400 font-mono truncate max-w-[200px]">{email}</span>
                <button
                  type="button"
                  onClick={handleForceOtpReset}
                  className="text-[11px] text-cyan-400 hover:underline font-mono flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Lupa Password?</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Password...</span>
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
