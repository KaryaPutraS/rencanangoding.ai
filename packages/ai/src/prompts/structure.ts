import { z } from "zod";
import { generateStructuredWithUsage, type AiUsage } from "../generateStructured";
import type { FeatureNode, SubFeatureNode } from "@rencanangoding/shared";
import { getAiModel, type AiConfig } from "../providers";

export const FeatureStructureSchema = z.object({
  features: z
    .array(
      z.object({
        name: z.string().min(3),
        phase: z.number().int().min(1).max(4),
        status: z.enum(["direncanakan", "dikerjakan", "selesai"]).default("direncanakan"),
        subFeatures: z
          .array(
            z.object({
              name: z.string().min(3),
              description: z.string().min(20)
            })
          )
          .min(2)
      })
    )
    .min(2)
});

export interface FeatureStructureResult {
  features: FeatureNode[];
  /** "ai" when a real model produced the mind map, "fallback" when the offline template engine did. */
  source: "ai" | "fallback";
  /** Reason the AI path was skipped or failed (only set when source === "fallback"). */
  fallbackReason?: string;
  /** Token usage of the model call, present only when source === "ai". */
  usage?: AiUsage;
}

function normalizeName(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Re-uses the ids of features/sub-features whose name is unchanged between two generations.
 * Without this every regeneration mints brand new UUIDs, which silently orphans every task
 * that points at a sub-feature (tasks reference sub-features by id).
 */
function reuseStableIds(features: FeatureNode[], existingFeatures?: FeatureNode[]): FeatureNode[] {
  if (!existingFeatures || existingFeatures.length === 0) return features;

  const featureIdByName = new Map<string, string>();
  const subIdByName = new Map<string, string>();

  for (const f of existingFeatures) {
    const fKey = normalizeName(f.name);
    if (fKey && !featureIdByName.has(fKey)) featureIdByName.set(fKey, f.id);
    for (const sf of f.subFeatures || []) {
      const sKey = normalizeName(sf.name);
      if (sKey && !subIdByName.has(sKey)) subIdByName.set(sKey, sf.id);
    }
  }

  const usedFeatureIds = new Set<string>();
  const usedSubIds = new Set<string>();

  return features.map((f) => {
    const fKey = normalizeName(f.name);
    const reusedFeatureId = featureIdByName.get(fKey);
    const featureId = reusedFeatureId && !usedFeatureIds.has(reusedFeatureId) ? reusedFeatureId : f.id;
    usedFeatureIds.add(featureId);

    return {
      ...f,
      id: featureId,
      subFeatures: (f.subFeatures || []).map((sf) => {
        const sKey = normalizeName(sf.name);
        const reusedSubId = subIdByName.get(sKey);
        const subId = reusedSubId && !usedSubIds.has(reusedSubId) ? reusedSubId : sf.id;
        usedSubIds.add(subId);
        return { ...sf, id: subId, featureId };
      })
    };
  });
}

/** Sorts phases ascending and renumbers orderIndex so the mind map always renders Fase 1 → 2 → 3. */
function normalizeOrdering(features: FeatureNode[]): FeatureNode[] {
  return [...features]
    .sort((a, b) => (a.phase || 1) - (b.phase || 1) || (a.orderIndex || 0) - (b.orderIndex || 0))
    .map((f, fIdx) => ({
      ...f,
      orderIndex: fIdx + 1,
      subFeatures: (f.subFeatures || []).map((sf, sfIdx) => ({ ...sf, orderIndex: sfIdx + 1 }))
    }));
}

export async function generateFeatureStructure(
  idea: string,
  answersSummary: string,
  language: string = "id",
  config?: AiConfig,
  revisionPrompt?: string,
  existingFeatures?: FeatureNode[]
): Promise<FeatureStructureResult> {
  const modelInfo = getAiModel(config);
  const isIndo = language === "id";

  if (modelInfo.type !== "mock" && modelInfo.model) {
    try {
      const existingSummary =
        existingFeatures && existingFeatures.length > 0
          ? JSON.stringify(
              existingFeatures.map((f) => ({
                phase: f.phase,
                name: f.name,
                subFeatures: (f.subFeatures || []).map((sf) => ({ name: sf.name, description: sf.description }))
              })),
              null,
              2
            )
          : "";

      const systemPrompt = `Anda adalah Principal Software Architect & Enterprise Systems Engineer kelas dunia.
Tugas Anda adalah menguraikan ide aplikasi user dan 5 Jawaban Discovery Question menjadi mind map struktur fitur perangkat lunak yang 100% AKURAT, PRESISI, dan TAILOR-MADE untuk ide tersebut (TIDAK BOLEH tertukar domain!).

### PROTOKOL VERIFIKASI 3-TAHAP (3-STAGE ARCHITECTURAL VERIFICATION PIPELINE):

#### TAHAP 1 — ANALISIS EKSTRAKSI DOMAIN & KEBUTUHAN UTAMA (DOMAIN EXTRACTION)
- Baca & ekstrak domain utama dari Ide User + 5 Jawaban Discovery (Misal: POS Kasir, E-Commerce, LMS Sekolah, Klinik Kesehatan, Logistik/Fleet, Rental Mobil, CRM Sales, SaaS AI Agent, Laundry, Keuangan/Akuntansi, dll).
- Ekstrak seluruh integrasi spesifik yang disebutkan user (misal: WAHA WhatsApp API, Midtrans/Xendit Payment, Google Maps Geofencing, Firebase, OpenAI API, Audit Logs).

#### TAHAP 2 — SINTESIS STRUKTUR ENTERPRISE BERFASE (MULTI-PHASE SYNTHESIS)
- Susun Mind Map dalam 3-4 Fase yang logis dan aksi-orientatif:
  - **Fase 1: MVP Core Architecture & Fitur Inti Domain** (Auth/RBAC, Transaksi/Workflow Utama Domain, Data Master, Dashboard Workstation).
  - **Fase 2: Integrasi Sistem, Notifikasi & Otomatisasi Workflow** (API Pihak Ke-3 seperti WAHA/Payment Gateway, Queue Worker, Notifikasi, Export PDF/Excel).
  - **Fase 3: Analytics Lanjutan, Synchronisasi Realtime & Keamanan** (Dashboard Executive Analytics, Realtime Sync, Audit Logs, Laporan Keuangan/Operasional).
- Nomor "phase" WAJIB terisi sesuai fasenya (1, 2, atau 3) dan setiap fase hanya boleh muncul pada fitur yang relevan.

#### TAHAP 3 — VERIFIKASI ANTI-KONTAMINASI SILANG (CROSS-DOMAIN ANTI-CONTAMINATION VERIFICATION)
- **Cek Anti-Kontaminasi**: Pastikan TIDAK ADA node/fitur dari domain lain yang bocor (misal: JANGAN menyertakan fitur absensi pada POS Kasir; JANGAN menyertakan fitur kasir toko pada LMS Sekolah; JANGAN menyertakan fitur rekam medis pada Laundry).
- **Cek Kelengkapan 5 Jawaban Discovery**: Pastikan semua poin spesifik dari 5 jawaban discovery yang diisi user tercermin secara jelas pada nama/deskripsi sub-fitur. Abaikan jawaban yang ditandai "Dilewati".
- **Setiap Sub-Fitur WAJIB**: Memiliki deskripsi 2-3 kalimat komprehensif yang menjelaskan APA fungsinya, BAGAIMANA alurnya, dan MANFAAT teknisnya.

### FORMAT OUTPUT
- Setiap fase memiliki 3-5 fitur utama, dan tiap fitur utama memiliki 3-6 sub-fitur.
- Seluruh nama & deskripsi ditulis dalam ${isIndo ? "Bahasa Indonesia" : "English"}.`;

      const revisionBlock = revisionPrompt
        ? `

⚠️ INSTRUKSI REVISI SPESIFIK DARI USER:
"${revisionPrompt}"

${
  existingSummary
    ? `STRUKTUR FITUR MIND MAP SAAT INI (EXISTING FEATURES):
${existingSummary}

ATURAN REVISI PENTING:
- Jika instruksi meminta MENGHAPUS / MENGHILANGKAN modul, hapus seluruh fitur terkait dari mind map akhir dan gantikan dengan modul domain yang relevan.
- Jika instruksi meminta MENAMBAH modul, tambahkan pada fase yang paling tepat tanpa membuang fitur lain yang masih relevan.
- PERTAHANKAN nama fitur & sub-fitur yang tidak terkena instruksi revisi PERSIS SAMA (jangan diubah/di-rename) supaya task yang sudah dikerjakan tetap tertaut.
- Kembalikan seluruh struktur mind map yang SUDAH DIREVISI LENGKAP dengan pembagian Fase 1, Fase 2, Fase 3 yang rapi.`
    : "Lakukan revisi (tambah/hapus/ubah) struktur fitur sesuai instruksi, dan kembalikan struktur mind map lengkap."
}`
        : "";

      const userPrompt = `DOKUMEN INPUT UNTUK DIANALISIS:
- Ide Utama Aplikasi: "${idea}"
- Hasil Discovery & Jawaban 5 Pertanyaan User: "${answersSummary || "Tidak ada konteks tambahan"}"
- Bahasa Output: ${isIndo ? "Bahasa Indonesia" : "English"}${revisionBlock}

Jalankan Protokol Verifikasi 3-Tahap dan susunlah struktur fitur (features & subFeatures) dengan akurasi domain 100%.`;

      const { object, usage } = await generateStructuredWithUsage({
        model: modelInfo.model as any,
        schema: FeatureStructureSchema,
        system: systemPrompt,
        prompt: userPrompt
      });

      if (object?.features && object.features.length > 0) {
        const mapped: FeatureNode[] = object.features.map((f, fIdx) => {
          const featureId = crypto.randomUUID();
          return {
            id: featureId,
            planId: "",
            name: f.name,
            phase: f.phase,
            status: f.status as "direncanakan" | "dikerjakan" | "selesai",
            orderIndex: fIdx + 1,
            subFeatures: f.subFeatures.map((sf, sfIdx) => ({
              id: crypto.randomUUID(),
              featureId,
              name: sf.name,
              description: sf.description,
              orderIndex: sfIdx + 1
            }))
          };
        });

        return {
          features: normalizeOrdering(reuseStableIds(mapped, existingFeatures)),
          source: "ai",
          usage
        };
      }

      return {
        features: normalizeOrdering(
          reuseStableIds(buildFallbackStructure(idea, answersSummary, revisionPrompt, isIndo), existingFeatures)
        ),
        source: "fallback",
        fallbackReason: "AI mengembalikan struktur kosong"
      };
    } catch (err: any) {
      console.error("AI generation error for feature structure, engaging universal multi-domain fallback engine:", err);
      return {
        features: normalizeOrdering(
          reuseStableIds(buildFallbackStructure(idea, answersSummary, revisionPrompt, isIndo), existingFeatures)
        ),
        source: "fallback",
        fallbackReason: err?.message || "AI provider gagal merespon"
      };
    }
  }

  return {
    features: normalizeOrdering(
      reuseStableIds(buildFallbackStructure(idea, answersSummary, revisionPrompt, isIndo), existingFeatures)
    ),
    source: "fallback",
    fallbackReason: "Belum ada API key AI yang aktif (mode template offline)"
  };
}

// ---------------------------------------------------------------------------
// Universal Multi-Domain Fallback Engine (offline template, no AI key needed)
// ---------------------------------------------------------------------------

type Bilingual = { id: string; en: string };
type SubTemplate = { name: Bilingual; description: Bilingual };

interface DomainTemplate {
  key: string;
  matches: (text: string) => boolean;
  corePhaseName: Bilingual;
  analyticsPhaseName: Bilingual;
  core: SubTemplate[];
  analytics: SubTemplate[];
}

const DOMAIN_TEMPLATES: DomainTemplate[] = [
  {
    key: "absensi",
    matches: (t) =>
      /\b(absen|absensi|kehadiran|presensi|clock-?in|jam kerja|payroll|penggajian)\b/.test(t) && !/\b(kasir|point of sale)\b/.test(t),
    corePhaseName: {
      id: "Fase 1 — Core Architecture & Fitur Absensi Real-time",
      en: "Phase 1 — Core Attendance & Real-time Check-in"
    },
    analyticsPhaseName: {
      id: "Fase 3 — Analytics Dashboard & Laporan Kehadiran",
      en: "Phase 3 — Attendance Analytics & Report Studio"
    },
    core: [
      {
        name: {
          id: "Sistem Otentikasi, Profil Karyawan & Hak Akses Admin",
          en: "User Auth, Employee Profiles & Admin RBAC"
        },
        description: {
          id: "Otentikasi terenkripsi, manajemen data karyawan, pemetaan divisi, serta aturan shift jam masuk/pulang. Admin dapat mengatur peran akses tiap pengguna secara granular.",
          en: "Encrypted authentication, employee profile management, division mapping, and shift schedule rules with granular role-based access control."
        }
      },
      {
        name: {
          id: "Form Presensi Kehadiran (Check-in/Out, QR Code & Validasi GPS)",
          en: "Attendance Check-in/Out (QR Code & GPS Geofencing)"
        },
        description: {
          id: "Antarmuka presensi karyawan secara realtime dilengkapi tombol absen cepat, verifikasi posisi lokasi GPS, dan foto bukti kehadiran. Setiap event tercatat dengan timestamp server.",
          en: "Realtime attendance portal featuring quick check-in buttons, GPS geofencing verification, and selfie proof upload with server-side timestamps."
        }
      },
      {
        name: {
          id: "Manajemen Shift, Jadwal Kerja & Pengajuan Izin/Cuti",
          en: "Shift Scheduling & Leave Request Management"
        },
        description: {
          id: "Penyusunan jadwal shift per divisi, kalender kerja, serta form pengajuan izin/sakit/cuti dengan alur persetujuan atasan. Status pengajuan terlihat realtime oleh karyawan.",
          en: "Shift roster planning per division, work calendar, and leave/sick request forms with a supervisor approval workflow visible in realtime."
        }
      }
    ],
    analytics: [
      {
        name: {
          id: "Dashboard Analytics Monitor Kehadiran & Export Laporan PDF/Excel",
          en: "Attendance Monitor Dashboard & PDF/Excel Export Studio"
        },
        description: {
          id: "Visualisasi grafik statistik rasio kedisiplinan, kalkulasi jam kerja lembur, dan fitur unduh laporan rekapitulasi bulanan siap cetak.",
          en: "Visual dashboard charting punctuality ratios, overtime hour calculation, and one-click monthly recap export."
        }
      },
      {
        name: { id: "Audit Trail Log & Keamanan Data Kehadiran", en: "Audit Trail Logging & Attendance Data Security" },
        description: {
          id: "Pencatatan seluruh perubahan data absensi beserta pelakunya, proteksi anti-manipulasi jam, dan retensi log untuk keperluan audit HR.",
          en: "Immutable logging of every attendance data change, anti-tampering protection, and log retention for HR audits."
        }
      }
    ]
  },
  {
    key: "lms",
    matches: (t) => /\b(sekolah|siswa|murid|lms|kursus|ujian|guru|akademik|e-?learning|bimbel|les)\b/.test(t),
    corePhaseName: {
      id: "Fase 1 — Core LMS Portal Siswa, Guru & Manajemen Kelas",
      en: "Phase 1 — Core LMS Student Portal & Class Management"
    },
    analyticsPhaseName: {
      id: "Fase 3 — Analytics Akademik & Rapor Digital PDF",
      en: "Phase 3 — Academic Analytics & Digital Report Card"
    },
    core: [
      {
        name: { id: "Portal Pembelajaran Siswa & Ruang Kelas Digital", en: "Student Learning Portal & Digital Classroom" },
        description: {
          id: "Antarmuka siswa untuk mengakses materi pelajaran, video interaktif, jadwal akademik, dan daftar tugas sekolah beserta pengumpulan tugas online.",
          en: "Student dashboard for accessing course materials, interactive video lessons, academic schedules, and homework submissions."
        }
      },
      {
        name: { id: "Manajemen Kurikulum, Bank Soal & Modul Ujian Online", en: "Curriculum Management & Online Exam Engine" },
        description: {
          id: "Pengelolaan materi pembelajaran per mata pelajaran, penyusunan bank soal pilihan ganda/essay, serta pelaksanaan ujian online dengan penilaian otomatis.",
          en: "Course syllabus builder, question bank repository, and online examination engine with automated grading."
        }
      },
      {
        name: { id: "Data Master Siswa, Guru, Kelas & Presensi Kelas", en: "Student, Teacher, Class Master Data & Class Attendance" },
        description: {
          id: "Pendataan siswa, guru, rombongan belajar, dan pencatatan kehadiran per sesi kelas sebagai dasar seluruh laporan akademik.",
          en: "Master records for students, teachers, and classes plus per-session attendance capture feeding all academic reports."
        }
      }
    ],
    analytics: [
      {
        name: { id: "Dashboard Analytics Progress Nilai & Keaktifan Belajar", en: "Student Progress & Learning Analytics Dashboard" },
        description: {
          id: "Visualisasi grafik perkembangan akademik siswa, analisis ketuntasan belajar, dan pemetaan rangking kelas per periode.",
          en: "Visual dashboard tracking academic trends, grade averages, assignment completion rates, and class rankings."
        }
      },
      {
        name: { id: "Cetak Rapor Digital PDF & Export Data Pokok Pendidikan", en: "Digital Report Card PDF Generation & Data Export" },
        description: {
          id: "Penilaian akhir semester otomatis, generasi file Rapor Digital PDF dengan QR tanda tangan digital, serta export data pokok pendidikan.",
          en: "End-of-semester automatic grading, PDF report card generation with digital signature QR, and education data export."
        }
      }
    ]
  },
  {
    key: "klinik",
    matches: (t) => /\b(klinik|pasien|rekam medis|dokter|apotek|puskesmas|rumah sakit|emr)\b/.test(t),
    corePhaseName: {
      id: "Fase 1 — Core Sistem Rekam Medis (EMR) & Pendaftaran Pasien",
      en: "Phase 1 — Core EMR & Patient Registration System"
    },
    analyticsPhaseName: {
      id: "Fase 3 — Analytics Operasional & Laporan Keuangan Klinik",
      en: "Phase 3 — Clinic Operations Analytics & Financial Reports"
    },
    core: [
      {
        name: { id: "Pendaftaran Pasien, Antrean Klinik & Jadwal Praktik Dokter", en: "Patient Registration, Queue & Doctor Schedules" },
        description: {
          id: "Antarmuka resepsionis pendaftaran pasien baru/lama, sistem nomor antrean otomatis, dan manajemen jadwal praktik dokter per poli.",
          en: "Front-desk registration for new/returning patients, automated queue numbering, and doctor shift scheduling per department."
        }
      },
      {
        name: { id: "Modul Rekam Medis Elektronik (EMR) & Diagnosis Dokter", en: "Electronic Medical Record (EMR) & Diagnosis Engine" },
        description: {
          id: "Pencatatan riwayat medis pasien, keluhan fisik, kode diagnosis ICD-10, serta input resep obat dokter dalam satu lembar kerja.",
          en: "Digital patient chart, physical exam records, ICD-10 diagnosis coding, and electronic prescription entry in one workspace."
        }
      },
      {
        name: { id: "Kasir Farmasi, Dispensing Obat & Tracking Stok Obat", en: "Pharmacy Dispensing & Drug Inventory Tracking" },
        description: {
          id: "Pemrosesan resep dokter di kasir apotek, pengurangan stok obat otomatis, serta cetak etiket aturan pakai obat pasien.",
          en: "Pharmacy prescription fulfillment, automated drug stock deduction, and dosage label printing."
        }
      }
    ],
    analytics: [
      {
        name: { id: "Dashboard Analytics Kunjungan Pasien & Revenue Klinik", en: "Patient Visit Trends & Clinic Revenue Dashboard" },
        description: {
          id: "Visualisasi grafik statistik jumlah pasien harian, jenis penyakit terbanyak, dan grafik pendapatan klinik per periode.",
          en: "Executive dashboard for daily patient volume, top diagnoses, and clinic revenue streams."
        }
      },
      {
        name: { id: "Laporan Rekap Finansial & Export Laporan Medis (Excel/PDF)", en: "Financial Statements & Medical Report Export Studio" },
        description: {
          id: "Kalkulasi jasa medis dokter, rekap sirkulasi kasir klinik, dan export laporan operasional lengkap ke Excel/PDF.",
          en: "Doctor fee calculation, cashier shift balancing, and full operational report export to Excel/PDF."
        }
      }
    ]
  },
  {
    key: "laundry",
    matches: (t) => /\b(laundry|londri|cuci|kiloan|setrika|dry ?clean)\b/.test(t),
    corePhaseName: {
      id: "Fase 1 — Core Order Laundry, Tracking Cucian & Data Pelanggan",
      en: "Phase 1 — Core Laundry Orders, Garment Tracking & Customers"
    },
    analyticsPhaseName: {
      id: "Fase 3 — Analytics Omset Laundry & Laporan Operasional",
      en: "Phase 3 — Laundry Revenue Analytics & Operational Reports"
    },
    core: [
      {
        name: { id: "Form Order Laundry (Kiloan, Satuan & Layanan Express)", en: "Laundry Order Intake (Per-Kg, Per-Item & Express)" },
        description: {
          id: "Pencatatan order masuk dengan pilihan layanan kiloan/satuan/express, penimbangan berat, kalkulasi harga otomatis, dan cetak nota order.",
          en: "Order intake with per-kg/per-item/express service options, weighing, automatic price calculation, and order receipt printing."
        }
      },
      {
        name: { id: "Tracking Status Cucian & Papan Proses Produksi", en: "Garment Status Tracking & Production Board" },
        description: {
          id: "Pemantauan status cucian mulai dari diterima, dicuci, dikeringkan, disetrika, hingga siap diambil dengan papan proses per outlet.",
          en: "Status tracking from received → washing → drying → ironing → ready for pickup, on a per-outlet production board."
        }
      },
      {
        name: { id: "Data Master Pelanggan, Layanan, Tarif & Member", en: "Customer, Service, Pricing & Membership Master Data" },
        description: {
          id: "Manajemen data pelanggan berulang, daftar layanan beserta tarif per kilo/item, paket member, dan riwayat transaksi pelanggan.",
          en: "Recurring customer records, service catalogue with per-kg/item pricing, membership packages, and customer transaction history."
        }
      }
    ],
    analytics: [
      {
        name: { id: "Dashboard Analytics Omset & Layanan Terlaris", en: "Revenue & Top Services Analytics Dashboard" },
        description: {
          id: "Grafik pendapatan harian/bulanan, layanan paling laris, jam ramai penerimaan order, dan performa tiap outlet.",
          en: "Daily/monthly revenue charts, best-selling services, peak intake hours, and per-outlet performance."
        }
      },
      {
        name: { id: "Laporan Keuangan, Rekap Shift Kasir & Export PDF/Excel", en: "Financial Reports, Cashier Shift Recap & PDF/Excel Export" },
        description: {
          id: "Rekap kas masuk per shift, perhitungan margin keuntungan, biaya operasional, serta export laporan siap cetak.",
          en: "Per-shift cash recap, profit margin calculation, operational cost tracking, and printable report export."
        }
      }
    ]
  },
  {
    key: "logistik",
    matches: (t) => /\b(logistik|pengiriman|kurir|fleet|armada|ekspedisi|delivery|driver|rute)\b/.test(t),
    corePhaseName: {
      id: "Fase 1 — Core Manajemen Pengiriman, Armada & Tracking Order",
      en: "Phase 1 — Core Shipment, Fleet & Order Tracking"
    },
    analyticsPhaseName: {
      id: "Fase 3 — Analytics Performa Pengiriman & Laporan Biaya",
      en: "Phase 3 — Delivery Performance Analytics & Cost Reports"
    },
    core: [
      {
        name: { id: "Input Order Pengiriman & Manajemen Resi", en: "Shipment Order Intake & Waybill Management" },
        description: {
          id: "Pembuatan order kiriman lengkap dengan data pengirim/penerima, kalkulasi ongkir berdasarkan berat & zona, serta generasi nomor resi unik.",
          en: "Shipment creation with sender/receiver data, weight & zone based rate calculation, and unique waybill generation."
        }
      },
      {
        name: { id: "Manajemen Armada, Driver & Penugasan Rute", en: "Fleet, Driver & Route Assignment Management" },
        description: {
          id: "Pendataan kendaraan dan driver, penugasan order ke armada, serta penyusunan rute pengantaran harian per wilayah.",
          en: "Vehicle and driver records, order-to-fleet assignment, and daily delivery route planning per region."
        }
      },
      {
        name: { id: "Tracking Status Kiriman & Bukti Serah Terima (POD)", en: "Shipment Status Tracking & Proof of Delivery" },
        description: {
          id: "Pemantauan status kiriman realtime dari pickup sampai terkirim, dilengkapi upload foto dan tanda tangan bukti serah terima.",
          en: "Realtime shipment status from pickup to delivered, with photo upload and signature proof of delivery."
        }
      }
    ],
    analytics: [
      {
        name: { id: "Dashboard Analytics Performa Pengiriman & SLA", en: "Delivery Performance & SLA Analytics Dashboard" },
        description: {
          id: "Grafik ketepatan waktu pengiriman, rasio kiriman gagal/retur, produktivitas driver, dan pemetaan wilayah tersibuk.",
          en: "On-time delivery charts, failed/returned shipment ratios, driver productivity, and busiest region mapping."
        }
      },
      {
        name: { id: "Laporan Biaya Operasional Armada & Export PDF/Excel", en: "Fleet Operational Cost Reports & PDF/Excel Export" },
        description: {
          id: "Rekap biaya bahan bakar, perawatan armada, komisi driver, serta export laporan operasional untuk keperluan akuntansi.",
          en: "Fuel, maintenance, and driver commission cost recaps with operational report export for accounting."
        }
      }
    ]
  },
  {
    key: "ecommerce",
    matches: (t) => /\b(toko online|e-?commerce|marketplace|keranjang|checkout online|katalog online|dropship)\b/.test(t),
    corePhaseName: {
      id: "Fase 1 — Core Etalase Produk, Keranjang & Checkout Online",
      en: "Phase 1 — Core Storefront, Cart & Online Checkout"
    },
    analyticsPhaseName: {
      id: "Fase 3 — Analytics Penjualan Online & Laporan Toko",
      en: "Phase 3 — Online Sales Analytics & Store Reports"
    },
    core: [
      {
        name: { id: "Etalase Produk, Pencarian & Halaman Detail Produk", en: "Product Storefront, Search & Detail Pages" },
        description: {
          id: "Katalog produk dengan pencarian, filter kategori, galeri foto, varian ukuran/warna, dan halaman detail produk yang SEO friendly.",
          en: "Product catalogue with search, category filters, image gallery, size/colour variants, and SEO-friendly detail pages."
        }
      },
      {
        name: { id: "Keranjang Belanja, Checkout & Manajemen Pesanan", en: "Shopping Cart, Checkout & Order Management" },
        description: {
          id: "Alur keranjang belanja, pemilihan alamat & ongkir, ringkasan checkout, serta panel admin untuk memproses status pesanan.",
          en: "Cart flow, address & shipping selection, checkout summary, and an admin panel to process order statuses."
        }
      },
      {
        name: { id: "Manajemen Produk, Stok & Akun Pelanggan", en: "Product, Inventory & Customer Account Management" },
        description: {
          id: "CRUD produk beserta stok per varian, registrasi/login pelanggan, riwayat pesanan, dan wishlist pembeli.",
          en: "Product and per-variant stock CRUD, customer registration/login, order history, and wishlist."
        }
      }
    ],
    analytics: [
      {
        name: { id: "Dashboard Analytics Penjualan & Produk Terlaris", en: "Sales & Best-Seller Analytics Dashboard" },
        description: {
          id: "Grafik omset harian/bulanan, produk terlaris, rasio konversi keranjang ke pembayaran, dan nilai rata-rata transaksi.",
          en: "Daily/monthly revenue charts, best sellers, cart-to-payment conversion ratio, and average order value."
        }
      },
      {
        name: { id: "Laporan Keuangan Toko & Export PDF/Excel", en: "Store Financial Reports & PDF/Excel Export" },
        description: {
          id: "Rekap pendapatan, retur, ongkir, margin keuntungan bersih, serta export laporan penjualan siap audit.",
          en: "Revenue, returns, shipping fees, and net margin recaps with audit-ready sales report export."
        }
      }
    ]
  },
  {
    key: "pos",
    matches: (t) => /\b(kasir|pos|point of sale|struk|penjualan|toko|stok|minimarket|warung|retail)\b/.test(t),
    corePhaseName: {
      id: "Fase 1 — Core POS Kasir Touchscreen, Scan Barcode & Management Stok",
      en: "Phase 1 — Core POS Checkout, Barcode & Inventory Management"
    },
    analyticsPhaseName: {
      id: "Fase 3 — Analytics Penjualan & Laporan Keuangan Laba-Rugi",
      en: "Phase 3 — Sales Analytics & Profit/Loss Financial Reporting"
    },
    core: [
      {
        name: { id: "Antarmuka Meja Kasir Touchscreen & Tombol Produk Cepat", en: "Touchscreen Cashier POS Checkout UI" },
        description: {
          id: "Antarmuka kasir cepat dengan pencarian produk kilat, tombol kategori visual, kalkulasi diskon, dan manajemen keranjang belanja.",
          en: "Fast cashier checkout interface with rapid product search, visual category buttons, discount engine, and cart management."
        }
      },
      {
        name: { id: "Integrasi Scanner Barcode (Kamera & Hardware USB/Bluetooth)", en: "Barcode Scanner Integration (Camera & Hardware)" },
        description: {
          id: "Pembacaan barcode produk instan melalui scanner hardware maupun pemindaian langsung via kamera smartphone/webcam.",
          en: "Instant barcode scanning via USB/Bluetooth hardware scanners or smartphone/webcam camera vision."
        }
      },
      {
        name: { id: "Katalog Produk Multi-Varian & Tracking Stok Realtime", en: "Multi-Variant Product Catalog & Realtime Stock Tracking" },
        description: {
          id: "Manajemen data produk, variasi harga/ukuran, alert stok kritis otomatis saat transaksi kasir, dan histori mutasi barang.",
          en: "Product catalogue with variant pricing, automatic low-stock alerts during checkout, and stock movement history."
        }
      }
    ],
    analytics: [
      {
        name: { id: "Dashboard Analytics Omset & Ranking Produk Terlaris", en: "Sales Revenue Analytics & Top Products Chart" },
        description: {
          id: "Visualisasi grafik pendapatan harian/bulanan, heatmap jam paling ramai toko, dan ranking barang paling menguntungkan.",
          en: "Revenue trend charts, peak cashier hour heatmaps, and most profitable inventory ranking."
        }
      },
      {
        name: { id: "Laporan Laba-Rugi, Audit Shift Kasir & Export PDF/Excel", en: "Profit-Loss Reports, Cashier Shift Audit & PDF/Excel Export" },
        description: {
          id: "Pencatatan saldo kasir (cash drawer balancing), kalkulasi margin keuntungan bersih, serta cetak laporan keuangan.",
          en: "Cash drawer balancing, net profit margin calculation, and financial report printing."
        }
      }
    ]
  }
];

const GENERIC_TEMPLATE: DomainTemplate = {
  key: "generic",
  matches: () => true,
  corePhaseName: {
    id: "Fase 1 — Core Architecture, Auth & Workflow Utama Aplikasi",
    en: "Phase 1 — Core Architecture, Auth & Primary Workflow"
  },
  analyticsPhaseName: {
    id: "Fase 3 — Analytics Dashboard, Laporan & Keamanan",
    en: "Phase 3 — Analytics Dashboard, Reporting & Security"
  },
  core: [
    {
      name: { id: "Otentikasi Pengguna, Profil & Hak Akses (RBAC)", en: "User Authentication, Profiles & Role-Based Access" },
      description: {
        id: "Registrasi dan login pengguna dengan password terenkripsi, manajemen profil, serta pembagian hak akses per peran (admin/operator/pengguna).",
        en: "User registration and login with encrypted passwords, profile management, and role-based access control (admin/operator/user)."
      }
    },
    {
      name: { id: "Modul Workflow Utama & Data Master Aplikasi", en: "Primary Workflow Module & Master Data" },
      description: {
        id: "Implementasi alur kerja inti sesuai ide aplikasi beserta data master pendukungnya, mulai dari input, validasi, penyimpanan, hingga riwayat perubahan.",
        en: "Implementation of the core workflow described in the idea plus its supporting master data: input, validation, persistence, and change history."
      }
    },
    {
      name: { id: "Dashboard Operasional & Manajemen Data (CRUD)", en: "Operational Dashboard & Data Management (CRUD)" },
      description: {
        id: "Halaman kerja utama berisi ringkasan data, tabel dengan pencarian & filter, serta operasi tambah/ubah/hapus data yang aman.",
        en: "Main workspace with data summaries, searchable and filterable tables, and safe create/update/delete operations."
      }
    }
  ],
  analytics: [
    {
      name: { id: "Dashboard Analytics & Visualisasi Data Utama", en: "Analytics Dashboard & Key Metric Visualisation" },
      description: {
        id: "Visualisasi metrik utama aplikasi dalam bentuk grafik tren, ringkasan periode, dan pemantauan aktivitas pengguna.",
        en: "Visualisation of the app's key metrics as trend charts, period summaries, and user activity monitoring."
      }
    },
    {
      name: { id: "Export Laporan PDF/Excel & Audit Trail Log", en: "PDF/Excel Report Export & Audit Trail Logging" },
      description: {
        id: "Pembuatan laporan siap cetak dalam format PDF/Excel serta pencatatan audit log setiap perubahan data penting.",
        en: "Printable PDF/Excel report generation plus audit logging of every important data change."
      }
    }
  ]
};

/** Integration sub-features for Phase 2, activated only when the idea/answers mention them. */
const INTEGRATION_TEMPLATES: { matches: (t: string) => boolean; template: SubTemplate }[] = [
  {
    matches: (t) => /\b(waha|whatsapp|wa gateway|wa blast)\b/.test(t),
    template: {
      name: { id: "Gateway WhatsApp WAHA (Notifikasi & Pesan Otomatis)", en: "WAHA WhatsApp Gateway (Automated Notifications)" },
      description: {
        id: "Integrasi ke WAHA WhatsApp HTTP API untuk mengirim notifikasi, konfirmasi, dan dokumen otomatis ke nomor WhatsApp pengguna.",
        en: "Integration with the WAHA WhatsApp HTTP API to send notifications, confirmations, and documents to user WhatsApp numbers."
      }
    }
  },
  {
    matches: (t) => /\b(midtrans|xendit|qris|payment|pembayaran|stripe|virtual account|va bank)\b/.test(t),
    template: {
      name: { id: "Payment Gateway (QRIS / Virtual Account / Kartu)", en: "Payment Gateway (QRIS / Virtual Account / Card)" },
      description: {
        id: "Integrasi payment gateway untuk pembayaran cashless, generasi QRIS dinamis atau virtual account, dan rekonsiliasi otomatis lewat webhook.",
        en: "Payment gateway integration for cashless payments, dynamic QRIS or virtual account generation, and automatic webhook reconciliation."
      }
    }
  },
  {
    matches: (t) => /\b(maps|gps|geofenc|lokasi|koordinat|tracking lokasi)\b/.test(t),
    template: {
      name: { id: "Integrasi Peta & Validasi Lokasi (Maps/Geofencing)", en: "Maps Integration & Location Validation (Geofencing)" },
      description: {
        id: "Integrasi layanan peta untuk menampilkan titik lokasi, menghitung jarak/radius, dan memvalidasi posisi pengguna saat transaksi.",
        en: "Map service integration to render location pins, compute distance/radius, and validate user position during a transaction."
      }
    }
  },
  {
    matches: (t) => /\b(openai|anthropic|llm|ai model|chatbot|gemini|deepseek)\b/.test(t),
    template: {
      name: { id: "Integrasi AI/LLM (Asisten Cerdas & Otomasi Konten)", en: "AI/LLM Integration (Smart Assistant & Content Automation)" },
      description: {
        id: "Penyambungan ke penyedia LLM untuk fitur asisten cerdas, ringkasan otomatis, atau rekomendasi kontekstual di dalam aplikasi.",
        en: "Connection to an LLM provider for smart assistant features, automatic summaries, or contextual recommendations."
      }
    }
  },
  {
    matches: (t) => /\b(email|smtp|newsletter|mailer)\b/.test(t),
    template: {
      name: { id: "Notifikasi Email Transaksional & Template Pesan", en: "Transactional Email Notifications & Templates" },
      description: {
        id: "Pengiriman email transaksional (verifikasi, invoice, pengingat) menggunakan template yang dapat dikelola dari panel admin.",
        en: "Transactional email delivery (verification, invoice, reminders) using admin-managed templates."
      }
    }
  },
  {
    matches: (t) => /\b(upload|storage|s3|foto|dokumen|file)\b/.test(t),
    template: {
      name: { id: "Manajemen Upload File & Penyimpanan Dokumen", en: "File Upload & Document Storage Management" },
      description: {
        id: "Fitur unggah berkas/foto dengan validasi tipe & ukuran, penyimpanan aman, serta pratinjau dokumen di dalam aplikasi.",
        en: "File/photo upload with type and size validation, secure storage, and in-app document preview."
      }
    }
  }
];

const DEFAULT_INTEGRATIONS: SubTemplate[] = [
  {
    name: { id: "Engine Notifikasi & Antrean Proses Latar Belakang", en: "Notification Engine & Background Job Queue" },
    description: {
      id: "Sistem notifikasi in-app beserta antrean pekerjaan latar belakang untuk pengiriman pesan dan proses berat secara asinkron.",
      en: "In-app notification system plus a background job queue for asynchronous messaging and heavy processing."
    }
  },
  {
    name: { id: "Export Data & Cetak Dokumen PDF/Excel", en: "Data Export & PDF/Excel Document Printing" },
    description: {
      id: "Pembuatan berkas PDF/Excel dari data aplikasi lengkap dengan template cetak yang rapi dan dapat diunduh pengguna.",
      en: "PDF/Excel generation from application data with tidy printable templates available for download."
    }
  }
];

function pick(text: Bilingual, isIndo: boolean): string {
  return isIndo ? text.id : text.en;
}

function makeSub(t: SubTemplate, featureId: string, isIndo: boolean, orderIndex: number): SubFeatureNode {
  return {
    id: crypto.randomUUID(),
    featureId,
    name: pick(t.name, isIndo),
    description: pick(t.description, isIndo),
    orderIndex
  };
}

/**
 * Applies simple add/remove instructions to the offline structure so the "Revisi AI"
 * chat is not a no-op when no AI provider is configured.
 */
function applyOfflineRevision(features: FeatureNode[], revisionPrompt: string | undefined, isIndo: boolean): FeatureNode[] {
  if (!revisionPrompt || !revisionPrompt.trim()) return features;

  const instructions = revisionPrompt
    .split(/;|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  let result = features;

  for (const instruction of instructions) {
    const lower = instruction.toLowerCase();
    const removeMatch = lower.match(/(?:hapus|hilangkan|buang|remove|delete)\s+(?:modul\s+|fitur\s+)?(.+)/);
    const addMatch = lower.match(/(?:tambah(?:kan)?|add)\s+(?:modul\s+|fitur\s+)?(.+)/);

    if (removeMatch) {
      const keyword = normalizeName(removeMatch[1]).split(" ").filter((w) => w.length > 3);
      if (keyword.length > 0) {
        result = result.map((f) => ({
          ...f,
          subFeatures: (f.subFeatures || []).filter((sf) => {
            const haystack = normalizeName(`${sf.name} ${sf.description}`);
            return !keyword.some((k) => haystack.includes(k));
          })
        }));
      }
    } else if (addMatch) {
      const label = instruction.replace(/^\s*(tambah(?:kan)?|add)\s+(modul\s+|fitur\s+)?/i, "").trim();
      if (label) {
        // Integrations belong to Phase 2; fall back to the last phase when it is missing.
        const target = result.find((f) => f.phase === 2) || result[result.length - 1];
        if (target) {
          target.subFeatures = [
            ...(target.subFeatures || []),
            {
              id: crypto.randomUUID(),
              featureId: target.id,
              name: label.slice(0, 90),
              description: isIndo
                ? `Modul tambahan yang diminta user pada sesi revisi mind map: ${label}. Cakupan, alur, dan integrasinya akan dirinci lebih lanjut pada dokumen PRD.`
                : `Additional module requested by the user during mind map revision: ${label}. Scope, flow, and integrations are detailed further in the PRD.`,
              orderIndex: (target.subFeatures || []).length + 1
            }
          ];
        }
      }
    }
  }

  // Never return an empty phase — that would render a dangling node in the mind map.
  return result.filter((f) => (f.subFeatures || []).length > 0);
}

export function buildFallbackStructure(
  idea: string,
  answersSummary: string,
  revisionPrompt: string | undefined,
  isIndo: boolean
): FeatureNode[] {
  const fullText = `${idea} ${answersSummary || ""} ${revisionPrompt || ""}`.toLowerCase();
  const domain = DOMAIN_TEMPLATES.find((d) => d.matches(fullText)) || GENERIC_TEMPLATE;

  const detectedIntegrations = INTEGRATION_TEMPLATES.filter((i) => i.matches(fullText)).map((i) => i.template);
  const integrations = detectedIntegrations.length > 0 ? detectedIntegrations : DEFAULT_INTEGRATIONS;

  const f1Id = crypto.randomUUID();
  const f2Id = crypto.randomUUID();
  const f3Id = crypto.randomUUID();

  const features: FeatureNode[] = [
    {
      id: f1Id,
      planId: "",
      name: pick(domain.corePhaseName, isIndo),
      phase: 1,
      status: "direncanakan",
      orderIndex: 1,
      subFeatures: domain.core.map((t, idx) => makeSub(t, f1Id, isIndo, idx + 1))
    },
    {
      id: f2Id,
      planId: "",
      name: isIndo
        ? "Fase 2 — Integrasi Sistem, Notifikasi & Otomatisasi Workflow"
        : "Phase 2 — System Integrations, Notifications & Workflow Automation",
      phase: 2,
      status: "direncanakan",
      orderIndex: 2,
      subFeatures: integrations.map((t, idx) => makeSub(t, f2Id, isIndo, idx + 1))
    },
    {
      id: f3Id,
      planId: "",
      name: pick(domain.analyticsPhaseName, isIndo),
      phase: 3,
      status: "direncanakan",
      orderIndex: 3,
      subFeatures: domain.analytics.map((t, idx) => makeSub(t, f3Id, isIndo, idx + 1))
    }
  ];

  return applyOfflineRevision(features, revisionPrompt, isIndo);
}
