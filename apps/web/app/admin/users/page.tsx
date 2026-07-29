"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Users, Mail, Search, Download, RefreshCw, Shield, Layers, Calendar, Terminal } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  planCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportCsv = () => {
    const csvHeader = "ID,Email,Nama,Tanggal Daftar,Jumlah Plan\n";
    const csvRows = users
      .map(
        (u) =>
          `"${u.id}","${u.email}","${u.name || ""}","${new Date(u.createdAt).toLocaleString("id-ID")}",${u.planCount}`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-leads-ksatriyo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyEmailList = () => {
    const emailList = users.map((u) => u.email).join(", ");
    navigator.clipboard.writeText(emailList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-dot-grid text-gray-100 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 lg:py-12 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 tech-panel p-6 rounded-3xl border border-white/[0.08] shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 mb-0.5">
                <Shield className="w-3.5 h-3.5" />
                <span>ADMIN CENTRAL HUB // USER LEADS DIRECTORY</span>
              </div>
              <h1 className="text-xl font-extrabold text-white">Daftar Pengguna Terdaftar</h1>
              <p className="text-xs text-gray-400">Direktori email pengguna dari pendaftaran OTP & telemetri instalasi</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchUsers}
              className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            <button
              onClick={copyEmailList}
              className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/[0.08] text-xs font-mono text-emerald-300 flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{copied ? "Daftar Email Tersalin!" : "Salin Semua Email"}</span>
            </button>

            <button
              onClick={exportCsv}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="tech-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Total User Leads</span>
              <p className="text-lg font-extrabold font-mono text-white">{users.length} User</p>
            </div>
          </div>

          <div className="tech-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Domain Notifikasi</span>
              <p className="text-sm font-bold font-mono text-cyan-300">otp@ksatriyo.id</p>
            </div>
          </div>

          <div className="tech-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Status Telemetri</span>
              <p className="text-sm font-bold font-mono text-emerald-400">AKTIF 🟢</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan alamat email atau nama..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl tech-input text-xs text-gray-100 font-mono"
          />
        </div>

        {/* Users Table */}
        <div className="tech-panel rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 font-sans">
              <thead className="bg-gray-950/80 border-b border-white/[0.08] font-mono text-[11px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Tanggal Terdaftar</th>
                  <th className="py-3 px-4 text-center">Jumlah Plan</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                      {loading ? "Memuat data pengguna..." : "Belum ada data pengguna terdaftar"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-300 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{u.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-medium">
                        {u.name || u.email.split("@")[0]}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-900 border border-white/[0.08] font-mono text-xs font-bold text-gray-200">
                          {u.planCount} Plan
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          VERIFIED 🟢
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
