import type { AgendaKegiatan, RealisasiKalender } from "@/services/types"

/* Matematika grid kalender — murni, tanpa React dan tanpa pustaka tanggal.
   Proyek ini sengaja nol dependensi tanggal, jadi seluruh aritmetika di sini
   memakai Date bawaan dengan komponen LOKAL.

   Aturan utama: tanggal dibawa sebagai string kunci "YYYY-MM-DD", tidak pernah
   sebagai Date. Perbandingan leksikografis pada format itu sama dengan urutan
   kronologis, sehingga `<`, `>`, dan `===` aman dipakai langsung. */

/**
 * Pekan dimulai Senin. HARUS sama dengan KalenderService::HARI_AWAL_PEKAN di
 * BE-opera/app/Services/KalenderService.php — kalau berbeda, sel bocoran di awal
 * grid kehilangan agendanya tanpa error apa pun di kedua sisi.
 */
export const AWAL_PEKAN = 1

export const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const

export interface Bulan {
  tahun: number
  /** 1..12 (bukan indeks Date yang 0..11). */
  bulan: number
}

export interface SelKalender {
  /** Kunci tanggal lokal "YYYY-MM-DD". */
  kunci: string
  tanggal: number
  /** false untuk sel bocoran dari bulan tetangga. */
  bulanIni: boolean
  hariIni: boolean
  /** false ⇒ sel diredupkan dan aksi tambah agenda dimatikan di sana. */
  dalamPeriode: boolean
  akhirPekan: boolean
  agenda: AgendaKegiatan[]
  realisasi: RealisasiKalender[]
}

const dua = (n: number) => String(n).padStart(2, "0")

/**
 * Kunci tanggal LOKAL "YYYY-MM-DD".
 *
 * Sengaja BUKAN toISOString().slice(0,10): di WIB (UTC+7) tengah malam lokal masih
 * jatuh di hari SEBELUMNYA menurut UTC, sehingga konversi ISO menggeser tanggal
 * mundur satu hari.
 */
export function kunciTanggal(tanggal: Date): string {
  return `${tanggal.getFullYear()}-${dua(tanggal.getMonth() + 1)}-${dua(tanggal.getDate())}`
}

/**
 * "YYYY-MM-DD" → Date tengah malam LOKAL.
 *
 * Sengaja BUKAN new Date(kunci): string polos "YYYY-MM-DD" diurai sebagai UTC menurut
 * spesifikasi, jadi di zona waktu negatif tanggalnya meleset satu hari.
 */
export function dariKunci(kunci: string): Date {
  const [tahun, bulan, hari] = kunci.split("-").map(Number)
  return new Date(tahun, bulan - 1, hari)
}

/** Menerima "2026-02" maupun "2026-02-10". */
export function bulanDariKunci(kunci: string): Bulan {
  const [tahun, bulan] = kunci.split("-").map(Number)
  return { tahun, bulan }
}

export function kunciDariBulan(b: Bulan): string {
  return `${b.tahun}-${dua(b.bulan)}`
}

/** Aman melewati batas tahun: new Date() menormalkan bulan di luar 0..11. */
export function geserBulan(b: Bulan, langkah: number): Bulan {
  const d = new Date(b.tahun, b.bulan - 1 + langkah, 1)
  return { tahun: d.getFullYear(), bulan: d.getMonth() + 1 }
}

/** Indeks hari dengan Senin = 0 (getDay() bawaan memakai Minggu = 0). */
const indeksSenin = (d: Date) => (d.getDay() + 6) % 7

/**
 * Jendela grid: Senin sebelum tanggal 1 sampai Minggu sesudah akhir bulan.
 * Harus menghasilkan rentang yang sama dengan KalenderService::jendelaGrid() di backend.
 */
export function jendelaGrid(b: Bulan): { dari: string; sampai: string } {
  const awalBulan = new Date(b.tahun, b.bulan - 1, 1)
  // Hari 0 bulan berikutnya = hari terakhir bulan ini.
  const akhirBulan = new Date(b.tahun, b.bulan, 0)

  const dari = new Date(b.tahun, b.bulan - 1, 1 - indeksSenin(awalBulan))
  const sampai = new Date(
    b.tahun,
    b.bulan,
    0 + (6 - indeksSenin(akhirBulan)),
  )

  return { dari: kunciTanggal(dari), sampai: kunciTanggal(sampai) }
}

/** Semua kunci tanggal dalam jendela, berurutan — panjangnya selalu kelipatan 7. */
export function tanggalGrid(b: Bulan): string[] {
  const { dari, sampai } = jendelaGrid(b)
  const mulai = dariKunci(dari)
  const akhir = dariKunci(sampai)

  const hasil: string[] = []
  for (let d = mulai; d <= akhir; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    hasil.push(kunciTanggal(d))
  }
  return hasil
}

/** Inklusif di kedua ujung. */
export function dalamRentang(kunci: string, dari: string, sampai: string): boolean {
  return kunci >= dari && kunci <= sampai
}

/** Kunci tanggal yang disinggung satu agenda, dipotong ke [batasDari, batasSampai]. */
export function rentangKunci(
  mulai: string,
  selesai: string,
  batasDari: string,
  batasSampai: string,
): string[] {
  const dari = mulai < batasDari ? batasDari : mulai
  const sampai = selesai > batasSampai ? batasSampai : selesai
  if (dari > sampai) return []

  const hasil: string[] = []
  const akhir = dariKunci(sampai)
  for (
    let d = dariKunci(dari);
    d <= akhir;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    hasil.push(kunciTanggal(d))
  }
  return hasil
}

/**
 * Inti layar: menempatkan agenda dan realisasi ke sel-sel grid.
 *
 * Agenda multi-hari muncul di SETIAP sel yang disinggungnya — objek yang SAMA, bukan
 * salinan. Konsumen wajib meng-key dengan agenda.id, dan jangan pernah menjumlahkan
 * cacah per sel untuk mendapat total (pakai ringkasan dari server).
 */
export function susunGridBulan(input: {
  bulan: Bulan
  agenda: AgendaKegiatan[]
  realisasi: RealisasiKalender[]
  periodeMulai: string
  periodeSelesai: string
  /** Disuntik agar tes deterministik; default hari ini menurut jam lokal. */
  hariIni?: string
}): SelKalender[][] {
  const { bulan, agenda, realisasi, periodeMulai, periodeSelesai } = input
  const hariIni = input.hariIni ?? kunciTanggal(new Date())
  const { dari, sampai } = jendelaGrid(bulan)

  const peta = new Map<string, SelKalender>()
  for (const kunci of tanggalGrid(bulan)) {
    const d = dariKunci(kunci)
    const hari = d.getDay()
    peta.set(kunci, {
      kunci,
      tanggal: d.getDate(),
      bulanIni: d.getMonth() + 1 === bulan.bulan && d.getFullYear() === bulan.tahun,
      hariIni: kunci === hariIni,
      dalamPeriode: dalamRentang(kunci, periodeMulai, periodeSelesai),
      akhirPekan: hari === 0 || hari === 6,
      agenda: [],
      realisasi: [],
    })
  }

  for (const baris of agenda) {
    for (const kunci of rentangKunci(baris.tanggalMulai, baris.tanggalSelesai, dari, sampai)) {
      peta.get(kunci)?.agenda.push(baris)
    }
  }

  for (const baris of realisasi) {
    peta.get(baris.tanggalKegiatan)?.realisasi.push(baris)
  }

  // Potong jadi baris pekan supaya JSX tidak perlu melakukan chunking sendiri.
  const sel = [...peta.values()]
  const pekan: SelKalender[][] = []
  for (let i = 0; i < sel.length; i += 7) pekan.push(sel.slice(i, i + 7))
  return pekan
}

/** "Februari 2026" — Intl, tanpa pustaka tanggal. */
export function labelBulan(b: Bulan): string {
  return new Date(b.tahun, b.bulan - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
}

/**
 * Bulan yang boleh dinavigasi untuk satu periode — dipakai mematikan tombol ‹ › di ujung.
 * Tanpa ini pengguna tersasar ke bulan kosong di luar periode dan menyimpulkan datanya hilang.
 */
export function bulanPeriode(periodeMulai: string, periodeSelesai: string): Bulan[] {
  const awal = bulanDariKunci(periodeMulai)
  const akhir = bulanDariKunci(periodeSelesai)

  const hasil: Bulan[] = []
  for (let b = awal; kunciDariBulan(b) <= kunciDariBulan(akhir); b = geserBulan(b, 1)) {
    hasil.push(b)
    // Jaga-jaga terhadap rentang tanggal yang terbalik.
    if (hasil.length > 240) break
  }
  return hasil
}

/** Ringkasan satu sel untuk penanda kecil di grid. */
export function ringkasSel(sel: SelKalender): {
  jumlahAgenda: number
  jumlahRealisasi: number
  adaTerlewat: boolean
} {
  return {
    jumlahAgenda: sel.agenda.length,
    jumlahRealisasi: sel.realisasi.length,
    adaTerlewat: sel.agenda.some((a) => a.terlewat),
  }
}
