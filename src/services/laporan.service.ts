import { api } from "./api"

export type JenisEksporLaporan = "rincian" | "bidang"

/**
 * Nama berkas dari header `Content-Disposition` backend, yang memuat slug nama periode.
 * Nama tidak disusun ulang di sini karena slug Laravel belum tentu sama dengan slug JS.
 */
export function namaBerkasDariHeader(header: unknown): string | null {
  if (typeof header !== "string") return null
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8) {
    try { return decodeURIComponent(utf8[1].trim()) } catch { /* jatuh ke filename= */ }
  }
  const biasa = /filename="?([^";]+)"?/i.exec(header)
  return biasa ? biasa[1].trim() : null
}

/** Unduh CSV laporan dari backend dengan sesi pengguna saat ini. */
export async function eksporLaporan(periodeId: number, jenis: JenisEksporLaporan): Promise<void> {
  const response = await api.get("/laporan/export", {
    params: { periode_id: periodeId, jenis },
    responseType: "blob",
  })
  const url = URL.createObjectURL(response.data as Blob)
  const tautan = document.createElement("a")
  tautan.href = url
  tautan.download = namaBerkasDariHeader(response.headers?.["content-disposition"]) ?? `laporan-${jenis}.csv`
  document.body.appendChild(tautan)
  tautan.click()
  tautan.remove()
  URL.revokeObjectURL(url)
}
