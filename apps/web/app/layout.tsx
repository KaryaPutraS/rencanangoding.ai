import "./globals.css";
import type { Metadata } from "next";

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
    <html lang="id" className="dark">
      <body className="min-h-screen text-gray-100 flex flex-col antialiased">
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
