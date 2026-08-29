// MASTER_BIDANG — 7 bidang sesuai CLAUDE.md (kolom K Excel sumber).
// Tidak ada kolom bobot: keputusan 29 Agu 2026 — bidang tidak memiliki bobot,
// capaian Perangkat Daerah = rata-rata langsung seluruh subkegiatan.
import type { Bidang } from "@/services/types"

export const bidangs: Bidang[] = [
  { id: 1, kode: "P2EPD", namaBidang: "P2EPD", flagActive: true },
  { id: 2, kode: "SEKRETARIAT", namaBidang: "Sekretariat", flagActive: true },
  { id: 3, kode: "PIK", namaBidang: "PIK", flagActive: true },
  { id: 4, kode: "RINOVA", namaBidang: "RINOVA", flagActive: true },
  { id: 5, kode: "SUBBAG_PERENCANAAN", namaBidang: "Subbag Perencanaan", flagActive: true },
  { id: 6, kode: "PPM", namaBidang: "PPM", flagActive: true },
  { id: 7, kode: "KEUANGAN", namaBidang: "Keuangan", flagActive: true },
]

export const bidangByKode = (kode: string): Bidang | undefined =>
  bidangs.find((b) => b.kode === kode)
