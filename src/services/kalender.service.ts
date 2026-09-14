import { api, dataOf } from "./api"
import type {
  AgendaKegiatan,
  KalenderBulan,
  KonteksAgenda,
  Periode,
  RealisasiKalender,
  SimpanAgendaInput,
  StatusAgenda,
  StatusPeriode,
} from "./types"

type PeriodeRow = {
  id: number
  dokumen_id: number | null
  nama_periode: string
  tanggal_mulai: string
  tanggal_selesai: string
  status: StatusPeriode
}

type KonteksRow = {
  bidang_id: number | null
  nama_bidang: string | null
  subkegiatan_bidang_id: number | null
  kode_subkegiatan: string | null
  nama_subkegiatan: string | null
  nama_aktifitas: string | null
  tipe_aktifitas: "UTAMA" | "PENDUKUNG"
  satuan: string | null
}

type AgendaRow = {
  id: number
  aktifitas_bidang_id: number
  judul_agenda: string
  tanggal_mulai: string
  tanggal_selesai: string
  jumlah_rencana: number
  lokasi: string | null
  keterangan: string | null
  status: StatusAgenda
  terlewat: boolean
  log_entry_name: string
  konteks?: KonteksRow | null
}

type RealisasiRow = {
  id: number
  aktifitas_bidang_id: number
  tanggal_kegiatan: string
  jumlah_realisasi: number
  keterangan: string | null
  log_entry_name: string
  jumlah_lampiran: number
  konteks?: KonteksRow | null
}

type KalenderRow = {
  periode: PeriodeRow
  bulan: string
  rentang: { dari: string; sampai: string }
  dapat_menjadwalkan: boolean
  bidang: { id: number; nama_bidang: string }[]
  ringkasan: { jumlah_agenda: number; jumlah_realisasi: number; agenda_terlewat: number }
  agenda: AgendaRow[]
  realisasi: RealisasiRow[]
}

const periode = (r: PeriodeRow): Periode => ({
  id: r.id,
  dokumenId: r.dokumen_id,
  namaPeriode: r.nama_periode,
  tanggalMulai: r.tanggal_mulai,
  tanggalSelesai: r.tanggal_selesai,
  status: r.status,
})

const konteks = (r?: KonteksRow | null): KonteksAgenda | null =>
  r
    ? {
        bidangId: r.bidang_id,
        namaBidang: r.nama_bidang,
        subkegiatanBidangId: r.subkegiatan_bidang_id,
        kodeSubkegiatan: r.kode_subkegiatan ?? "",
        namaSubkegiatan: r.nama_subkegiatan ?? "",
        namaAktifitas: r.nama_aktifitas ?? "",
        tipeAktifitas: r.tipe_aktifitas,
        satuan: r.satuan,
      }
    : null

const agenda = (r: AgendaRow): AgendaKegiatan => ({
  id: r.id,
  aktifitasBidangId: r.aktifitas_bidang_id,
  judulAgenda: r.judul_agenda,
  tanggalMulai: r.tanggal_mulai,
  tanggalSelesai: r.tanggal_selesai,
  jumlahRencana: Number(r.jumlah_rencana),
  lokasi: r.lokasi ?? "",
  keterangan: r.keterangan ?? "",
  status: r.status,
  terlewat: Boolean(r.terlewat),
  logEntryName: r.log_entry_name,
  konteks: konteks(r.konteks),
})

const realisasi = (r: RealisasiRow): RealisasiKalender => ({
  id: r.id,
  aktifitasBidangId: r.aktifitas_bidang_id,
  tanggalKegiatan: r.tanggal_kegiatan,
  jumlahRealisasi: Number(r.jumlah_realisasi),
  keterangan: r.keterangan ?? "",
  logEntryName: r.log_entry_name,
  jumlahLampiran: Number(r.jumlah_lampiran ?? 0),
  konteks: konteks(r.konteks),
})

/**
 * Satu panggilan untuk seluruh jendela grid bulan: agenda + realisasi sekaligus.
 *
 * `bidangId` sengaja TIDAK dikirim untuk admin_bidang — server yang mengunci ke bidangnya,
 * dan mengirim bidang orang lain akan ditolak 403.
 */
export async function getKalenderBulan(p: {
  periodeId: number
  bulan: string
  bidangId?: number | null
  aktifitasBidangId?: number | null
}): Promise<KalenderBulan> {
  const params: Record<string, string | number> = { periode_id: p.periodeId }
  // Bulan kosong sengaja TIDAK dikirim: server memilih bulan bawaan (bulan hari ini bila
  // di dalam periode, selain itu bulan awal periode). Mengirim string kosong justru gagal
  // validasi regex TAHUN-BULAN di backend.
  if (p.bulan) params.bulan = p.bulan
  if (p.bidangId != null) params.bidang_id = p.bidangId
  if (p.aktifitasBidangId != null) params.aktifitas_bidang_id = p.aktifitasBidangId

  const r = dataOf<KalenderRow>(await api.get("/kalender/rencana", { params }))

  return {
    periode: periode(r.periode),
    bulan: r.bulan,
    rentang: r.rentang,
    dapatMenjadwalkan: Boolean(r.dapat_menjadwalkan),
    bidang: (r.bidang ?? []).map((b) => ({ id: b.id, namaBidang: b.nama_bidang })),
    ringkasan: {
      jumlahAgenda: Number(r.ringkasan?.jumlah_agenda ?? 0),
      jumlahRealisasi: Number(r.ringkasan?.jumlah_realisasi ?? 0),
      agendaTerlewat: Number(r.ringkasan?.agenda_terlewat ?? 0),
    },
    agenda: (r.agenda ?? []).map(agenda),
    realisasi: (r.realisasi ?? []).map(realisasi),
  }
}

export async function getJadwalAktifitas(aktifitasBidangId: number): Promise<AgendaKegiatan[]> {
  return dataOf<AgendaRow[]>(
    await api.get("/jadwal-kegiatan", { params: { aktifitas_bidang_id: aktifitasBidangId } }),
  ).map(agenda)
}

/**
 * Tanggal dikirim APA ADANYA. Nilai <Input type="date"> sudah berformat "YYYY-MM-DD";
 * membungkusnya dengan new Date() sebelum kirim justru menggeser tanggal satu hari di WIB.
 */
export async function simpanAgenda(input: SimpanAgendaInput): Promise<AgendaKegiatan> {
  const body: Record<string, unknown> = {
    judul_agenda: input.judulAgenda,
    tanggal_mulai: input.tanggalMulai,
    tanggal_selesai: input.tanggalSelesai,
    jumlah_rencana: input.jumlahRencana,
    lokasi: input.lokasi || null,
    keterangan: input.keterangan || null,
  }
  if (input.status) body.status = input.status

  // Aktifitas hanya boleh ditetapkan saat membuat: memindahkan agenda ke aktifitas lain
  // sama dengan memindahkannya ke bidang lain, dan backend menolaknya.
  if (input.id == null) body.aktifitas_bidang_id = input.aktifitasBidangId

  return agenda(
    dataOf<AgendaRow>(
      input.id == null
        ? await api.post("/jadwal-kegiatan", body)
        : await api.patch(`/jadwal-kegiatan/${input.id}`, body),
    ),
  )
}

export async function hapusAgenda(id: number): Promise<void> {
  await api.delete(`/jadwal-kegiatan/${id}`)
}
