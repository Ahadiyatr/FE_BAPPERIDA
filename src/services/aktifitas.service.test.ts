import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
}))

vi.mock("./api", () => ({
  api: mocks,
  dataOf: (response: { data: { data: unknown } }) => response.data.data,
}))

import {
  getAktifitasByIndikatorUtama,
  getJumlahAktifitas,
  setAktifAktifitas,
} from "./aktifitas.service"

const row = (id: number, tipe: "UTAMA" | "PENDUKUNG" = "PENDUKUNG") => ({
  id,
  subkegiatan_id: 7,
  kode_aktifitas: `A-${id}`,
  nama_aktifitas: `Aktivitas ${id}`,
  tipe_aktifitas: tipe,
  satuan: "dokumen",
  target_anjuran: 1,
  urutan: id,
  flag_active: true,
})

beforeEach(() => vi.clearAllMocks())

describe("aktifitas service terpaginasikan", () => {
  it("menggabungkan seluruh halaman sebelum menghitung bobot pendukung", async () => {
    mocks.get
      .mockResolvedValueOnce({
        data: { data: [row(1, "UTAMA"), row(2)], meta: { current_page: 1, last_page: 2, per_page: 100, total: 3 } },
      })
      .mockResolvedValueOnce({
        data: { data: [row(3)], meta: { current_page: 2, last_page: 2, per_page: 100, total: 3 } },
      })

    const hasil = await getAktifitasByIndikatorUtama(7)

    expect(mocks.get).toHaveBeenNthCalledWith(1, "/aktifitas-master", {
      params: { subkegiatan_id: 7, flag_active: 1, page: 1, per_page: 100 },
    })
    expect(mocks.get).toHaveBeenNthCalledWith(2, "/aktifitas-master", {
      params: { subkegiatan_id: 7, flag_active: 1, page: 2, per_page: 100 },
    })
    expect(hasil.map((item) => item.bobotTarget)).toEqual([70, 15, 15])
  })

  it("mengambil total melalui halaman satu baris", async () => {
    mocks.get.mockResolvedValue({
      data: { data: [row(1)], meta: { current_page: 1, last_page: 439, per_page: 1, total: 439 } },
    })

    await expect(getJumlahAktifitas()).resolves.toBe(439)
    expect(mocks.get).toHaveBeenCalledWith("/aktifitas-master", {
      params: { page: 1, per_page: 1 },
    })
  })

  it("mengambil satu record sebelum mengubah status", async () => {
    mocks.get.mockResolvedValue({ data: { data: row(42) } })
    mocks.put.mockResolvedValue({ data: { data: { ...row(42), flag_active: false } } })

    await expect(setAktifAktifitas(42, false)).resolves.toMatchObject({ id: 42, flagActive: false })
    expect(mocks.get).toHaveBeenCalledWith("/aktifitas-master/42")
    expect(mocks.put).toHaveBeenCalledWith("/aktifitas-master/42", expect.objectContaining({
      KODE_AKTIFITAS: "A-42",
      FLAG_ACTIVE: false,
    }))
  })
})
