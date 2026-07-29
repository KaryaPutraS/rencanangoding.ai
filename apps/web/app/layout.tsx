import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
  title: "RencanaNgoding.ai — Dari ide jadi rencana yang siap dikerjakan AI agent kamu",
  description: "Platform open-source yang mengubah ide aplikasi menjadi Struktur fitur → PRD → Task breakdown → eksekusi otomatis via CLI + AI coding agent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark overflow-x-hidden">
      <body className="min-h-screen text-gray-100 flex flex-col antialiased overflow-x-hidden max-w-full">
        <AuthProvider>
          <div className="flex-1 max-w-full overflow-x-hidden">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
