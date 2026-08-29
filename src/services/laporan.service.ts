import { api } from "./api"

export type JenisEksporLaporan = "rincian" | "bidang"

/** Unduh CSV laporan dari backend dengan sesi pengguna saat ini. */
export async function eksporLaporan(periodeId: number, jenis: JenisEksporLaporan): Promise<void> {
  const response = await api.get("/laporan/export", {
    params: { periode_id: periodeId, jenis },
    responseType: "blob",
  })
  const url = URL.createObjectURL(response.data as Blob)
  const tautan = document.createElement("a")
  tautan.href = url
  tautan.download = `laporan-${jenis}.csv`
  document.body.appendChild(tautan)
  tautan.click()
  tautan.remove()
  URL.revokeObjectURL(url)
}
