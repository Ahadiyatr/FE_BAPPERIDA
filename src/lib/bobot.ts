
export const BOBOT_TARGET_UTAMA = 70

export function bobotTargetPendukung(jumlahPendukungAktif: number): number {
  if (jumlahPendukungAktif <= 0) return 0
  return 30 / jumlahPendukungAktif
}

export function bobotRealisasi(
  realisasi: number,
  target: number,
  bobotTarget: number
): number {
  if (!target) return 0
  return (realisasi / target) * bobotTarget
}

export function capaianSubkegiatan(bobotRealisasiList: number[]): number {
  const total = bobotRealisasiList.reduce((a, b) => a + b, 0)
  return Math.min(total, 100)
}
