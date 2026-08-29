// Rumus inti capaian OPERA INK — SATU tempat, jangan diduplikasi di
// komponen halaman (lihat CLAUDE.md § "Rumus inti" dan REFACTOR.md § 3
// "Ambang warna dari satu tempat", prinsip yang sama berlaku untuk bobot).
//
//   Aktifitas Utama       → Bobot Target = 70%      (tetap, satu per subkegiatan)
//   Aktifitas Pendukung   → Bobot Target = 30% ÷ jumlah aktifitas pendukung aktif
//   Bobot Realisasi       = (Realisasi ÷ Target) × Bobot Target
//   Capaian Subkegiatan   = Σ bobot realisasi utama + Σ bobot realisasi pendukung  (maks 100%)

export const BOBOT_TARGET_UTAMA = 70

/** 30% dibagi rata ke n aktifitas pendukung yang sedang aktif. */
export function bobotTargetPendukung(jumlahPendukungAktif: number): number {
  if (jumlahPendukungAktif <= 0) return 0
  return 30 / jumlahPendukungAktif
}

/** (realisasi / target) × bobotTarget. Tidak di-clamp per aktifitas —
 * pembatasan maks 100% hanya berlaku di tingkat subkegiatan (lihat
 * capaianSubkegiatan), supaya satu aktifitas yang melebihi target tidak
 * kehilangan datanya sebelum dijumlah. */
export function bobotRealisasi(
  realisasi: number,
  target: number,
  bobotTarget: number
): number {
  if (!target) return 0
  return (realisasi / target) * bobotTarget
}

/** Σ bobot realisasi utama + pendukung, dibatasi maksimum 100%. */
export function capaianSubkegiatan(bobotRealisasiList: number[]): number {
  const total = bobotRealisasiList.reduce((a, b) => a + b, 0)
  return Math.min(total, 100)
}
