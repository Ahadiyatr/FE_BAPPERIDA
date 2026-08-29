// ⚠️ BERKAS HASIL GENERATE — jangan edit manual.
// Sumber: "Operasional Indikator Kinerja BAPPERIDA.xlsx" (sheet "OPERA INK").
// Regenerasi: python3 scripts/seed_from_xlsx.py

import type { Program } from "@/services/types"
import { DOKUMEN_PROGRAM_AWAL } from "./dokumen"

export const programs: Program[] = [
  { id: 1, dokumenId: DOKUMEN_PROGRAM_AWAL, urusanId: 1, kodeProgram: "5.1.2", namaProgram: "PROGRAM PERENCANAAN, PENGENDALIAN DAN EVALUASI PEMBANGUNAN DAERAH", flagActive: true },
  { id: 2, dokumenId: DOKUMEN_PROGRAM_AWAL, urusanId: 1, kodeProgram: "5.1.3", namaProgram: "PROGRAM KOORDINASI DAN SINKRONISASI PERENCANAAN PEMBANGUNAN DAERAH", flagActive: true },
  { id: 3, dokumenId: DOKUMEN_PROGRAM_AWAL, urusanId: 1, kodeProgram: "5.1.1", namaProgram: "PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH KABUPATEN/KOTA", flagActive: true },
  { id: 4, dokumenId: DOKUMEN_PROGRAM_AWAL, urusanId: 2, kodeProgram: "5.5.2", namaProgram: "PROGRAM PENELITIAN DAN PENGEMBANGAN DAERAH", flagActive: true },
  { id: 5, dokumenId: DOKUMEN_PROGRAM_AWAL, urusanId: 2, kodeProgram: "5.5.3", namaProgram: "PROGRAM RISET DAN INOVASI DAERAH", flagActive: true },
]
