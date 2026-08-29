// ⚠️ BERKAS HASIL GENERATE — jangan edit manual.
// Sumber: "Operasional Indikator Kinerja BAPPERIDA.xlsx" (sheet "OPERA INK").
// Regenerasi: python3 scripts/seed_from_xlsx.py

// MASTER_URUSAN — tingkat di atas program (Excel: label "KINERJA URUSAN").
// Belum ada di docs/erd.md; dipakai sebagai pengelompokan di layar
// Capaian Program. Capaian per urusan BELUM punya rumus — lihat
// docs/keputusan-terbuka.md butir 2.

import type { Urusan } from "@/services/types"

export const urusans: Urusan[] = [
  { id: 1, kodeUrusan: "5.1", namaUrusan: "PERENCANAAN" },
  { id: 2, kodeUrusan: "5.5", namaUrusan: "PENELITIAN DAN PENGEMBANGAN" },
]
