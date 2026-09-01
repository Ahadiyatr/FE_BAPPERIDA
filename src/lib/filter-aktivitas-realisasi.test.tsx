// @vitest-environment jsdom
import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { FilterJenisAktivitas } from "@/components/opera/filter-jenis-aktivitas"
import {
  hitungStatusAktivitas,
  saringAktivitasRealisasi,
  type FilterJenisAktivitas as Jenis,
  type FilterStatusAktivitas as Status,
} from "@/lib/filter-aktivitas-realisasi"

const daftar = [
  { id: "utama-belum", tipeAktifitas: "UTAMA" as const, selesai: false },
  { id: "utama-selesai", tipeAktifitas: "UTAMA" as const, selesai: true },
  { id: "pendukung-belum", tipeAktifitas: "PENDUKUNG" as const, selesai: false },
  { id: "pendukung-selesai", tipeAktifitas: "PENDUKUNG" as const, selesai: true },
]

describe("filter aktivitas realisasi", () => {
  it.each<[Jenis, Status, string[]]>([
    ["semua", "semua", ["utama-belum", "utama-selesai", "pendukung-belum", "pendukung-selesai"]],
    ["semua", "belum", ["utama-belum", "pendukung-belum"]],
    ["semua", "selesai", ["utama-selesai", "pendukung-selesai"]],
    ["utama", "semua", ["utama-belum", "utama-selesai"]],
    ["utama", "belum", ["utama-belum"]],
    ["utama", "selesai", ["utama-selesai"]],
    ["pendukung", "semua", ["pendukung-belum", "pendukung-selesai"]],
    ["pendukung", "belum", ["pendukung-belum"]],
    ["pendukung", "selesai", ["pendukung-selesai"]],
  ])("menggabungkan jenis %s dan status %s", (jenis, status, hasil) => {
    expect(saringAktivitasRealisasi(daftar, status, jenis).map((item) => item.id)).toEqual(hasil)
  })

  it("menghitung seluruh tab status berdasarkan jenis aktif", () => {
    expect(hitungStatusAktivitas(daftar, "utama")).toEqual({ belum: 1, semua: 2, selesai: 1 })
    expect(hitungStatusAktivitas(daftar, "pendukung")).toEqual({ belum: 1, semua: 2, selesai: 1 })
  })

  it("menghasilkan daftar kosong ketika kombinasi tidak mempunyai kecocokan", () => {
    expect(saringAktivitasRealisasi(daftar.slice(0, 1), "selesai", "pendukung")).toEqual([])
  })

  it("menyediakan dan menerapkan seluruh pilihan jenis", async () => {
    const user = userEvent.setup()

    function Contoh() {
      const [jenis, setJenis] = React.useState<Jenis>("semua")
      return <FilterJenisAktivitas nilai={jenis} onUbah={setJenis} />
    }

    render(<Contoh />)
    const kontrol = screen.getByRole("combobox", { name: "Jenis aktivitas" }) as HTMLSelectElement

    expect(kontrol.value).toBe("semua")
    await user.selectOptions(kontrol, "utama")
    expect(kontrol.value).toBe("utama")
    await user.selectOptions(kontrol, "pendukung")
    expect(kontrol.value).toBe("pendukung")
    await user.selectOptions(kontrol, "semua")
    expect(kontrol.value).toBe("semua")
  })
})
