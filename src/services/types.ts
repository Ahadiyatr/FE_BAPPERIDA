// Bentuk data mengikuti docs/erd.md (ERD TUJUAN), bukan skema API lama —
// lihat prinsip "Bentuk data dummy mengikuti ERD baru" di roadmap-refactor-ui.md.
// Fase 6 nanti hanya mengganti ISI fungsi di src/services/*.service.ts dari
// mock ke fetch/axios sungguhan; tipe di file ini tidak ikut berubah bentuk.

export type TipeAktifitas = "UTAMA" | "PENDUKUNG"
export type StatusPeriode = "DRAFT" | "OPEN" | "LOCKED"
export type TipeBerkas = "FOTO" | "DOKUMEN"
export type PeranPengguna = "publik" | "admin_bidang" | "admin_aplikasi"

/**
 * MASTER_URUSAN — tingkat di atas program (Excel: label "KINERJA URUSAN",
 * mis. "5.0.1.0 PERENCANAAN"). Belum ada di docs/erd.md; untuk sekarang
 * hanya dipakai sebagai pengelompokan tampilan. Capaian per urusan BELUM
 * punya rumus — lihat docs/keputusan-terbuka.md butir 2.
 */
export interface Urusan {
  id: number
  kodeUrusan: string
  namaUrusan: string
}

/** MASTER_PROGRAM — katalog murni, tanpa bidang/periode. */
export interface Program {
  id: number
  /** MASTER_DOKUMEN induk. KODE_PROGRAM unik per dokumen ini (PRD §3). */
  dokumenId: number
  urusanId: number
  kodeProgram: string
  namaProgram: string
  flagActive: boolean
}

/** MASTER_KEGIATAN */
export interface Kegiatan {
  id: number
  programId: number
  kodeKegiatan: string
  namaKegiatan: string
  flagActive: boolean
}

/** MASTER_INDIKATOR_UTAMA — tingkat subkegiatan. */
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

/** MASTER_INDIKATOR — tingkat aktifitas (utama atau pendukung). */
export interface Indikator {
  id: number
  indikatorUtamaId: number
  kodeIndikator: string
  namaIndikator: string
  tipeAktifitas: TipeAktifitas
  satuan: string
  /** Nilai anjuran, disalin ke TRANS_INDIKATOR_BIDANG.target saat penyusunan rencana. */
  targetAnjuran: number
  urutan: number
  flagActive: boolean
}

/** MASTER_BIDANG */
export interface Bidang {
  id: number
  kode: string
  namaBidang: string
  flagActive: boolean
}

/** MASTER_PERIODE */
export interface Periode {
  id: number
  /** RKPD tahun berjalan. Boleh null untuk periode lama yang belum dipetakan. */
  dokumenId: number | null
  namaPeriode: string
  tanggalMulai: string // ISO date
  tanggalSelesai: string // ISO date
  status: StatusPeriode
}

/** USERS. Satu user memegang SATU bidang (keputusan produk 28 Agustus 2026),
 * jadi USER_BIDANG pivot di erd.md tidak jadi dipakai. `null` untuk admin
 * aplikasi yang cakupannya seluruh perangkat daerah. */
export interface User {
  id: number
  name: string
  email: string
  role: Exclude<PeranPengguna, "publik">
  bidangId: number | null
  /** Padanan `deleted_at IS NULL` di ERD — nonaktifkan, bukan hapus. */
  flagActive: boolean
}

export interface SimpanUserInput {
  id?: number
  name: string
  email: string
  role: Exclude<PeranPengguna, "publik">
  bidangId: number | null
}

/**
 * TRANS_SUBKEGIATAN_BIDANG — jembatan katalog x bidang x periode.
 * Salinan beku: INDIKATOR_KINERJA/TARGET/SATUAN disalin dari master saat
 * rencana disusun, bukan direferensikan langsung, supaya arsip periode lama
 * tidak ikut bergeser kalau master diubah kemudian.
 */
export interface SubkegiatanBidang {
  id: number
  periodeId: number
  bidangId: number
  indikatorUtamaId: number
  indikatorKinerja: string
  target: number
  satuan: string
  /** Hasil rumus 70/30, maks 100. Dihitung, bukan diinput. */
  capaian: number
}

/** TRANS_INDIKATOR_BIDANG — rincian aktifitas per subkegiatan-bidang. */
export interface IndikatorBidang {
  id: number
  subkegiatanBidangId: number
  masterIndikatorId: number
  /** Aktivitas tambahan pada rencana; hanya jenis ini yang dapat dihapus. */
  flagAdhoc: boolean
  tipeAktifitas: TipeAktifitas
  namaAktifitas: string
  /** Salinan beku: 70 untuk UTAMA, 30/n untuk PENDUKUNG saat rencana disusun. */
  bobotTarget: number
  target: number
  realisasi: number
  /** (realisasi / target) x bobotTarget */
  bobotRealisasi: number
  urutan: number
}

/** TRANS_REALISASI_KEGIATAN */
export interface RealisasiKegiatan {
  id: number
  indikatorBidangId: number
  tanggalKegiatan: string // ISO date
  jumlahRealisasi: number
  keterangan: string
  createdBy: number
  logEntryName: string
}

/** TRANS_REALISASI_LAMPIRAN */
export interface RealisasiLampiran {
  id: number
  realisasiId: number
  tipeBerkas: TipeBerkas
  namaBerkas: string
  pathBerkas: string
  ukuranByte: number
}

/** Rincian 70/30 siap-tayang untuk BobotMeter/BobotLedger — bukan tabel ERD,
 * ini bentuk gabungan yang dikembalikan capaian.service.ts ke komponen. */
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
  dokumen?: File | null
}

/* ─────────────────────────────────────────────────────────────
   Masukan tulis untuk layar Data Master (Fase 1).
   Tanda tangan ini sudah final: Fase 6 mengganti isi fungsinya
   dengan POST/PUT ke opera-backend, bentuk parameternya tetap.
   `id` kosong = tambah baru, `id` terisi = ubah.
   ───────────────────────────────────────────────────────────── */

export interface OpsiMaster {
  /** Layar master perlu melihat baris nonaktif supaya bisa diaktifkan lagi.
   * Layar lain memakai bawaan (hanya yang aktif). */
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

/**
 * Indikator + bobot target TURUNAN.
 * Bobot sengaja tidak disimpan di MASTER_INDIKATOR: ia dihitung dari jumlah
 * pendukung yang sedang aktif (70 untuk UTAMA, 30/n untuk PENDUKUNG), supaya
 * tidak mungkin melenceng dari kenyataan saat satu pendukung dinonaktifkan.
 * Nilai beku per periode tetap hidup di TRANS_INDIKATOR_BIDANG.bobotTarget.
 */
export interface AktifitasDenganBobot extends Indikator {
  bobotTarget: number
}

/* ─────────────────────────────────────────────────────────────
   Penyusunan rencana (Fase 2).

   CATATAN ERD: status kesiapan per bidang per periode BELUM ada di
   docs/erd.md. Mockup memerlukannya ("Tandai bidang ini siap", dan
   "Buka periode untuk pencatatan" baru aktif setelah semua bidang siap),
   jadi ia hidup di lapisan mock dulu. Usulan tempat permanennya:
   tabel TRANS_KESIAPAN_BIDANG tersendiri (aktor + waktu penandaan).
   ───────────────────────────────────────────────────────────── */

export type StatusKesiapan = "DRAFT" | "SIAP"

export interface KesiapanBidang {
  bidangId: number
  namaBidang: string
  periodeId: number
  status: StatusKesiapan
  /** Jumlah subkegiatan yang dipegang bidang ini pada periode tsb. */
  jumlahSubkegiatan: number
  /** Yang sudah lolos pemeriksaan penghalang (punya indikator + target). */
  jumlahLengkap: number
}

export type NadaPemeriksaan = "ok" | "warn" | "bad"

export interface ButirPemeriksaan {
  nada: NadaPemeriksaan
  judul: string
  rincian: string
  /** `bad` menghalangi penandaan siap; `warn` hanya memberi tahu. */
  menghalangi: boolean
}

export interface HasilPemeriksaan {
  butir: ButirPemeriksaan[]
  /** Jumlah subkegiatan yang masih menghalangi. 0 = boleh ditandai siap. */
  jumlahMenghalangi: number
  bolehTandaiSiap: boolean
}

/** Satu subkegiatan dalam rencana satu bidang, beserta aktifitasnya. */
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

/** Subkegiatan di katalog yang belum dipegang bidang mana pun pada satu periode. */
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
  /** Kosong = seluruh bidang. */
  bidangIds?: number[]
  ikutStruktur: boolean
  ikutAktifitas: boolean
  ikutTarget: boolean
  /** Subkegiatan yang capaiannya nol di periode sumber — bawaan tidak ikut. */
  ikutCapaianNol: boolean
}

export interface HasilSalinRencana {
  jumlahSubkegiatan: number
  jumlahAktifitas: number
  jumlahBidangDitimpa: number
}

/* ─────────────────────────────────────────────────────────────
   Rollup capaian.
   Keputusan produk 29 Agu 2026: tidak ada bobot antarbidang. Capaian
   Perangkat Daerah = rata-rata langsung seluruh capaian subkegiatan.
   ───────────────────────────────────────────────────────────── */

/** Baris ranking bidang di dashboard. Dihitung saat diminta, bukan disimpan —
 * lihat catatan TRANS_CAPAIAN_BIDANG di capaian.service.ts. Capaian per bidang
 * adalah informasi; tidak memengaruhi angka capaian PD. */
export interface CapaianBidang {
  bidangId: number
  namaBidang: string
  /** Rata-rata capaian subkegiatan yang dipegang bidang ini. */
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
  /** Rata-rata langsung seluruh capaian subkegiatan periode ini. */
  capaianPd: number
  jumlahBidang: number
  jumlahBidangSiap: number
  jumlahSubkegiatan: number
  jumlahAktifitas: number
  jumlahRealisasi: number
}

/** Satu baris telusur Struktur Program: katalog + penugasan bidang + capaian
 * periode terpilih, sudah digabung di service supaya komponen tidak perlu
 * menyentuh lapisan mock. */
export interface SubkegiatanStruktur {
  indikatorUtamaId: number
  kode: string
  nama: string
  indikatorKinerja: string
  /** null kalau belum ditugaskan ke bidang mana pun pada periode tsb. */
  namaBidang: string | null
  capaian: number | null
}

/* ─────────────────────────────────────────────────────────────
   Pencatatan realisasi & bukti (Fase 4).
   ───────────────────────────────────────────────────────────── */

/** Satu aktifitas siap-catat, sudah dibawa konteks subkegiatannya. */
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
  /** realisasi >= target */
  selesai: boolean
}

/** Pratinjau efek sebelum simpan — dihitung di service supaya rumusnya
 * tidak diduplikasi di komponen (REFACTOR.md § 3). */
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
  /** Realisasi melampaui target — diperbolehkan, tapi kelebihannya tidak
   * menambah capaian karena subkegiatan dibatasi 100%. */
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

/* ── Fase 5: periode, master bidang, pengguna ───────────────── */

export interface SimpanPeriodeInput {
  id?: number
  dokumenId: number | null
  namaPeriode: string
  tanggalMulai: string
  tanggalSelesai: string
}

export interface SimpanBidangInput {
  id?: number
  kode: string
  namaBidang: string
}

/** Alasan sebuah periode belum boleh dibuka. Kosong = boleh. */
export interface SyaratBukaPeriode {
  boleh: boolean
  bidangBelumSiap: string[]
  adaPeriodeLainTerbuka: string | null
}

/* ─────────────────────────────────────────────────────────────
   Layar Capaian Program.
   Angka capaian di sini memakai asumsi sementara — lihat
   docs/keputusan-terbuka.md butir 1 di opera-ink-fe-bundle.
   ───────────────────────────────────────────────────────────── */

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
  /** Hanya bidang yang benar-benar memegang subkegiatan di program ini. */
  perBidang: RincianBidangProgram[]
  perKegiatan: RincianKegiatanProgram[]
}

/** Satu aktifitas dalam rincian capaian — salinan beku dari TRANS_INDIKATOR_BIDANG. */
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

/** Subkegiatan beserta aktifitasnya, untuk telusur capaian sampai dasar. */
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

/* ─────────────────────────────────────────────────────────────
   MASTER_DOKUMEN — dokumen perencanaan.

   PRD §3 (non-negotiable): KODE_PROGRAM unik per DOKUMEN_ID, bukan global.
   Belum ada di docs/erd.md — perlu ditambahkan sebelum Fase 6.

   Dua tingkat, keputusan produk 29 Agustus 2026:
     RPJMD (5 tahun)  →  menaungi  →  RKPD (tahunan)
   Program hidup di RPJMD. Periode triwulanan menunjuk RKPD tahun berjalan.

   PEWARISAN SENGAJA DITUNDA (PRD §7 poin 5 belum final): tidak ada
   `diwarisiDariId` maupun tabel pivot sampai ada RPJMD kedua yang nyata.
   Jangan menambahkannya tanpa keputusan eksplisit.
   ───────────────────────────────────────────────────────────── */

export type JenisDokumen = "RPJMD" | "RKPD"
export type StatusDokumen = "DRAFT" | "AKTIF" | "ARSIP"

export interface Dokumen {
  id: number
  kode: string
  nama: string
  jenis: JenisDokumen
  /** RKPD menunjuk RPJMD induknya. RPJMD selalu null. */
  indukId: number | null
  tahunMulai: number
  tahunSelesai: number
  status: StatusDokumen
  flagActive: boolean
}

export interface SimpanDokumenInput {
  id?: number
  kode: string
  nama: string
  jenis: JenisDokumen
  indukId: number | null
  tahunMulai: number
  tahunSelesai: number
  status: StatusDokumen
}

/** Dokumen + hitungan isinya, untuk daftar di layar master. */
export interface DokumenDenganIsi extends Dokumen {
  namaInduk: string | null
  jumlahProgram: number
  jumlahPeriode: number
  anak: DokumenDenganIsi[]
}

/* ─────────────────────────────────────────────────────────────
   TRANS_LOG_AKTIVITAS — jejak audit.

   PRD §5 mencatat modul ini ⬜ tapi menegaskan kolom CREATED_BY /
   LOG_ENTRY_NAME di skema memang mengasumsikannya akan ada.
   Belum ada di docs/erd.md — perlu ditambahkan sebelum Fase 6.

   Pelaku diambil dari sesi (lihat src/services/sesi.ts), bukan dari
   parameter tiap fungsi — supaya tanda tangan service tidak berubah saat
   Fase 6 mengganti sumbernya dengan sesi login sungguhan.

   `namaPengguna` adalah SALINAN BEKU, sama alasannya dengan
   TRANS_REALISASI_KEGIATAN.LOG_ENTRY_NAME: pengguna bisa dinonaktifkan
   atau berganti nama, jejaknya tidak boleh ikut berubah.
   ───────────────────────────────────────────────────────────── */

export type AksiLog =
  | "BUAT" | "UBAH" | "HAPUS" | "NONAKTIFKAN" | "AKTIFKAN"
  | "BUKA_PERIODE" | "KUNCI_PERIODE"
  | "UBAH_BOBOT" | "TANDAI_SIAP" | "BATAL_SIAP" | "SALIN_RENCANA"
  | "CATAT_REALISASI" | "UNGGAH_BUKTI"

export interface LogAktivitas {
  id: number
  waktu: string
  userId: number | null
  /** Salinan beku nama pelaku saat kejadian. */
  namaPengguna: string
  peran: Exclude<PeranPengguna, "publik">
  aksi: AksiLog
  /** Nama tabel yang disentuh, mis. "MASTER_PERIODE". */
  entitas: string
  entitasId: number | null
  /** Kalimat siap-baca, bukan diff mentah. */
  ringkasan: string
  periodeId: number | null
  bidangId: number | null
}

export interface SaringLog {
  /** Admin bidang hanya boleh melihat jejak bidangnya sendiri (PRD §4). */
  bidangId?: number | null
  periodeId?: number
  aksi?: AksiLog
  /** Cari di ringkasan dan nama pelaku. */
  cari?: string
  batas?: number
}
