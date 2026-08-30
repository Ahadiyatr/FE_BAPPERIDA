import {
  getProgram, getKegiatanByProgram, getKegiatan,
  getSubkegiatanByKegiatan, getSubkegiatan, getAktifitasByIndikatorUtama,
  setAktifProgram, setAktifKegiatan, setAktifSubkegiatan, setAktifAktifitas,
} from "@/services"
import type {
  AktifitasDenganBobot, Indikator, IndikatorUtama, Kegiatan, OpsiMaster, Program,
} from "@/services"

export type IdTingkat = "program" | "kegiatan" | "subkegiatan" | "aktifitas"

export const URUT_TINGKAT: IdTingkat[] = ["program", "kegiatan", "subkegiatan", "aktifitas"]

export type BarisMaster = Program | Kegiatan | IndikatorUtama | AktifitasDenganBobot

export interface DefTingkat {
  id: IdTingkat
  label: string
  /** Label eyebrow di ChainNav. */
  tingkat: string
  induk: IdTingkat | null
  /** Anak langsung — dipakai untuk kolom "turun tingkat". */
  anak: IdTingkat | null
  ambil: (indukId: number | null, opsi: OpsiMaster) => Promise<BarisMaster[]>
  setAktif: (id: number, aktif: boolean) => Promise<unknown>
}

export const TINGKAT: Record<IdTingkat, DefTingkat> = {
  program: {
    id: "program", label: "Program", tingkat: "Tingkat 1",
    induk: null, anak: "kegiatan",
    ambil: (_i, o) => getProgram(o),
    setAktif: setAktifProgram,
  },
  kegiatan: {
    id: "kegiatan", label: "Kegiatan", tingkat: "Tingkat 2",
    induk: "program", anak: "subkegiatan",
    ambil: (i, o) => (i == null ? getKegiatan(o) : getKegiatanByProgram(i, o)),
    setAktif: setAktifKegiatan,
  },
  subkegiatan: {
    id: "subkegiatan", label: "Subkegiatan", tingkat: "Tingkat 3",
    induk: "kegiatan", anak: "aktifitas",
    ambil: (i, o) => (i == null ? getSubkegiatan(o) : getSubkegiatanByKegiatan(i, o)),
    setAktif: setAktifSubkegiatan,
  },
  aktifitas: {
    id: "aktifitas", label: "Aktivitas", tingkat: "Tingkat 4",
    induk: "subkegiatan", anak: null,
    // Bobot 30%÷n hanya bermakna dalam satu subkegiatan, jadi tingkat ini
    // selalu butuh induk. Tanpa induk daftarnya sengaja kosong.
    ambil: (i, o) => (i == null ? Promise.resolve([]) : getAktifitasByIndikatorUtama(i, o)),
    setAktif: setAktifAktifitas,
  },
}

/* ── pembaca kolom lintas-tingkat ───────────────────────────── */

export function kodeDari(r: BarisMaster): string {
  if ("kodeProgram" in r) return r.kodeProgram
  if ("kodeKegiatan" in r) return r.kodeKegiatan
  if ("kodeIndikatorUtama" in r) return r.kodeIndikatorUtama
  return r.kodeIndikator
}

export function namaDari(r: BarisMaster): string {
  if ("namaProgram" in r) return r.namaProgram
  if ("namaKegiatan" in r) return r.namaKegiatan
  if ("namaIndikatorUtama" in r) return r.namaIndikatorUtama
  return r.namaIndikator
}

export const adalahAktifitas = (r: BarisMaster): r is AktifitasDenganBobot =>
  "tipeAktifitas" in r

export const adalahSubkegiatan = (r: BarisMaster): r is IndikatorUtama =>
  "indikatorKinerja" in r

export type { AktifitasDenganBobot, Indikator, IndikatorUtama, Kegiatan, Program }
