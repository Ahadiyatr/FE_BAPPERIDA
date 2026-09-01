// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { KonfirmasiRealisasiMelebihiTarget } from "./konfirmasi-realisasi"

describe("KonfirmasiRealisasiMelebihiTarget", () => {
  it("menampilkan total, target, dan memfokuskan aksi aman", async () => {
    render(<KonfirmasiRealisasiMelebihiTarget open total={3} target={1} onPeriksaKembali={() => undefined} onTetapSimpan={() => undefined} />)

    expect(screen.getByText(/Total realisasi akan menjadi/).textContent).toContain("3")
    expect(screen.getByText(/Total realisasi akan menjadi/).textContent).toContain("1")
    expect(document.activeElement).toBe(await screen.findByRole("button", { name: "Periksa kembali" }))
  })

  it("menjalankan aksi Periksa kembali ketika tombol aman diklik", async () => {
    const periksa = vi.fn()
    const simpan = vi.fn()
    render(<KonfirmasiRealisasiMelebihiTarget open total={3} target={1} onPeriksaKembali={periksa} onTetapSimpan={simpan} />)

    await userEvent.click(screen.getByRole("button", { name: "Periksa kembali" }))
    expect(periksa).toHaveBeenCalledOnce()
    expect(simpan).not.toHaveBeenCalled()
  })

  it("menjalankan aksi Tetap simpan ketika dikonfirmasi", async () => {
    const simpan = vi.fn()
    render(<KonfirmasiRealisasiMelebihiTarget open total={3} target={1} onPeriksaKembali={() => undefined} onTetapSimpan={simpan} />)

    await userEvent.click(screen.getByRole("button", { name: "Tetap simpan" }))
    expect(simpan).toHaveBeenCalledOnce()
  })
})
