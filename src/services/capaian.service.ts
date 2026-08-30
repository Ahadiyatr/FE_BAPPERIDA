import { api, dataOf } from "./api"
import { getPeriode } from "./periode.service"
import { getBidang } from "./bidang.service"
import { getKegiatan, getKegiatanById } from "./kegiatan.service"
import { getProgram } from "./program.service"
import type {
  CapaianBidang, CapaianProgram, ProgramBerurusan, RingkasanDashboard,
  SubkegiatanRinci, SubkegiatanStruktur, SubkegiatanTertinggal,
} from "./types"

export interface TrenCapaian {
  periodeId: number
  namaPeriode: string
  status: "DRAFT" | "OPEN" | "LOCKED"
  capaian: number
  jumlahSubkegiatan: number
}

/**
 * Rollup capaian.
 *
 * Semua data capaian berasal dari API. Rollup dilakukan backend dari transaksi
 * yang tersimpan; frontend hanya memetakan bentuk respons untuk tampilan.
 */

const bulat2 = (n: number) => Math.round(n * 100) / 100

/**
 * ⚠️ ASUMSI SEMENTARA — rumus rollup capaian program BELUM diputuskan.
 *
 * Excel sumber memberi label `Capaian Kinerja "Program"` tetapi tidak pernah
 * menghitungnya: dari 3 baris berlabel, NOL yang berangka, dan seluruh 77
 * rumus capaian berhenti di tingkat subkegiatan.
 *
 * Yang dipakai di sini: rata-rata TAK BERBOBOT seluruh subkegiatan program.
 * Alternatifnya (berjenjang lewat kegiatan) memberi angka berbeda karena
 * jumlah subkegiatan antar kegiatan timpang di 4 dari 5 program.
 *
 * Lihat docs/keputusan-terbuka.md butir 1 (di opera-ink-fe-bundle).
 *
 * Backend menerapkan konvensi ini pada DashboardService dan MonitoringController.
 */
export async function getRankingBidang(periodeId: number): Promise<CapaianBidang[]> {
  const h=dataOf<any>(await api.get("/dashboard",{params:{periode_id:periodeId}}))
  return (h.bidang??[]).map((r:any)=>({bidangId:r.bidang_id,namaBidang:r.nama_bidang,capaianBidang:Number(r.capaian_bidang),jumlahSubkegiatan:r.jumlah_subkegiatan})).sort((a:CapaianBidang,b:CapaianBidang)=>b.capaianBidang-a.capaianBidang)
}

type AktifitasMonitoring = { id:number; nama_aktifitas:string; tipe_aktifitas:"UTAMA"|"PENDUKUNG"; satuan:string|null; bobot_target:number; target:number; realisasi:number; bobot_realisasi:number; jumlah_catatan:number }
type SubkegiatanMonitoring = { id:number; kode_subkegiatan:string; nama_subkegiatan:string; bidang_id:number; nama_bidang:string; indikator_kinerja:string; output_kinerja:string|null; target:number; satuan:string; capaian:number; aktifitas:AktifitasMonitoring[] }
type KegiatanMonitoring = { kode_kegiatan:string; nama_kegiatan:string; jumlah_subkegiatan:number; capaian:number; subkegiatan:SubkegiatanMonitoring[] }
type ProgramMonitoring = { kode_program:string; nama_program:string; jumlah_subkegiatan:number; capaian:number; kegiatan:KegiatanMonitoring[] }
type KinerjaMonitoring = { program:ProgramMonitoring[] }

async function getKinerja(periodeId:number):Promise<KinerjaMonitoring> {
  return dataOf<KinerjaMonitoring>(await api.get("/monitoring/kinerja", { params: { periode_id: periodeId } }))
}

export async function getRankingProgram(periodeId: number): Promise<CapaianProgram[]> {
  const h=dataOf<any>(await api.get("/dashboard",{params:{periode_id:periodeId}}))
  return (h.program??[]).map((r:any,i:number)=>({programId:i+1,kodeProgram:r.kode_program,namaProgram:r.nama_program,capaian:Number(r.capaian),jumlahSubkegiatan:r.jumlah_subkegiatan})).sort((a:CapaianProgram,b:CapaianProgram)=>b.capaian-a.capaian)
}

/**
 * Capaian program lengkap dengan rincian per bidang dan per kegiatan.
 */
export async function getCapaianProgram(periodeId: number): Promise<ProgramBerurusan[]> {
  const [kinerja, programMaster, kegiatanMaster, bidang] = await Promise.all([
    getKinerja(periodeId), getProgram(), getKegiatan(), getBidang(),
  ])
  const programId = new Map(programMaster.map(p => [p.kodeProgram, p.id]))
  const kegiatanId = new Map(kegiatanMaster.map(k => [k.kodeKegiatan, k.id]))
  const namaBidang = new Map(bidang.map(b => [b.id, b.namaBidang]))

  return kinerja.program.map(p => ({
    programId: programId.get(p.kode_program) ?? 0,
    kodeProgram: p.kode_program,
    namaProgram: p.nama_program,
    capaian: Number(p.capaian),
    jumlahSubkegiatan: p.jumlah_subkegiatan,
    perBidang: [...p.kegiatan.flatMap(k => k.subkegiatan)
      .reduce((hasil, s) => {
        const lama = hasil.get(s.bidang_id) ?? { bidangId:s.bidang_id, namaBidang:namaBidang.get(s.bidang_id) ?? s.nama_bidang, jumlahSubkegiatan:0, capaian:[] as number[] }
        lama.jumlahSubkegiatan++; lama.capaian.push(Number(s.capaian)); hasil.set(s.bidang_id, lama); return hasil
      }, new Map<number, { bidangId:number; namaBidang:string; jumlahSubkegiatan:number; capaian:number[] }>()).values()]
      .map(b => ({ ...b, capaian:b.capaian.length ? bulat2(b.capaian.reduce((total, nilai) => total + nilai, 0) / b.capaian.length) : 0 }))
      .sort((a, b) => b.capaian - a.capaian),
    perKegiatan: p.kegiatan.map(k => ({
      kegiatanId: kegiatanId.get(k.kode_kegiatan) ?? 0,
      kodeKegiatan:k.kode_kegiatan, namaKegiatan:k.nama_kegiatan,
      jumlahSubkegiatan:k.jumlah_subkegiatan, capaian:Number(k.capaian),
    })).sort((a, b) => b.capaian - a.capaian),
  })).sort((a, b) => a.kodeProgram.localeCompare(b.kodeProgram))
}

export async function getSubkegiatanTertinggal(
  periodeId: number,
  batas = 60,
  maksimum = 10
): Promise<SubkegiatanTertinggal[]> {
  const kinerja = await getKinerja(periodeId)
  return kinerja.program.flatMap(p => p.kegiatan).flatMap(k => k.subkegiatan)
    .filter(s => Number(s.capaian) < batas)
    .map(s => ({ subkegiatanBidangId:s.id, kode:s.kode_subkegiatan, nama:s.nama_subkegiatan,
      namaBidang:s.nama_bidang ?? "—", capaian:Number(s.capaian),
      jumlahAktifitasBelumJalan:s.aktifitas.filter(a => Number(a.realisasi) === 0).length }))
    .sort((a, b) => a.capaian - b.capaian).slice(0, maksimum)
}

export async function getRingkasanDashboard(periodeId: number): Promise<RingkasanDashboard | null> {
  const [periodes,h]=await Promise.all([getPeriode(),api.get("/dashboard",{params:{periode_id:periodeId}}).then(dataOf<any>)])
  const periode=periodes.find(p=>p.id===periodeId)??null
  if(!periode)return null
  const bidang=h.bidang??[]
  const ring=h.ringkasan??{}
  return{periode,capaianPd:Number(ring.capaian_pd??ring.rata_capaian_subkegiatan??0),jumlahBidang:Number(ring.jumlah_bidang??bidang.length),jumlahBidangSiap:0,jumlahSubkegiatan:Number(ring.jumlah_subkegiatan??0),jumlahAktifitas:0,jumlahRealisasi:0}
}

/** Tren sampai periode terpilih; scope mengikuti peran pengguna yang masuk. */
export async function getTrenCapaian(periodeId: number, batas = 6): Promise<TrenCapaian[]> {
  const rows = dataOf<Array<{ periode_id:number; nama_periode:string; status:TrenCapaian["status"]; capaian:number; jumlah_subkegiatan:number }>>(
    await api.get("/dashboard/tren", { params: { periode_id: periodeId, batas } })
  )
  return rows.map((r) => ({
    periodeId: r.periode_id,
    namaPeriode: r.nama_periode,
    status: r.status,
    capaian: Number(r.capaian),
    jumlahSubkegiatan: Number(r.jumlah_subkegiatan),
  }))
}

/** Telusur Struktur Program — subkegiatan satu kegiatan beserta bidang
 * penanggung jawab dan capaiannya pada periode terpilih. */
export async function getStrukturSubkegiatan(
  kegiatanId: number,
  periodeId: number
): Promise<SubkegiatanStruktur[]> {
  const [kegiatan, kinerja] = await Promise.all([getKegiatanById(kegiatanId), getKinerja(periodeId)])
  if (!kegiatan) return []
  const subkegiatan = kinerja.program.flatMap(p => p.kegiatan)
    .find(k => k.kode_kegiatan === kegiatan.kodeKegiatan)?.subkegiatan ?? []

  return subkegiatan.map(s => ({
    indikatorUtamaId:s.id, kode:s.kode_subkegiatan, nama:s.nama_subkegiatan,
    indikatorKinerja:s.indikator_kinerja ?? "", namaBidang:s.nama_bidang ?? null, capaian:Number(s.capaian),
  }))
}

/**
 * Rincian satu kegiatan sampai tingkat aktifitas — dasar hirarki Excel.
 * Dipakai layar Capaian Program untuk turun dari kegiatan ke subkegiatan
 * lalu ke aktifitas, tempat pembagian 70/30 baru benar-benar terlihat.
 */
export async function getRincianKegiatan(
  kegiatanId: number,
  periodeId: number
): Promise<SubkegiatanRinci[]> {
  const [kegiatan, kinerja] = await Promise.all([getKegiatanById(kegiatanId), getKinerja(periodeId)])
  if (!kegiatan) return []
  const rincian = kinerja.program.flatMap(p => p.kegiatan)
    .find(k => k.kode_kegiatan === kegiatan.kodeKegiatan)?.subkegiatan ?? []

  return rincian.map(s => ({
    subkegiatanBidangId:s.id, kode:s.kode_subkegiatan, nama:s.nama_subkegiatan,
    indikatorKinerja:s.indikator_kinerja ?? "", outputKinerja:s.output_kinerja ?? "", namaBidang:s.nama_bidang ?? "—", bidangId:s.bidang_id,
    target:Number(s.target), satuan:s.satuan ?? "", capaian:Number(s.capaian),
    aktifitas:s.aktifitas.map(a => ({ indikatorBidangId:a.id, namaAktifitas:a.nama_aktifitas,
      tipeAktifitas:a.tipe_aktifitas, satuan:a.satuan ?? "", bobotTarget:Number(a.bobot_target), target:Number(a.target),
      realisasi:Number(a.realisasi), bobotRealisasi:Number(a.bobot_realisasi), jumlahCatatan:Number(a.jumlah_catatan) })),
  })).sort((a, b) => a.kode.localeCompare(b.kode))
}
