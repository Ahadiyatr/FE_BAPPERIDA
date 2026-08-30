import { api, dataOf } from "./api"

export interface PreviewExcel {
  nama_sheet: string
  jumlah_baris: number
  header: string[]
  contoh_baris: unknown[][]
  valid: boolean
  errors: string[]
  catatan: string
  audit?: { program: number; kegiatan: number; subkegiatan: number; aktifitas: number; bidang: string[]; quality_issues: unknown[] }
}

export async function previewImportExcel(file: File): Promise<PreviewExcel> {
  const body = new FormData()
  body.append("file", file)
  return dataOf<PreviewExcel>(await api.post("/import/excel/preview", body))
}

export async function importKatalogExcel(file: File, dokumen: { nama: string; tahunMulai: number; tahunSelesai: number }) {
  const body = new FormData()
  body.append("file", file)
  body.append("nama_dokumen", dokumen.nama)
  body.append("tahun_mulai", String(dokumen.tahunMulai))
  body.append("tahun_selesai", String(dokumen.tahunSelesai))
  return dataOf<{ dokumen_id: number; audit: PreviewExcel["audit"] }>(await api.post("/import/excel", body))
}

export async function unduhTemplateImportExcel(): Promise<void> {
  const response = await api.get("/import/excel/template", { responseType: "blob" })
  const url = URL.createObjectURL(response.data as Blob)
  const tautan = document.createElement("a")
  tautan.href = url
  tautan.download = "template-import-katalog-opera.xlsx"
  document.body.appendChild(tautan)
  tautan.click()
  tautan.remove()
  URL.revokeObjectURL(url)
}
