import { dataOf, api } from "./api"

export interface LandingSummary { jumlah_bidang: number; jumlah_program: number; jumlah_subkegiatan: number; rata_capaian_subkegiatan: number; capaian_pd: number }
export interface CapaianBidangPublik { bidang_id: number; nama_bidang: string; jumlah_subkegiatan: number; capaian_bidang: number }
export interface LandingPublik {
  periode: { id: number; nama_periode: string; status: string } | null
  summary: LandingSummary | null
  bidang: CapaianBidangPublik[]
  distribusi: Array<{ bidang_id: number; nama_bidang: string; persentase: number }>
  radar: Array<{ label: string; value: number }>
  program: Array<{ kode_program: string; nama_program: string; jumlah_subkegiatan: number; capaian: number }>
}
export interface DetailBidangPublik {
  periode: LandingPublik["periode"]
  header: CapaianBidangPublik
  rincian: Array<{ id: number; kode_subkegiatan: string; nama_subkegiatan: string; indikator_kinerja: string | null; target: number; satuan: string | null; capaian: number }>
}
export async function getLandingPublik(): Promise<LandingPublik> { return dataOf(await api.get("/public/landing")) }
export async function getDetailBidangPublik(id: string | number): Promise<DetailBidangPublik> { return dataOf(await api.get(`/public/bidang/${id}`)) }
