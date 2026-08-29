import { api, dataOf } from "./api"
import type { AksiLog, LogAktivitas, SaringLog } from "./types"

/**
 * Jejak audit (TRANS_LOG_AKTIVITAS), terbaru di atas.
 *
 * PRD §4: admin bidang hanya boleh melihat data bidangnya sendiri. Penyaringan itu
 * ditegakkan di backend, bukan disembunyikan di UI — pemanggil meneruskan `bidangId`
 * miliknya lewat `saring.bidangId`. Saat ini rute `/log` hanya untuk admin_aplikasi,
 * jadi `bidangId` biasanya tidak dikirim.
 */

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

export async function getLog(saring: SaringLog = {}): Promise<LogAktivitas[]> {
  const params = {
    bidang_id: saring.bidangId ?? undefined,
    periode_id: saring.periodeId,
    aksi: saring.aksi,
    q: saring.cari?.trim() || undefined,
    batas: saring.batas,
  }
  return dataOf<Row[]>(await api.get("/log-aktivitas", { params })).map(map)
}

/** Hitungan { total, hariIni, pengguna } untuk strip ringkasan di layar. */
export async function getRingkasanLog(
  bidangId: number | null = null,
): Promise<{ total: number; hariIni: number; pengguna: number }> {
  const r = dataOf<{ total: number; hari_ini: number; pengguna: number }>(
    await api.get("/log-aktivitas/ringkasan", { params: { bidang_id: bidangId ?? undefined } }),
  )
  return { total: r.total, hariIni: r.hari_ini, pengguna: r.pengguna }
}
