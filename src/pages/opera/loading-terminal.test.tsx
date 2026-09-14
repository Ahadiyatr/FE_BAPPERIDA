// @vitest-environment jsdom

import * as React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

const mocks = vi.hoisted(() => ({
  getPeriode: vi.fn(),
  getBidang: vi.fn(),
  getRingkasanDashboard: vi.fn(),
  getRankingBidang: vi.fn(),
  getRankingProgram: vi.fn(),
  getSubkegiatanTertinggal: vi.fn(),
  getTrenCapaian: vi.fn(),
  eksporLaporan: vi.fn(),
  getAktifitasBidang: vi.fn(),
  getBuktiByBidang: vi.fn(),
  catatRealisasi: vi.fn(),
  pratinjauRealisasi: vi.fn(),
  getRealisasiByIndikatorBidang: vi.fn(),
  hapusRealisasi: vi.fn(),
  ubahRealisasi: vi.fn(),
  hapusLampiran: vi.fn(),
  uploadLampiran: vi.fn(),
}))

const sesi = vi.hoisted(() => ({
  current: { peran: "admin_bidang", bidangId: 1 } as {
    peran: "admin_aplikasi" | "admin_bidang"
    bidangId: number | null
  },
}))

vi.mock("@/services", () => mocks)
vi.mock("@/lib/peran", () => ({ usePeran: () => sesi.current }))

import BuktiKegiatan from "./BuktiKegiatan"
import CatatRealisasi from "./CatatRealisasi"
import DashboardUmum from "./DashboardUmum"

const halaman = [
  ["Dashboard", DashboardUmum],
  ["Catat Realisasi", CatatRealisasi],
  ["Bukti Kegiatan", BuktiKegiatan],
] as const

const periode = {
  id: 9,
  dokumenId: 1,
  namaPeriode: "Triwulan III 2026",
  tanggalMulai: "2026-07-01",
  tanggalSelesai: "2026-09-30",
  status: "OPEN" as const,
}

function renderHalaman(Komponen: React.ComponentType) {
  return render(<MemoryRouter><Komponen /></MemoryRouter>)
}

function tertunda<T>() {
  let resolve!: (nilai: T) => void
  let reject!: (alasan: unknown) => void
  const promise = new Promise<T>((selesai, gagal) => {
    resolve = selesai
    reject = gagal
  })
  return { promise, resolve, reject }
}

function catatan(namaAktifitas: string, realisasiId: number) {
  return [{
    realisasiId,
    tanggalKegiatan: "2026-09-13",
    jumlahRealisasi: 1,
    keterangan: "",
    logEntryName: "Admin",
    namaAktifitas,
    kodeSubkegiatan: `SUB-${realisasiId}`,
    namaSubkegiatan: `Subkegiatan ${realisasiId}`,
    lampirans: [],
  }]
}

beforeEach(() => {
  vi.clearAllMocks()
  sesi.current = { peran: "admin_bidang", bidangId: 1 }
  mocks.getBidang.mockResolvedValue([])
  mocks.getRingkasanDashboard.mockResolvedValue({
    capaianPd: 0,
    jumlahSubkegiatan: 0,
    jumlahBidangSiap: 0,
    jumlahBidang: 0,
    jumlahAktifitas: 0,
    jumlahRealisasi: 0,
  })
  mocks.getRankingBidang.mockResolvedValue([])
  mocks.getRankingProgram.mockResolvedValue([])
  mocks.getSubkegiatanTertinggal.mockResolvedValue([])
  mocks.getTrenCapaian.mockResolvedValue([])
  mocks.getAktifitasBidang.mockResolvedValue([])
  mocks.getBuktiByBidang.mockResolvedValue([])
})

afterEach(cleanup)

describe.each(halaman)("state terminal %s", (_nama, Komponen) => {
  it("mengakhiri loading dan menampilkan state periode kosong", async () => {
    mocks.getPeriode.mockResolvedValue([])
    const { container } = renderHalaman(Komponen)

    expect(await screen.findByText("Belum ada periode yang dapat ditampilkan.")).toBeTruthy()
    expect(container.textContent).not.toContain("Memuat…")
    expect(container.querySelector(".animate-pulse")).toBeNull()
  })

  it("mengakhiri loading dan menyediakan retry ketika daftar periode gagal", async () => {
    mocks.getPeriode.mockRejectedValue(new Error("Jaringan periode gagal."))
    const { container } = renderHalaman(Komponen)

    expect(await screen.findByText("Jaringan periode gagal.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /coba lagi/i }))
    await waitFor(() => expect(mocks.getPeriode).toHaveBeenCalledTimes(2))
    expect(container.textContent).not.toContain("Memuat…")
    expect(container.querySelector(".animate-pulse")).toBeNull()
  })

  it("menampilkan state akun admin bidang yang belum ditempatkan", async () => {
    sesi.current = { peran: "admin_bidang", bidangId: null }
    mocks.getPeriode.mockResolvedValue([periode])
    const { container } = renderHalaman(Komponen)

    expect(await screen.findByText(/akun ini belum ditempatkan pada bidang/i)).toBeTruthy()
    expect(container.textContent).not.toContain("Memuat…")
  })
})

describe("urutan request Bukti Kegiatan", () => {
  const bidang = [
    { id: 1, namaBidang: "Bidang A" },
    { id: 2, namaBidang: "Bidang B" },
  ]

  function siapkanRequestTerbalik() {
    const requestA = tertunda<ReturnType<typeof catatan>>()
    const requestB = tertunda<ReturnType<typeof catatan>>()
    sesi.current = { peran: "admin_aplikasi", bidangId: null }
    mocks.getPeriode.mockResolvedValue([periode])
    mocks.getBidang.mockResolvedValue(bidang)
    mocks.getBuktiByBidang.mockImplementation((bidangId: number) =>
      bidangId === 1 ? requestA.promise : requestB.promise)
    return { requestA, requestB }
  }

  async function pilihBidangB() {
    await waitFor(() => expect(mocks.getBuktiByBidang).toHaveBeenCalledWith(1, periode.id))
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "2" } })
    await waitFor(() => expect(mocks.getBuktiByBidang).toHaveBeenCalledWith(2, periode.id))
  }

  it("mengabaikan hasil sukses dari request filter lama", async () => {
    const { requestA, requestB } = siapkanRequestTerbalik()
    renderHalaman(BuktiKegiatan)
    await pilihBidangB()

    requestB.resolve(catatan("Aktivitas terbaru", 2))
    expect(await screen.findByText("Aktivitas terbaru")).toBeTruthy()

    await act(async () => requestA.resolve(catatan("Aktivitas lama", 1)))
    expect(screen.queryByText("Aktivitas lama")).toBeNull()
    expect(screen.getByText("Aktivitas terbaru")).toBeTruthy()
  })

  it("mengabaikan error dari request filter lama", async () => {
    const { requestA, requestB } = siapkanRequestTerbalik()
    renderHalaman(BuktiKegiatan)
    await pilihBidangB()

    requestB.resolve(catatan("Aktivitas terbaru", 2))
    expect(await screen.findByText("Aktivitas terbaru")).toBeTruthy()

    await act(async () => requestA.reject(new Error("Error request lama.")))
    expect(screen.queryByText("Error request lama.")).toBeNull()
    expect(screen.getByText("Aktivitas terbaru")).toBeTruthy()
  })
})
