// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock("./api", () => ({
  api: mocks,
  dataOf: (response: { data: { data: unknown } }) => response.data.data,
}))

import { catatRealisasi, uploadLampiran } from "./realisasi.service"

const responsRealisasi = {
  id: 11,
  aktifitas_bidang_id: 7,
  tanggal_kegiatan: "2026-09-13",
  jumlah_realisasi: 1,
  keterangan: null,
  created_by: 3,
  log_entry_name: "Admin Bidang",
  lampiran: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.post.mockResolvedValue({ data: { data: responsRealisasi } })
})

describe("payload multipart realisasi", () => {
  it("mengirim semua foto dan dokumen saat mencatat realisasi", async () => {
    const fotoA = new File(["a"], "foto-a.jpg", { type: "image/jpeg" })
    const fotoB = new File(["b"], "foto-b.png", { type: "image/png" })
    const dokumenA = new File(["c"], "laporan-a.pdf", { type: "application/pdf" })
    const dokumenB = new File(["d"], "laporan-b.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    await catatRealisasi({
      indikatorBidangId: 7,
      tanggalKegiatan: "2026-09-13",
      jumlahRealisasi: 1,
      keterangan: "",
      createdBy: 3,
      fotos: [fotoA, fotoB],
      dokumens: [dokumenA, dokumenB],
    })

    const form = mocks.post.mock.calls[0][1] as FormData
    expect(form.getAll("fotos[]")).toEqual([fotoA, fotoB])
    expect(form.getAll("dokumens[]")).toEqual([dokumenA, dokumenB])
    expect(form.has("dokumen")).toBe(false)
  })

  it("mempertahankan semua file campuran ketika menambah bukti", async () => {
    const foto = new File(["a"], "foto.jpg", { type: "image/jpeg" })
    const dokumenA = new File(["b"], "satu.pdf", { type: "application/pdf" })
    const dokumenB = new File(["c"], "dua.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    await uploadLampiran(11, [foto, dokumenA, dokumenB])

    const form = mocks.post.mock.calls[0][1] as FormData
    expect(form.getAll("fotos[]")).toEqual([foto])
    expect(form.getAll("dokumens[]")).toEqual([dokumenA, dokumenB])
    expect(form.has("dokumen")).toBe(false)
  })
})
