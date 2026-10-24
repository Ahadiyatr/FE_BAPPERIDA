import * as React from "react"

export const PILIHAN_UKURAN = [10, 25, 50, 100] as const

export interface Paginasi<T> {
  halaman: number
  ukuran: number
  totalHalaman: number
  total: number
  /** Nomor baris pertama dan terakhir yang tampil, berbasis 1; 0 bila kosong. */
  dari: number
  sampai: number
  potongan: T[]
  setHalaman: (halaman: number) => void
  setUkuran: (ukuran: number) => void
}

/* Pagination sisi klien: layar daftar OPERA sudah memuat seluruh barisnya,
   jadi cukup dipotong di sini.

   Halaman kembali ke 1 hanya saat `kunciReset` berubah (cari, saringan, tab) —
   bukan saat data dimuat ulang, supaya pengguna yang baru menyunting baris di
   halaman 3 tidak dilempar ke halaman 1. Bila baris menyusut (mis. sesudah
   hapus), halaman dijepit ke halaman terakhir yang masih ada. */
export function usePaginasi<T>(
  baris: readonly T[],
  { ukuranAwal = 10, kunciReset }: { ukuranAwal?: number; kunciReset?: unknown } = {},
): Paginasi<T> {
  const [halamanMentah, setHalamanMentah] = React.useState(1)
  const [ukuran, setUkuranMentah] = React.useState(ukuranAwal)
  const [kunciTerakhir, setKunciTerakhir] = React.useState(() => JSON.stringify(kunciReset ?? null))

  const kunci = JSON.stringify(kunciReset ?? null)
  if (kunci !== kunciTerakhir) {
    setKunciTerakhir(kunci)
    setHalamanMentah(1)
  }

  const total = baris.length
  const totalHalaman = Math.max(1, Math.ceil(total / ukuran))
  const halaman = Math.min(Math.max(1, halamanMentah), totalHalaman)
  const awal = (halaman - 1) * ukuran
  const potongan = React.useMemo(() => baris.slice(awal, awal + ukuran), [baris, awal, ukuran])

  const setUkuran = React.useCallback((u: number) => {
    setUkuranMentah(u)
    setHalamanMentah(1)
  }, [])

  return {
    halaman,
    ukuran,
    totalHalaman,
    total,
    dari: total === 0 ? 0 : awal + 1,
    sampai: Math.min(awal + ukuran, total),
    potongan,
    setHalaman: setHalamanMentah,
    setUkuran,
  }
}

/** Nomor halaman yang ditampilkan, dengan `null` sebagai elipsis: 1 … 4 5 6 … 20. */
export function nomorHalaman(halaman: number, totalHalaman: number): (number | null)[] {
  if (totalHalaman <= 7) return Array.from({ length: totalHalaman }, (_, i) => i + 1)
  const tengah = [halaman - 1, halaman, halaman + 1].filter((n) => n > 1 && n < totalHalaman)
  if (halaman <= 3) tengah.splice(0, tengah.length, 2, 3, 4)
  if (halaman >= totalHalaman - 2) tengah.splice(0, tengah.length, totalHalaman - 3, totalHalaman - 2, totalHalaman - 1)
  const hasil: (number | null)[] = [1]
  if (tengah[0] > 2) hasil.push(null)
  hasil.push(...tengah)
  if (tengah[tengah.length - 1] < totalHalaman - 1) hasil.push(null)
  hasil.push(totalHalaman)
  return hasil
}
