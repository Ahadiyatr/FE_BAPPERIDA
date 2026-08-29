// MASTER_PERIODE — 4 triwulan contoh. Hanya satu boleh OPEN (lihat
// aturan indeks di docs/erd.md). TW III 2026 dijadikan OPEN karena
// tanggal berjalan sesi ini (2026-08-28) jatuh di dalamnya — supaya
// demo "periode aktif" konsisten dengan tanggal hari ini.
import type { Periode } from "@/services/types"
import { DOKUMEN_PERIODE_AWAL } from "./dokumen"

export const periodes: Periode[] = [
  {
    id: 1,
    dokumenId: DOKUMEN_PERIODE_AWAL,
    namaPeriode: "Triwulan I 2026",
    tanggalMulai: "2026-01-01",
    tanggalSelesai: "2026-03-31",
    status: "LOCKED",
  },
  {
    id: 2,
    dokumenId: DOKUMEN_PERIODE_AWAL,
    namaPeriode: "Triwulan II 2026",
    tanggalMulai: "2026-04-01",
    tanggalSelesai: "2026-06-30",
    status: "LOCKED",
  },
  {
    id: 3,
    dokumenId: DOKUMEN_PERIODE_AWAL,
    namaPeriode: "Triwulan III 2026",
    tanggalMulai: "2026-07-01",
    tanggalSelesai: "2026-09-30",
    status: "OPEN",
  },
  {
    id: 4,
    dokumenId: DOKUMEN_PERIODE_AWAL,
    namaPeriode: "Triwulan IV 2026",
    tanggalMulai: "2026-10-01",
    tanggalSelesai: "2026-12-31",
    status: "DRAFT",
  },
]

export const periodeAktif = (): Periode =>
  periodes.find((p) => p.status === "OPEN") ?? periodes[periodes.length - 1]
