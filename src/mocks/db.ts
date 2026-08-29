// Store in-memory MUTABLE — sengaja satu instance dibagi oleh semua
// service, bukan array beku per file. Ini yang membuat "catat realisasi
// di Fase 4 lalu dashboard Fase 3 ikut berubah tanpa reload" (kriteria
// keluar Fase 4 di roadmap) benar-benar bisa didemokan.
//
// Fase 6 nanti mengganti seluruh isi src/services/*.service.ts dengan
// panggilan API sungguhan — file ini dan seluruh src/mocks/ boleh dihapus
// atau disimpan sebagai mode demo (lihat roadmap-refactor-ui.md § Fase 6).

import { dokumens as seedDokumens } from "./data/dokumen"
import { urusans as seedUrusans } from "./data/urusan"
import { programs as seedPrograms } from "./data/program"
import { kegiatans as seedKegiatans } from "./data/kegiatan"
import { subkegiatans as seedSubkegiatans } from "./data/subkegiatan"
import { aktifitas as seedAktifitas } from "./data/aktifitas"
import { penugasanAwal } from "./data/penugasan-awal"
import { bidangs as seedBidangs, bidangByKode } from "./data/bidang"
import { periodes as seedPeriodes, periodeAktif } from "./data/periode"
import { users as seedUsers, usersByBidang } from "./data/users"
import { bobotTargetPendukung, bobotRealisasi, BOBOT_TARGET_UTAMA, capaianSubkegiatan } from "@/lib/bobot"
import { mulberry32, randInt, pick } from "@/lib/random"
import { getPelaku } from "@/services/sesi"
import type {
  Dokumen,
  Urusan,
  Program,
  Kegiatan,
  IndikatorUtama,
  Indikator,
  Bidang,
  Periode,
  User,
  SubkegiatanBidang,
  IndikatorBidang,
  RealisasiKegiatan,
  RealisasiLampiran,
  StatusKesiapan,
  AksiLog,
  LogAktivitas,
} from "@/services/types"

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

interface Store {
  dokumens: Dokumen[]
  urusans: Urusan[]
  programs: Program[]
  kegiatans: Kegiatan[]
  subkegiatans: IndikatorUtama[]
  aktifitas: Indikator[]
  bidangs: Bidang[]
  periodes: Periode[]
  users: User[]
  subkegiatanBidangs: SubkegiatanBidang[]
  indikatorBidangs: IndikatorBidang[]
  realisasis: RealisasiKegiatan[]
  lampirans: RealisasiLampiran[]
  /** Status kesiapan penyusunan rencana — lihat catatan ERD di types.ts. */
  kesiapans: { periodeId: number; bidangId: number; status: StatusKesiapan }[]
  /** TRANS_LOG_AKTIVITAS — jejak audit. Lihat catatan di types.ts. */
  logs: LogAktivitas[]
}

export function nextId<T extends { id: number }>(rows: T[]): number {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1
}

function tanggalAcakDalamPeriode(rng: () => number, periode: Periode): string {
  const mulai = new Date(periode.tanggalMulai).getTime()
  const selesai = new Date(periode.tanggalSelesai).getTime()
  const t = mulai + rng() * Math.max(selesai - mulai, 0)
  return new Date(t).toISOString().slice(0, 10)
}

/** Membangun TRANS_SUBKEGIATAN_BIDANG + TRANS_INDIKATOR_BIDANG untuk satu
 * periode dari katalog master + penugasan bidang — persis simulasi hasil
 * "penyusunan rencana" (Fase 2), dipakai di sini sebagai benih periode aktif
 * supaya Fase 3/4 punya data untuk didemokan sejak Fase 0. */
function susunRencana(
  periode: Periode,
  subkegiatans: IndikatorUtama[],
  aktifitasSemua: Indikator[]
): { subkegiatanBidangs: SubkegiatanBidang[]; indikatorBidangs: IndikatorBidang[] } {
  const subkegiatanBidangs: SubkegiatanBidang[] = []
  const indikatorBidangs: IndikatorBidang[] = []
  let skbId = 1
  let ibId = 1

  for (const sub of subkegiatans) {
    const kodeBidang = penugasanAwal[sub.id]
    const bidang = kodeBidang ? bidangByKode(kodeBidang) : undefined
    if (!bidang) continue // tidak ada penugasan — lewati, jangan mengarang bidang

    const skb: SubkegiatanBidang = {
      id: skbId++,
      periodeId: periode.id,
      bidangId: bidang.id,
      indikatorUtamaId: sub.id,
      indikatorKinerja: sub.indikatorKinerja,
      target: sub.targetKinerja,
      satuan: sub.satuanKinerja,
      capaian: 0, // dihitung ulang setelah realisasi digenerate
    }
    subkegiatanBidangs.push(skb)

    const aktifitasSub = aktifitasSemua.filter((a) => a.indikatorUtamaId === sub.id)
    const jumlahPendukung = aktifitasSub.filter((a) => a.tipeAktifitas === "PENDUKUNG").length

    for (const a of aktifitasSub) {
      const bobotTarget =
        a.tipeAktifitas === "UTAMA" ? BOBOT_TARGET_UTAMA : bobotTargetPendukung(jumlahPendukung)
      indikatorBidangs.push({
        id: ibId++,
        subkegiatanBidangId: skb.id,
        masterIndikatorId: a.id,
        flagAdhoc: false,
        tipeAktifitas: a.tipeAktifitas,
        namaAktifitas: a.namaIndikator,
        bobotTarget,
        target: a.targetAnjuran,
        realisasi: 0,
        bobotRealisasi: 0,
        urutan: a.urutan,
      })
    }
  }

  return { subkegiatanBidangs, indikatorBidangs }
}

/** Membangkitkan realisasi contoh berbenih untuk satu periode — deterministik
 * (benih tetap) supaya KPI dashboard tidak berubah tiap refresh, hanya kalau
 * benihnya sengaja diganti. ~20% aktifitas sengaja dibiarkan tanpa realisasi
 * untuk mendemokan "tabel aktifitas belum lengkap" (Fase 4). */
function bangkitkanRealisasi(
  seed: number,
  periode: Periode,
  indikatorBidangs: IndikatorBidang[],
  subkegiatanBidangs: SubkegiatanBidang[]
): { realisasis: RealisasiKegiatan[]; lampirans: RealisasiLampiran[] } {
  const rng = mulberry32(seed)
  const realisasis: RealisasiKegiatan[] = []
  const lampirans: RealisasiLampiran[] = []
  let realId = 1
  let lampId = 1

  const skbById = new Map(subkegiatanBidangs.map((s) => [s.id, s]))

  for (const ib of indikatorBidangs) {
    if (rng() < 0.2) continue // belum dicatat sama sekali

    const skb = skbById.get(ib.subkegiatanBidangId)!
    const pengguna = usersByBidang(skb.bidangId)
    const pencatat: User = pengguna.length > 0 ? pick(rng, pengguna) : seedUsers[0]

    const faktorCapaian = randInt(rng, 30, 105) / 100
    const totalRealisasi = Math.round(ib.target * faktorCapaian * 100) / 100
    const jumlahCatatan = randInt(rng, 1, 3)

    let sisa = totalRealisasi
    const tanggalList = Array.from({ length: jumlahCatatan }, () =>
      tanggalAcakDalamPeriode(rng, periode)
    ).sort()

    for (let i = 0; i < jumlahCatatan; i++) {
      const bagian =
        i === jumlahCatatan - 1
          ? sisa
          : Math.round((sisa / (jumlahCatatan - i)) * (0.6 + rng() * 0.8) * 100) / 100
      sisa = Math.round((sisa - bagian) * 100) / 100

      const realisasi: RealisasiKegiatan = {
        id: realId++,
        indikatorBidangId: ib.id,
        tanggalKegiatan: tanggalList[i],
        jumlahRealisasi: Math.max(bagian, 0),
        keterangan: `Realisasi ${ib.namaAktifitas} — pencatatan ke-${i + 1}.`,
        createdBy: pencatat.id,
        logEntryName: pencatat.name,
      }
      realisasis.push(realisasi)

      if (rng() < 0.5) {
        const tipe = rng() < 0.5 ? "FOTO" : "DOKUMEN"
        lampirans.push({
          id: lampId++,
          realisasiId: realisasi.id,
          tipeBerkas: tipe,
          namaBerkas: tipe === "FOTO" ? `dokumentasi-${realisasi.id}.jpg` : `laporan-${realisasi.id}.pdf`,
          pathBerkas: `mock://lampiran/${realisasi.id}`,
          ukuranByte: randInt(rng, 80_000, 3_500_000),
        })
      }
    }

    // Realisasi bisa melebihi anjuran (over-achievement) — sengaja tidak
    // di-clamp di sini, lihat catatan di src/lib/bobot.ts.
    ib.realisasi = Math.round(totalRealisasi * 100) / 100
    ib.bobotRealisasi = bobotRealisasi(ib.realisasi, ib.target, ib.bobotTarget)
  }

  return { realisasis, lampirans }
}

function bangunStore(): Store {
  const store: Store = {
    dokumens: clone(seedDokumens),
    urusans: clone(seedUrusans),
    programs: clone(seedPrograms),
    kegiatans: clone(seedKegiatans),
    subkegiatans: clone(seedSubkegiatans),
    aktifitas: clone(seedAktifitas),
    bidangs: clone(seedBidangs),
    periodes: clone(seedPeriodes),
    users: clone(seedUsers),
    subkegiatanBidangs: [],
    indikatorBidangs: [],
    realisasis: [],
    lampirans: [],
    kesiapans: [],
    logs: [],
  }

  const aktif = store.periodes.find((p) => p.id === periodeAktif().id)!
  const { subkegiatanBidangs, indikatorBidangs } = susunRencana(
    aktif,
    store.subkegiatans,
    store.aktifitas
  )
  const { realisasis, lampirans } = bangkitkanRealisasi(
    424242,
    aktif,
    indikatorBidangs,
    subkegiatanBidangs
  )

  for (const skb of subkegiatanBidangs) {
    const bobotList = indikatorBidangs
      .filter((ib) => ib.subkegiatanBidangId === skb.id)
      .map((ib) => ib.bobotRealisasi)
    skb.capaian = capaianSubkegiatan(bobotList)
  }

  store.subkegiatanBidangs = subkegiatanBidangs
  store.indikatorBidangs = indikatorBidangs
  store.realisasis = realisasis
  store.lampirans = lampirans

  return store
}

// Singleton modul — satu kali dibangun, dipakai bersama semua service
// selama sesi browser berjalan (reload halaman = reset ke benih awal).
export const db = bangunStore()

export function catatRealisasiKeStore(input: {
  indikatorBidangId: number
  tanggalKegiatan: string
  jumlahRealisasi: number
  keterangan: string
  createdBy: number
}): RealisasiKegiatan {
  const ib = db.indikatorBidangs.find((r) => r.id === input.indikatorBidangId)
  if (!ib) throw new Error(`IndikatorBidang ${input.indikatorBidangId} tidak ditemukan`)

  const pencatat = db.users.find((u) => u.id === input.createdBy)
  const realisasi: RealisasiKegiatan = {
    id: nextId(db.realisasis),
    indikatorBidangId: input.indikatorBidangId,
    tanggalKegiatan: input.tanggalKegiatan,
    jumlahRealisasi: input.jumlahRealisasi,
    keterangan: input.keterangan,
    createdBy: input.createdBy,
    logEntryName: pencatat?.name ?? "Tidak diketahui",
  }
  db.realisasis.push(realisasi)

  // Susun ulang total realisasi & bobot aktifitas ini, lalu capaian subkegiatannya —
  // inilah yang membuat perubahan di sini langsung terlihat di dashboard (Fase 3)
  // tanpa reload, karena keduanya membaca array `db` yang sama.
  const totalRealisasi = db.realisasis
    .filter((r) => r.indikatorBidangId === ib.id)
    .reduce((a, r) => a + r.jumlahRealisasi, 0)
  ib.realisasi = Math.round(totalRealisasi * 100) / 100
  ib.bobotRealisasi = bobotRealisasi(ib.realisasi, ib.target, ib.bobotTarget)

  const skb = db.subkegiatanBidangs.find((s) => s.id === ib.subkegiatanBidangId)
  if (skb) {
    const bobotList = db.indikatorBidangs
      .filter((r) => r.subkegiatanBidangId === skb.id)
      .map((r) => r.bobotRealisasi)
    skb.capaian = capaianSubkegiatan(bobotList)
  }

  return realisasi
}

export function tambahLampiranKeStore(
  realisasiId: number,
  files: { nama: string; tipeBerkas: "FOTO" | "DOKUMEN"; ukuranByte: number; path: string }[]
): RealisasiLampiran[] {
  const realisasi = db.realisasis.find((r) => r.id === realisasiId)
  if (!realisasi) throw new Error(`Realisasi ${realisasiId} tidak ditemukan`)

  const dibuat = files.map((f) => {
    const lampiran: RealisasiLampiran = {
      id: nextId(db.lampirans),
      realisasiId,
      tipeBerkas: f.tipeBerkas,
      namaBerkas: f.nama,
      pathBerkas: f.path,
      ukuranByte: f.ukuranByte,
    }
    db.lampirans.push(lampiran)
    return lampiran
  })
  return dibuat
}


/**
 * Mencatat satu kejadian ke jejak audit.
 *
 * Pelaku diambil dari sesi, bukan parameter — kalau belum ada (mis. data
 * benih dibangun sebelum ada yang login), kejadian tetap dicatat dengan
 * nama "Sistem" supaya jejaknya tidak bolong diam-diam.
 */
export function catatLog(input: {
  aksi: AksiLog
  entitas: string
  entitasId?: number | null
  ringkasan: string
  periodeId?: number | null
  bidangId?: number | null
}): LogAktivitas {
  const pelaku = getPelaku()
  const row: LogAktivitas = {
    id: nextId(db.logs),
    waktu: new Date().toISOString(),
    userId: pelaku?.id ?? null,
    namaPengguna: pelaku?.nama ?? "Sistem",
    peran: pelaku?.peran ?? "admin_aplikasi",
    aksi: input.aksi,
    entitas: input.entitas,
    entitasId: input.entitasId ?? null,
    ringkasan: input.ringkasan,
    periodeId: input.periodeId ?? null,
    bidangId: input.bidangId ?? pelaku?.bidangId ?? null,
  }
  db.logs.push(row)
  return row
}
