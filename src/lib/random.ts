// PRNG berbenih (mulberry32) — dipakai src/mocks/db.ts untuk membangkitkan
// realisasi contoh. Berbenih supaya KPI dashboard (Fase 3) tidak berubah
// tiap refresh, hanya kalau benihnya sengaja diganti.
export function mulberry32(seed: number) {
  let a = seed
  return function random(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Bilangan bulat acak dalam [min, max], inklusif. */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Ambil satu elemen acak dari array (mengasumsikan array tidak kosong). */
export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}
