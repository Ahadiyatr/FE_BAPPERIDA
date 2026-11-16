import type { AgendaKegiatan, RealisasiKalender } from "@/services/types"

export const AWAL_PEKAN = 1

export const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const

export interface Bulan {
  tahun: number
  bulan: number
}

export interface SelKalender {
  kunci: string
  tanggal: number
  bulanIni: boolean
  hariIni: boolean
  dalamPeriode: boolean
  akhirPekan: boolean
  agenda: AgendaKegiatan[]
  realisasi: RealisasiKalender[]
}

const dua = (n: number) => String(n).padStart(2, "0")

export function kunciTanggal(tanggal: Date): string {
  return `${tanggal.getFullYear()}-${dua(tanggal.getMonth() + 1)}-${dua(tanggal.getDate())}`
}

export function dariKunci(kunci: string): Date {
  const [tahun, bulan, hari] = kunci.split("-").map(Number)
  return new Date(tahun, bulan - 1, hari)
}

export function bulanDariKunci(kunci: string): Bulan {
  const [tahun, bulan] = kunci.split("-").map(Number)
  return { tahun, bulan }
}

export function kunciDariBulan(b: Bulan): string {
  return `${b.tahun}-${dua(b.bulan)}`
}

export function geserBulan(b: Bulan, langkah: number): Bulan {
  const d = new Date(b.tahun, b.bulan - 1 + langkah, 1)
  return { tahun: d.getFullYear(), bulan: d.getMonth() + 1 }
}

const indeksSenin = (d: Date) => (d.getDay() + 6) % 7

export function jendelaGrid(b: Bulan): { dari: string; sampai: string } {
  const awalBulan = new Date(b.tahun, b.bulan - 1, 1)
  const akhirBulan = new Date(b.tahun, b.bulan, 0)

  const dari = new Date(b.tahun, b.bulan - 1, 1 - indeksSenin(awalBulan))
  const sampai = new Date(
    b.tahun,
    b.bulan,
    0 + (6 - indeksSenin(akhirBulan)),
  )

  return { dari: kunciTanggal(dari), sampai: kunciTanggal(sampai) }
}

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

export function dalamRentang(kunci: string, dari: string, sampai: string): boolean {
  return kunci >= dari && kunci <= sampai
}

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

export function susunGridBulan(input: {
  bulan: Bulan
  agenda: AgendaKegiatan[]
  realisasi: RealisasiKalender[]
  periodeMulai: string
  periodeSelesai: string
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

  const sel = [...peta.values()]
  const pekan: SelKalender[][] = []
  for (let i = 0; i < sel.length; i += 7) pekan.push(sel.slice(i, i + 7))
  return pekan
}

export function labelBulan(b: Bulan): string {
  return new Date(b.tahun, b.bulan - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
}

export function bulanPeriode(periodeMulai: string, periodeSelesai: string): Bulan[] {
  const awal = bulanDariKunci(periodeMulai)
  const akhir = bulanDariKunci(periodeSelesai)

  const hasil: Bulan[] = []
  for (let b = awal; kunciDariBulan(b) <= kunciDariBulan(akhir); b = geserBulan(b, 1)) {
    hasil.push(b)
    if (hasil.length > 240) break
  }
  return hasil
}

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
