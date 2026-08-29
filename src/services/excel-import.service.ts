import { api, dataOf } from "./api"

export interface PreviewExcel {
  nama_sheet: string
  jumlah_baris: number
  header: string[]
  contoh_baris: unknown[][]
  valid: boolean
  errors: string[]
  catatan: string
}

export async function previewImportExcel(file: File): Promise<PreviewExcel> {
  const body = new FormData()
  body.append("file", file)
  return dataOf<PreviewExcel>(await api.post("/import/excel/preview", body))
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
