import type { AksiLog, GrupLog, LogAktivitas } from "@/services"

/* Logika murni layar Log Aktivitas — dipisah dari komponen supaya bisa diuji tanpa DOM. */

export type NadaAksi = "positif" | "netral" | "info" | "waspada" | "kritis"

interface MetaAksi {
  label: string
  grup: GrupLog
  nada: NadaAksi
  /** 0 biasa, 1 perlu perhatian, 2 kritis. Himpunan berat ≥ 1 = `LogAktivitasController::PERHATIAN`. */
  berat: 0 | 1 | 2
  /** Kata kerja untuk kalimat rangkaian ("Membuat 6 kegiatan"). */
  kerja?: string
}

/** Warna menandai berat-ringannya tindakan, bukan jenis datanya. */
export const META_AKSI: Record<AksiLog, MetaAksi> = {
  BUAT: { label: "Tambah", grup: "master", nada: "positif", berat: 0, kerja: "Membuat" },
  UBAH: { label: "Ubah", grup: "master", nada: "netral", berat: 0, kerja: "Mengubah" },
  HAPUS: { label: "Hapus", grup: "master", nada: "kritis", berat: 2, kerja: "Menghapus" },
  NONAKTIFKAN: { label: "Nonaktifkan", grup: "master", nada: "kritis", berat: 2, kerja: "Menonaktifkan" },
  AKTIFKAN: { label: "Aktifkan", grup: "master", nada: "positif", berat: 0, kerja: "Mengaktifkan" },
  PULIHKAN: { label: "Pulihkan", grup: "master", nada: "positif", berat: 0, kerja: "Memulihkan" },
  BUKA_PERIODE: { label: "Buka periode", grup: "rencana", nada: "waspada", berat: 1 },
  KUNCI_PERIODE: { label: "Kunci periode", grup: "rencana", nada: "waspada", berat: 2 },
  UBAH_BOBOT: { label: "Ubah bobot", grup: "rencana", nada: "waspada", berat: 1, kerja: "Mengubah bobot" },
  SALIN_RENCANA: { label: "Salin rencana", grup: "rencana", nada: "waspada", berat: 1 },
  TANDAI_SIAP: { label: "Tandai siap", grup: "rencana", nada: "positif", berat: 0 },
  BATAL_SIAP: { label: "Batal siap", grup: "rencana", nada: "netral", berat: 1 },
  CATAT_REALISASI: { label: "Catat realisasi", grup: "pelaksanaan", nada: "info", berat: 0, kerja: "Mencatat realisasi" },
  UNGGAH_BUKTI: { label: "Unggah bukti", grup: "pelaksanaan", nada: "info", berat: 0, kerja: "Mengunggah bukti" },
  LOGIN: { label: "Masuk", grup: "sesi", nada: "netral", berat: 0 },
  GAGAL_LOGIN: { label: "Gagal masuk", grup: "sesi", nada: "kritis", berat: 1 },
  LOGOUT: { label: "Keluar", grup: "sesi", nada: "netral", berat: 0 },
}

export const LABEL_GRUP: Record<GrupLog, string> = {
  master: "Data master",
  rencana: "Periode & rencana",
  pelaksanaan: "Pelaksanaan",
  sesi: "Sesi masuk",
}

const LABEL_ENTITAS: Record<string, string> = {
  MASTER_DOKUMEN_PERENCANAAN: "Dokumen perencanaan",
  MASTER_PROGRAM: "Program",
  MASTER_KEGIATAN: "Kegiatan",
  MASTER_SUBKEGIATAN: "Subkegiatan",
  MASTER_AKTIFITAS: "Aktifitas",
  MASTER_BIDANG: "Bidang",
  MASTER_PERIODE: "Periode",
  TRANS_SUBKEGIATAN_BIDANG: "Rencana bidang",
  TRANS_AKTIFITAS_BIDANG: "Rencana aktifitas",
  TRANS_KESIAPAN_BIDANG: "Kesiapan rencana",
  TRANS_REALISASI_KEGIATAN: "Realisasi",
  TRANS_REALISASI_LAMPIRAN: "Bukti kegiatan",
  TRANS_JADWAL_KEGIATAN: "Jadwal kegiatan",
  USERS: "Pengguna",
}

/** Nama tabel mentah → nama yang dikenali pengguna. Tabel baru tampil apa adanya. */
export const labelEntitas = (entitas: string) =>
  LABEL_ENTITAS[entitas.toUpperCase()] ?? entitas

/* `waktu` dikirim dengan offset +08:00. Hari dan jam dibaca dalam WITA, bukan zona
   browser, supaya kejadian dekat tengah malam tidak pindah hari. */
const ZONA = "Asia/Makassar"
const fmtTanggal = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" })
const fmtJam = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

export const tanggalWita = (iso: string | Date) => fmtTanggal.format(new Date(iso))
export const jamWita = (iso: string) => fmtJam.format(new Date(iso)).replace(":", ".")

export function judulHari(tanggal: string, hariIni = tanggalWita(new Date())) {
  const selisih = Math.round((Date.parse(hariIni) - Date.parse(tanggal)) / 864e5)
  const lengkap = new Date(`${tanggal}T12:00:00+08:00`).toLocaleDateString("id-ID", {
    timeZone: ZONA, weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
  if (selisih === 0) return { utama: "Hari ini", sekunder: lengkap }
  if (selisih === 1) return { utama: "Kemarin", sekunder: lengkap }
  return { utama: lengkap, sekunder: null }
}

export function kelompokkanPerHari(baris: LogAktivitas[]) {
  const peta = new Map<string, LogAktivitas[]>()
  for (const b of baris) {
    const t = tanggalWita(b.waktu)
    peta.set(t, [...(peta.get(t) ?? []), b])
  }
  return [...peta].map(([tanggal, isi]) => ({ tanggal, isi }))
}

export type ButirLinimasa =
  | { jenis: "tunggal"; baris: LogAktivitas }
  | { jenis: "rangkaian"; baris: LogAktivitas[] }

const JEDA_RANGKAIAN_MS = 15 * 60_000
const MIN_RANGKAIAN = 3

/**
 * Kejadian beruntun — pelaku, tindakan, dan tabel sama, jeda antar-kejadian ≤ 15 menit —
 * dilipat menjadi satu butir. Masukan harus terbaru-dulu dan berasal dari satu hari.
 * Sesi masuk tidak pernah dilipat: tiap login adalah bukti tersendiri.
 */
export function lipatBeruntun(baris: LogAktivitas[]): ButirLinimasa[] {
  const kelompok: LogAktivitas[][] = []
  for (const b of baris) {
    const akhir = kelompok[kelompok.length - 1]
    const prev = akhir?.[akhir.length - 1]
    const sambung =
      prev &&
      META_AKSI[b.aksi]?.grup !== "sesi" &&
      prev.userId === b.userId &&
      prev.namaPengguna === b.namaPengguna &&
      prev.aksi === b.aksi &&
      prev.entitas === b.entitas &&
      Date.parse(prev.waktu) - Date.parse(b.waktu) <= JEDA_RANGKAIAN_MS
    if (sambung) akhir.push(b)
    else kelompok.push([b])
  }
  return kelompok.flatMap((k): ButirLinimasa[] =>
    k.length >= MIN_RANGKAIAN
      ? [{ jenis: "rangkaian", baris: k }]
      : k.map(baris => ({ jenis: "tunggal", baris })),
  )
}

export type PotonganRingkasan = { jenis: "teks" | "kode" | "nama"; isi: string }

/** Pecah ringkasan untuk ditampilkan: kode berjenjang (5.01.02) dan nama dalam kutip disorot. */
export function pecahRingkasan(teks: string): PotonganRingkasan[] {
  const hasil: PotonganRingkasan[] = []
  const pola = /"([^"]+)"|\b(\d+(?:\.\d+)+)\b/g
  let posisi = 0
  for (const m of teks.matchAll(pola)) {
    if (m.index > posisi) hasil.push({ jenis: "teks", isi: teks.slice(posisi, m.index) })
    hasil.push(m[1] !== undefined ? { jenis: "nama", isi: m[1] } : { jenis: "kode", isi: m[2] })
    posisi = m.index + m[0].length
  }
  if (posisi < teks.length) hasil.push({ jenis: "teks", isi: teks.slice(posisi) })
  return hasil
}

/** "Membuat 6 kegiatan" — atau "6× Kunci periode" bila tindakan tak punya kata kerja. */
export function kalimatRangkaian(baris: LogAktivitas[]) {
  const meta = META_AKSI[baris[0].aksi]
  const n = baris.length
  return meta?.kerja
    ? `${meta.kerja} ${n} ${labelEntitas(baris[0].entitas).toLowerCase()}`
    : `${n}× ${meta?.label ?? baris[0].aksi}`
}
