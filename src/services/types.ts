
export type TipeAktifitas = "UTAMA" | "PENDUKUNG"
export type StatusPeriode = "DRAFT" | "OPEN" | "LOCKED"
export type TipeBerkas = "FOTO" | "DOKUMEN"
export type PeranPengguna = "publik" | "admin_bidang" | "admin_aplikasi"

export interface Urusan {
  id: number
  kodeUrusan: string
  namaUrusan: string
}

export interface Program {
  id: number
  dokumenId: number
  urusanId: number
  kodeProgram: string
  namaProgram: string
  flagActive: boolean
}

export interface Kegiatan {
  id: number
  programId: number
  kodeKegiatan: string
  namaKegiatan: string
  flagActive: boolean
}

export interface IndikatorUtama {
  id: number
  kegiatanId: number
  kodeIndikatorUtama: string
  namaIndikatorUtama: string
  indikatorKinerja: string
  targetKinerja: number
  satuanKinerja: string
  outputKinerja: string | null
  flagActive: boolean
}

export interface Indikator {
  id: number
  indikatorUtamaId: number
  kodeIndikator: string
  namaIndikator: string
  tipeAktifitas: TipeAktifitas
  satuan: string
  targetAnjuran: number
  urutan: number
  flagActive: boolean
}

export interface Bidang {
  id: number
  kode: string
  namaBidang: string
  flagActive: boolean
}

export interface Periode {
  id: number
  dokumenId: number | null
  namaPeriode: string
  tanggalMulai: string
  tanggalSelesai: string
  status: StatusPeriode
  jumlahRencana?: number
}

export interface User {
  id: number
  name: string
  email: string
  role: Exclude<PeranPengguna, "publik">
  bidangId: number | null
  flagActive: boolean
}

export interface SimpanUserInput {
  id?: number
  name: string
  email: string
  role: Exclude<PeranPengguna, "publik">
  bidangId: number | null
  password?: string
}

export interface SubkegiatanBidang {
  id: number
  periodeId: number
  bidangId: number
  indikatorUtamaId: number
  indikatorKinerja: string
  target: number
  satuan: string
  capaian: number
}

export interface IndikatorBidang {
  id: number
  subkegiatanBidangId: number
  masterIndikatorId: number
  flagAdhoc: boolean
  dipakai: boolean
  tipeAktifitas: TipeAktifitas
  namaAktifitas: string
  bobotTarget: number
  target: number
  realisasi: number
  bobotRealisasi: number
  urutan: number
}

export interface RealisasiKegiatan {
  id: number
  indikatorBidangId: number
  tanggalKegiatan: string
  jumlahRealisasi: number
  keterangan: string
  createdBy: number
  logEntryName: string
}

export interface RealisasiLampiran {
  id: number
  realisasiId: number
  tipeBerkas: TipeBerkas
  namaBerkas: string
  mimeType?: string | null
  pathBerkas: string
  ukuranByte: number
  createdBy?: number | null
}

export interface CapaianDetail {
  subkegiatanBidang: SubkegiatanBidang
  aktifitasUtama: IndikatorBidang | null
  aktifitasPendukung: IndikatorBidang[]
  capaianPersen: number
}

export interface CatatRealisasiInput {
  indikatorBidangId: number
  tanggalKegiatan: string
  jumlahRealisasi: number
  keterangan: string
  createdBy: number
  fotos?: File[]
  dokumens?: File[]
}

export interface OpsiMaster {
  termasukNonaktif?: boolean
}

export interface SimpanProgramInput {
  id?: number
  kodeProgram: string
  namaProgram: string
  urusanId: number
  dokumenId: number
}

export interface SimpanKegiatanInput {
  id?: number
  programId: number
  kodeKegiatan: string
  namaKegiatan: string
}

export interface SimpanSubkegiatanInput {
  id?: number
  kegiatanId: number
  kodeIndikatorUtama: string
  namaIndikatorUtama: string
  indikatorKinerja: string
  targetKinerja: number
  satuanKinerja: string
  outputKinerja: string | null
}

export interface SimpanAktifitasInput {
  id?: number
  indikatorUtamaId: number
  kodeIndikator: string
  namaIndikator: string
  tipeAktifitas: TipeAktifitas
  satuan: string
  targetAnjuran: number
}

export interface AktifitasDenganBobot extends Indikator {
  bobotTarget: number
}

export type StatusKesiapan = "DRAFT" | "SIAP"

export interface KesiapanBidang {
  bidangId: number
  namaBidang: string
  periodeId: number
  status: StatusKesiapan
  jumlahSubkegiatan: number
  jumlahLengkap: number
  jumlahTeragenda: number
  butir: string[]
  ditandaiPada: string | null
}

export type NadaPemeriksaan = "ok" | "warn" | "bad"

export interface ButirPemeriksaan {
  nada: NadaPemeriksaan
  judul: string
  rincian: string
  menghalangi: boolean
}

export interface HasilPemeriksaan {
  butir: ButirPemeriksaan[]
  jumlahMenghalangi: number
  bolehTandaiSiap: boolean
}

export interface BarisRencana {
  subkegiatanBidang: SubkegiatanBidang
  namaSubkegiatan: string
  kodeSubkegiatan: string
  aktifitas: IndikatorBidang[]
}

export interface RencanaBidangDetail {
  bidang: Bidang
  periode: Periode
  status: StatusKesiapan
  baris: BarisRencana[]
}

export interface BarisPenunjukan {
  subkegiatanId: number
  rencanaId: number | null
  kode: string
  nama: string
  indikatorKinerja: string
  targetAnjuran: number | null
  satuan: string | null
  flagActive: boolean
  bidangId: number | null
  namaBidang: string | null
  jumlahAktifitasUtama: number
  jumlahAktifitasPendukung: number
  dapatDitugaskan: boolean
  adaRealisasi: boolean
}

export interface KegiatanPenunjukan {
  kode: string
  nama: string
  subkegiatan: BarisPenunjukan[]
}

export interface ProgramPenunjukan {
  kode: string
  nama: string
  kegiatan: KegiatanPenunjukan[]
}

export interface BebanBidang {
  bidangId: number
  namaBidang: string
  jumlah: number
}

export interface RingkasanPenunjukan {
  jumlahSubkegiatan: number
  jumlahDitugaskan: number
  jumlahBelum: number
  perBidang: BebanBidang[]
}

export interface PenunjukanPeriode {
  periode: Periode
  ringkasan: RingkasanPenunjukan
  program: ProgramPenunjukan[]
}

export interface KatalogTersedia {
  indikatorUtamaId: number
  kode: string
  nama: string
  indikatorKinerja: string
  targetAnjuran: number
  satuan: string
  jumlahAktifitas: number
}

export interface OpsiSalinRencana {
  dariPeriodeId: number
  kePeriodeId: number
  bidangIds?: number[]
  ikutStruktur: boolean
  ikutAktifitas: boolean
  ikutTarget: boolean
  ikutCapaianNol: boolean
}

export interface HasilSalinRencana {
  jumlahSubkegiatan: number
  jumlahAktifitas: number
  jumlahBidangDitimpa: number
}

export interface CapaianBidang {
  bidangId: number
  namaBidang: string
  capaianBidang: number
  jumlahSubkegiatan: number
}

export interface CapaianProgram {
  programId: number
  kodeProgram: string
  namaProgram: string
  capaian: number
  jumlahSubkegiatan: number
}

export interface SubkegiatanTertinggal {
  subkegiatanBidangId: number
  kode: string
  nama: string
  namaBidang: string
  capaian: number
  jumlahAktifitasBelumJalan: number
}

export interface RingkasanDashboard {
  periode: Periode
  capaianPd: number
  jumlahBidang: number
  jumlahBidangSiap: number
  jumlahSubkegiatan: number
  jumlahAktifitas: number
  jumlahRealisasi: number
}

export interface SubkegiatanStruktur {
  indikatorUtamaId: number
  kode: string
  nama: string
  indikatorKinerja: string
  namaBidang: string | null
  capaian: number | null
}

export interface AktifitasPencatatan {
  indikatorBidangId: number
  subkegiatanBidangId: number
  kodeSubkegiatan: string
  namaSubkegiatan: string
  namaAktifitas: string
  tipeAktifitas: TipeAktifitas
  bobotTarget: number
  target: number
  realisasi: number
  bobotRealisasi: number
  jumlahCatatan: number
  jumlahLampiran: number
  capaianSubkegiatan: number
  selesai: boolean
}

export interface PratinjauRealisasi {
  namaAktifitas: string
  satuanTarget: number
  bobotTarget: number
  realisasiSekarang: number
  realisasiSetelah: number
  bobotRealisasiSekarang: number
  bobotRealisasiSetelah: number
  capaianSekarang: number
  capaianSetelah: number
  melebihiTarget: boolean
}

export interface CatatanBukti {
  realisasiId: number
  tanggalKegiatan: string
  jumlahRealisasi: number
  keterangan: string
  logEntryName: string
  namaAktifitas: string
  kodeSubkegiatan: string
  namaSubkegiatan: string
  lampirans: RealisasiLampiran[]
}

export interface SimpanPeriodeInput {
  id?: number
  dokumenId: number | null
  namaPeriode: string
  tanggalMulai: string
  tanggalSelesai: string
}

export interface SimpanBidangInput {
  id?: number
  namaBidang: string
}

export interface SyaratBukaPeriode {
  boleh: boolean
  bidangBelumSiap: string[]
  adaPeriodeLainTerbuka: string | null
}

export interface RincianBidangProgram {
  bidangId: number
  namaBidang: string
  jumlahSubkegiatan: number
  capaian: number
}

export interface RincianKegiatanProgram {
  kegiatanId: number
  kodeKegiatan: string
  namaKegiatan: string
  jumlahSubkegiatan: number
  capaian: number
}

export interface ProgramBerurusan {
  programId: number
  kodeProgram: string
  namaProgram: string
  capaian: number
  jumlahSubkegiatan: number
  perBidang: RincianBidangProgram[]
  perKegiatan: RincianKegiatanProgram[]
}

export interface AktifitasRinci {
  indikatorBidangId: number
  namaAktifitas: string
  tipeAktifitas: TipeAktifitas
  satuan: string
  bobotTarget: number
  target: number
  realisasi: number
  bobotRealisasi: number
  jumlahCatatan: number
}

export interface SubkegiatanRinci {
  subkegiatanBidangId: number
  kode: string
  nama: string
  indikatorKinerja: string
  outputKinerja: string
  namaBidang: string
  bidangId: number
  target: number
  satuan: string
  capaian: number
  aktifitas: AktifitasRinci[]
}

export type StatusDokumen = "AKTIF" | "ARSIP"

export interface Dokumen {
  id: number
  nama: string
  tahunMulai: number
  tahunSelesai: number
  status: StatusDokumen
  flagActive: boolean
  keterangan: string | null
}

export interface SimpanDokumenInput {
  id?: number
  nama: string
  tahunMulai: number
  tahunSelesai: number
  status: StatusDokumen
  keterangan?: string | null
}

export interface DokumenDenganIsi extends Dokumen {
  jumlahProgram: number
  jumlahPeriode: number
}

export type AksiLog =
  | "BUAT" | "UBAH" | "HAPUS" | "NONAKTIFKAN" | "AKTIFKAN" | "PULIHKAN"
  | "BUKA_PERIODE" | "KUNCI_PERIODE"
  | "UBAH_BOBOT" | "TANDAI_SIAP" | "BATAL_SIAP" | "SALIN_RENCANA"
  | "CATAT_REALISASI" | "UNGGAH_BUKTI"
  | "LOGIN" | "GAGAL_LOGIN" | "LOGOUT"

export type GrupLog = "master" | "rencana" | "pelaksanaan" | "sesi"

export interface LogAktivitas {
  id: number
  waktu: string
  userId: number | null
  namaPengguna: string
  peran: Exclude<PeranPengguna, "publik">
  aksi: AksiLog
  entitas: string
  entitasId: number | null
  ringkasan: string
  periodeId: number | null
  bidangId: number | null
}

export interface SaringLog {
  bidangId?: number | null
  periodeId?: number
  userId?: number
  aksi?: AksiLog
  grup?: GrupLog
  perhatian?: boolean
  entitas?: string
  entitasId?: number
  cari?: string
  batas?: number
  halaman?: number
}

export interface RingkasanLog {
  total: number
  hariIni: number
  pengguna: number
  perhatian: number
  perHari: { tanggal: string; jumlah: number }[]
  perGrup: Record<GrupLog, number>
}

export type StatusAgenda = "RENCANA" | "SELESAI" | "BATAL"

export interface KonteksAgenda {
  bidangId: number | null
  namaBidang: string | null
  subkegiatanBidangId: number | null
  kodeSubkegiatan: string
  namaSubkegiatan: string
  namaAktifitas: string
  tipeAktifitas: "UTAMA" | "PENDUKUNG"
  satuan: string | null
}

export interface AgendaKegiatan {
  id: number
  aktifitasBidangId: number
  judulAgenda: string
  tanggalMulai: string
  tanggalSelesai: string
  jumlahRencana: number
  lokasi: string
  keterangan: string
  status: StatusAgenda
  terlewat: boolean
  logEntryName: string
  konteks: KonteksAgenda | null
}

export interface RealisasiKalender {
  id: number
  aktifitasBidangId: number
  tanggalKegiatan: string
  jumlahRealisasi: number
  keterangan: string
  logEntryName: string
  jumlahLampiran: number
  konteks: KonteksAgenda | null
}

export interface KalenderBulan {
  periode: Periode
  bulan: string
  rentang: { dari: string; sampai: string }
  dapatMenjadwalkan: boolean
  bidang: { id: number; namaBidang: string }[]
  ringkasan: { jumlahAgenda: number; jumlahRealisasi: number; agendaTerlewat: number }
  agenda: AgendaKegiatan[]
  realisasi: RealisasiKalender[]
}

export interface SimpanAgendaInput {
  id: number | null
  aktifitasBidangId: number
  judulAgenda: string
  tanggalMulai: string
  tanggalSelesai: string
  jumlahRencana: number
  lokasi: string
  keterangan: string
  status?: StatusAgenda
}
