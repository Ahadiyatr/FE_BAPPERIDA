import { api, dataOf } from "./api"
import type { RealisasiLampiran, StatusPeriode, TipeAktifitas } from "./types"

/* Layar Monitoring Kinerja — pohon Program → Kegiatan → Subkegiatan → Aktifitas
   untuk satu periode. Read only, terbuka untuk admin_bidang & admin_aplikasi
   (kedua peran melihat seluruh bidang). Sumbernya endpoint tunggal
   GET /monitoring/kinerja di opera-backend. */

export interface MonitoringAktifitas {
  id: number
  namaAktifitas: string
  tipeAktifitas: TipeAktifitas
  satuan: string
  bobotTarget: number
  target: number
  realisasi: number
  bobotRealisasi: number
  jumlahCatatan: number
  jumlahLampiran: number
  flagAdhoc: boolean
  urutan: number
}

export interface MonitoringSubkegiatan {
  id: number
  kodeSubkegiatan: string
  namaSubkegiatan: string
  bidangId: number
  namaBidang: string | null
  indikatorKinerja: string
  outputKinerja: string
  target: number
  satuan: string
  capaian: number
  aktifitas: MonitoringAktifitas[]
}

export interface MonitoringKegiatan {
  kodeKegiatan: string
  namaKegiatan: string
  jumlahSubkegiatan: number
  capaian: number
  subkegiatan: MonitoringSubkegiatan[]
}

export interface MonitoringProgram {
  kodeProgram: string
  namaProgram: string
  jumlahSubkegiatan: number
  jumlahKegiatan: number
  capaian: number
  kegiatan: MonitoringKegiatan[]
}

export interface MonitoringRingkasan {
  jumlahProgram: number
  jumlahKegiatan: number
  jumlahSubkegiatan: number
  jumlahAktifitas: number
  rataCapaianSubkegiatan: number
}

export interface MonitoringPeriode {
  id: number
  namaPeriode: string
  status: StatusPeriode
}

export interface MonitoringKinerja {
  periode: MonitoringPeriode | null
  ringkasan: MonitoringRingkasan | null
  program: MonitoringProgram[]
}

/* ── Bentuk mentah dari backend (snake_case) ───────────────────────────── */

type AktifitasRow = {
  id: number
  nama_aktifitas: string
  tipe_aktifitas: TipeAktifitas
  satuan: string | null
  bobot_target: number
  target: number
  realisasi: number
  bobot_realisasi: number
  jumlah_catatan: number
  jumlah_lampiran?: number
  flag_adhoc: boolean
  urutan: number
}
type SubkegiatanRow = {
  id: number
  kode_subkegiatan: string
  nama_subkegiatan: string
  bidang_id: number
  nama_bidang: string | null
  indikator_kinerja: string | null
  output_kinerja: string | null
  target: number
  satuan: string | null
  capaian: number
  aktifitas: AktifitasRow[]
}
type KegiatanRow = {
  kode_kegiatan: string
  nama_kegiatan: string
  jumlah_subkegiatan: number
  capaian: number
  subkegiatan: SubkegiatanRow[]
}
type ProgramRow = {
  kode_program: string
  nama_program: string
  jumlah_subkegiatan: number
  jumlah_kegiatan: number
  capaian: number
  kegiatan: KegiatanRow[]
}
type Root = {
  periode: { id: number; nama_periode: string; status: StatusPeriode } | null
  ringkasan: {
    jumlah_program: number
    jumlah_kegiatan: number
    jumlah_subkegiatan: number
    jumlah_aktifitas: number
    rata_capaian_subkegiatan: number
  } | null
  program: ProgramRow[]
}

const aktifitas = (r: AktifitasRow): MonitoringAktifitas => ({
  id: r.id,
  namaAktifitas: r.nama_aktifitas,
  tipeAktifitas: r.tipe_aktifitas,
  satuan: r.satuan ?? "",
  bobotTarget: Number(r.bobot_target),
  target: Number(r.target),
  realisasi: Number(r.realisasi),
  bobotRealisasi: Number(r.bobot_realisasi),
  jumlahCatatan: Number(r.jumlah_catatan),
  jumlahLampiran: Number(r.jumlah_lampiran ?? 0),
  flagAdhoc: Boolean(r.flag_adhoc),
  urutan: r.urutan,
})

const subkegiatan = (r: SubkegiatanRow): MonitoringSubkegiatan => ({
  id: r.id,
  kodeSubkegiatan: r.kode_subkegiatan,
  namaSubkegiatan: r.nama_subkegiatan,
  bidangId: r.bidang_id,
  namaBidang: r.nama_bidang,
  indikatorKinerja: r.indikator_kinerja ?? "",
  outputKinerja: r.output_kinerja ?? "",
  target: Number(r.target),
  satuan: r.satuan ?? "",
  capaian: Number(r.capaian),
  aktifitas: (r.aktifitas ?? []).map(aktifitas),
})

const kegiatan = (r: KegiatanRow): MonitoringKegiatan => ({
  kodeKegiatan: r.kode_kegiatan,
  namaKegiatan: r.nama_kegiatan,
  jumlahSubkegiatan: r.jumlah_subkegiatan,
  capaian: Number(r.capaian),
  subkegiatan: (r.subkegiatan ?? []).map(subkegiatan),
})

const program = (r: ProgramRow): MonitoringProgram => ({
  kodeProgram: r.kode_program,
  namaProgram: r.nama_program,
  jumlahSubkegiatan: r.jumlah_subkegiatan,
  jumlahKegiatan: r.jumlah_kegiatan,
  capaian: Number(r.capaian),
  kegiatan: (r.kegiatan ?? []).map(kegiatan),
})

export async function getMonitoringKinerja(periodeId?: number): Promise<MonitoringKinerja> {
  const root = dataOf<Root>(
    await api.get("/monitoring/kinerja", {
      params: periodeId != null ? { periode_id: periodeId } : {},
    })
  )
  return {
    periode: root.periode
      ? { id: root.periode.id, namaPeriode: root.periode.nama_periode, status: root.periode.status }
      : null,
    ringkasan: root.ringkasan
      ? {
          jumlahProgram: root.ringkasan.jumlah_program,
          jumlahKegiatan: root.ringkasan.jumlah_kegiatan,
          jumlahSubkegiatan: root.ringkasan.jumlah_subkegiatan,
          jumlahAktifitas: root.ringkasan.jumlah_aktifitas,
          rataCapaianSubkegiatan: Number(root.ringkasan.rata_capaian_subkegiatan),
        }
      : null,
    program: (root.program ?? []).map(program),
  }
}

/* ── Detail Subkegiatan ────────────────────────────────────────────────────
   GET /monitoring/subkegiatan/{id} — isi lengkap satu subkegiatan (rencana id)
   sampai catatan realisasi + lampiran. admin_aplikasi saja. Respons = bentuk
   TransSubkegiatanBidangResource dengan `aktifitas[]` bersarang. */

export interface DetailCatatanRealisasi {
  id: number
  tanggalKegiatan: string
  jumlahRealisasi: number
  keterangan: string
  /** pencatat.name, jatuh ke log_entry_name (nama beku) bila user terhapus. */
  pencatat: string
  lampiran: RealisasiLampiran[]
}

export interface DetailAktifitas extends MonitoringAktifitas {
  /** Catatan realisasi harian, terbaru dulu. */
  catatan: DetailCatatanRealisasi[]
}

export interface DetailPeriode extends MonitoringPeriode {
  tanggalMulai: string
  tanggalSelesai: string
}

export interface DetailSubkegiatan {
  id: number
  kodeProgram: string
  namaProgram: string
  kodeKegiatan: string
  namaKegiatan: string
  kodeSubkegiatan: string
  namaSubkegiatan: string
  indikatorKinerja: string
  outputKinerja: string
  target: number
  satuan: string
  capaian: number
  bidang: { id: number; namaBidang: string } | null
  periode: DetailPeriode | null
  aktifitas: DetailAktifitas[]
}

type DetLampiranRow = {
  id: number
  realisasi_id: number
  tipe_berkas: "FOTO" | "DOKUMEN"
  nama_berkas: string
  ukuran_byte: number
  preview_url: string
}
type DetRealisasiRow = {
  id: number
  tanggal_kegiatan: string
  jumlah_realisasi: number
  keterangan: string | null
  log_entry_name: string
  pencatat?: { id: number; name: string } | null
  lampiran?: DetLampiranRow[]
}
type DetAktifitasRow = AktifitasRow & { realisasi_kegiatan?: DetRealisasiRow[] }
export type DetailSubkegiatanRow = {
  id: number
  kode_program: string
  nama_program: string
  kode_kegiatan: string
  nama_kegiatan: string
  kode_subkegiatan: string
  nama_subkegiatan: string
  indikator_kinerja: string | null
  output_kinerja: string | null
  target: number
  satuan: string | null
  capaian: number
  bidang?: { id: number; nama_bidang: string } | null
  periode?: {
    id: number
    nama_periode: string
    status: StatusPeriode
    tanggal_mulai: string
    tanggal_selesai: string
  } | null
  aktifitas: DetAktifitasRow[]
}

const detLampiran = (r: DetLampiranRow): RealisasiLampiran => ({
  id: r.id,
  realisasiId: r.realisasi_id,
  tipeBerkas: r.tipe_berkas,
  namaBerkas: r.nama_berkas,
  pathBerkas: r.preview_url,
  ukuranByte: Number(r.ukuran_byte),
})

const detCatatan = (r: DetRealisasiRow): DetailCatatanRealisasi => ({
  id: r.id,
  tanggalKegiatan: r.tanggal_kegiatan,
  jumlahRealisasi: Number(r.jumlah_realisasi),
  keterangan: r.keterangan ?? "",
  pencatat: r.pencatat?.name ?? r.log_entry_name ?? "",
  lampiran: (r.lampiran ?? []).map(detLampiran),
})

const detAktifitas = (r: DetAktifitasRow): DetailAktifitas => ({
  ...aktifitas(r),
  catatan: (r.realisasi_kegiatan ?? []).map(detCatatan),
})

export const mapDetailSubkegiatan = (s: DetailSubkegiatanRow): DetailSubkegiatan => ({
    id: s.id,
    kodeProgram: s.kode_program,
    namaProgram: s.nama_program,
    kodeKegiatan: s.kode_kegiatan,
    namaKegiatan: s.nama_kegiatan,
    kodeSubkegiatan: s.kode_subkegiatan,
    namaSubkegiatan: s.nama_subkegiatan,
    indikatorKinerja: s.indikator_kinerja ?? "",
    outputKinerja: s.output_kinerja ?? "",
    target: Number(s.target),
    satuan: s.satuan ?? "",
    capaian: Number(s.capaian),
    bidang: s.bidang ? { id: s.bidang.id, namaBidang: s.bidang.nama_bidang } : null,
    periode: s.periode
      ? {
          id: s.periode.id,
          namaPeriode: s.periode.nama_periode,
          status: s.periode.status,
          tanggalMulai: s.periode.tanggal_mulai,
          tanggalSelesai: s.periode.tanggal_selesai,
        }
      : null,
  aktifitas: (s.aktifitas ?? []).map(detAktifitas),
})

export async function getMonitoringSubkegiatan(id: number): Promise<DetailSubkegiatan> {
  return mapDetailSubkegiatan(dataOf<DetailSubkegiatanRow>(await api.get(`/monitoring/subkegiatan/${id}`)))
}
