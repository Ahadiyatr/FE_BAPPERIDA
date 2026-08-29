// MASTER_DOKUMEN — dokumen perencanaan.
//
// TIDAK diambil dari Excel: berkas sumber tidak memuat konsep dokumen sama
// sekali. Isi di bawah adalah benih yang masuk akal, bukan data sungguhan —
// ganti dengan dokumen BAPPERIDA yang asli sebelum dipakai serius.
//
// RPJMD 2020–2024 sengaja disertakan tanpa program: ia membuktikan aturan
// "kode program unik per dokumen" bisa diuji, dan memberi tempat berpijak
// kalau nanti pewarisan program antar dokumen jadi dikerjakan (PRD §7.5).
import type { Dokumen } from "@/services/types"

export const dokumens: Dokumen[] = [
  { id: 1, kode: "RPJMD-2025-2029", nama: "RPJMD 2025–2029", jenis: "RPJMD",
    indukId: null, tahunMulai: 2025, tahunSelesai: 2029, status: "AKTIF", flagActive: true },
  { id: 2, kode: "RKPD-2025", nama: "RKPD 2025", jenis: "RKPD",
    indukId: 1, tahunMulai: 2025, tahunSelesai: 2025, status: "ARSIP", flagActive: true },
  { id: 3, kode: "RKPD-2026", nama: "RKPD 2026", jenis: "RKPD",
    indukId: 1, tahunMulai: 2026, tahunSelesai: 2026, status: "AKTIF", flagActive: true },
  { id: 4, kode: "RKPD-2027", nama: "RKPD 2027", jenis: "RKPD",
    indukId: 1, tahunMulai: 2027, tahunSelesai: 2027, status: "DRAFT", flagActive: true },
  { id: 5, kode: "RPJMD-2020-2024", nama: "RPJMD 2020–2024", jenis: "RPJMD",
    indukId: null, tahunMulai: 2020, tahunSelesai: 2024, status: "ARSIP", flagActive: true },
]

/** Dokumen tempat seluruh program benih bernaung. */
export const DOKUMEN_PROGRAM_AWAL = 1
/** RKPD yang menaungi keempat periode triwulan 2026. */
export const DOKUMEN_PERIODE_AWAL = 3
