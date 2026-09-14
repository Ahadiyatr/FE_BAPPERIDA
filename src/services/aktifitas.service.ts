import { api, dataOf } from "./api"
import type { ApiEnvelope } from "./api"
import type {
  AktifitasDenganBobot,
  Indikator,
  IndikatorBidang,
  OpsiMaster,
  SimpanAktifitasInput,
} from "./types"

type Row = {
  id: number
  subkegiatan_id: number
  kode_aktifitas: string
  nama_aktifitas: string
  tipe_aktifitas: "UTAMA" | "PENDUKUNG"
  satuan: string | null
  target_anjuran: number | null
  urutan: number
  flag_active: boolean
}

type ResponsHalaman = { data: ApiEnvelope<Row[]> }

const map = (r: Row): Indikator => ({
  id: r.id,
  indikatorUtamaId: r.subkegiatan_id,
  kodeIndikator: r.kode_aktifitas,
  namaIndikator: r.nama_aktifitas,
  tipeAktifitas: r.tipe_aktifitas,
  satuan: r.satuan ?? "",
  targetAnjuran: Number(r.target_anjuran ?? 0),
  urutan: r.urutan,
  flagActive: r.flag_active,
})

async function ambilSemuaHalaman(params: Record<string, string | number>) {
  const rows: Row[] = []
  let page = 1
  let lastPage = 1

  do {
    const response = await api.get<never, ResponsHalaman>("/aktifitas-master", {
      params: { ...params, page, per_page: 100 },
    })
    rows.push(...dataOf<Row[]>(response))
    lastPage = response.data.meta?.last_page ?? page
    page += 1
  } while (page <= lastPage)

  return rows
}

export async function getAktifitasByIndikatorUtama(
  id: number | null,
  opsi: OpsiMaster = {},
): Promise<AktifitasDenganBobot[]> {
  const rows = await ambilSemuaHalaman({
    ...(id != null && { subkegiatan_id: id }),
    ...(!opsi.termasukNonaktif && { flag_active: 1 }),
  })
  const aktif = rows.filter((r) => r.flag_active)
  const jumlahPendukung = aktif.filter((r) => r.tipe_aktifitas === "PENDUKUNG").length

  return rows.map((r) => ({
    ...map(r),
    bobotTarget: r.tipe_aktifitas === "UTAMA" ? 70 : (jumlahPendukung ? 30 / jumlahPendukung : 0),
  }))
}

export async function getJumlahAktifitas(): Promise<number> {
  const response = await api.get<never, ResponsHalaman>("/aktifitas-master", {
    params: { page: 1, per_page: 1 },
  })
  return response.data.meta?.total ?? dataOf<Row[]>(response).length
}

export async function simpanAktifitas(i: SimpanAktifitasInput): Promise<Indikator> {
  const body = {
    SUBKEGIATAN_ID: i.indikatorUtamaId,
    KODE_AKTIFITAS: i.kodeIndikator,
    NAMA_AKTIFITAS: i.namaIndikator,
    TIPE_AKTIFITAS: i.tipeAktifitas,
    SATUAN: i.satuan,
    TARGET_ANJURAN: i.targetAnjuran,
    FLAG_ACTIVE: true,
  }
  return map(dataOf<Row>(i.id
    ? await api.put(`/aktifitas-master/${i.id}`, body)
    : await api.post("/aktifitas-master", body)))
}

export async function setAktifAktifitas(id: number, aktif: boolean): Promise<Indikator> {
  const r = dataOf<Row>(await api.get(`/aktifitas-master/${id}`))
  return map(dataOf<Row>(await api.put(`/aktifitas-master/${id}`, {
    SUBKEGIATAN_ID: r.subkegiatan_id,
    KODE_AKTIFITAS: r.kode_aktifitas,
    NAMA_AKTIFITAS: r.nama_aktifitas,
    TIPE_AKTIFITAS: r.tipe_aktifitas,
    SATUAN: r.satuan,
    TARGET_ANJURAN: r.target_anjuran,
    URUTAN: r.urutan,
    FLAG_ACTIVE: aktif,
  })))
}

export async function getIndikatorBidangBySubkegiatanBidang(): Promise<IndikatorBidang[]> {
  return []
}
