import { api, dataOf } from "./api"
import type { AksiLog, GrupLog, LogAktivitas, RingkasanLog, SaringLog } from "./types"

type Row = {
  id: number
  waktu: string
  user_id: number | null
  nama_pengguna: string
  peran: "admin_aplikasi" | "admin_bidang"
  aksi: AksiLog
  entitas: string
  entitas_id: number | null
  ringkasan: string
  periode_id: number | null
  bidang_id: number | null
}

const map = (r: Row): LogAktivitas => ({
  id: r.id,
  waktu: r.waktu,
  userId: r.user_id,
  namaPengguna: r.nama_pengguna,
  peran: r.peran,
  aksi: r.aksi,
  entitas: r.entitas,
  entitasId: r.entitas_id,
  ringkasan: r.ringkasan,
  periodeId: r.periode_id,
  bidangId: r.bidang_id,
})

const paramsOf = (saring: SaringLog) => ({
  bidang_id: saring.bidangId ?? undefined,
  periode_id: saring.periodeId,
  user_id: saring.userId,
  aksi: saring.aksi,
  grup: saring.grup,
  perhatian: saring.perhatian ? 1 : undefined,
  entitas: saring.entitas,
  entitas_id: saring.entitasId,
  q: saring.cari?.trim() || undefined,
})

export async function getLog(saring: SaringLog = {}): Promise<LogAktivitas[]> {
  const params = { ...paramsOf(saring), batas: saring.batas, halaman: saring.halaman }
  return dataOf<Row[]>(await api.get("/log-aktivitas", { params })).map(map)
}

export async function getRingkasanLog(saring: SaringLog = {}): Promise<RingkasanLog> {
  const r = dataOf<{
    total: number
    hari_ini: number
    pengguna: number
    perhatian: number
    per_hari: { tanggal: string; jumlah: number }[]
    per_grup: Record<GrupLog, number>
  }>(await api.get("/log-aktivitas/ringkasan", { params: paramsOf(saring) }))
  return {
    total: r.total,
    hariIni: r.hari_ini,
    pengguna: r.pengguna,
    perhatian: r.perhatian,
    perHari: r.per_hari,
    perGrup: r.per_grup,
  }
}
