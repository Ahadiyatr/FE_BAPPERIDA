// @vitest-environment jsdom
import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { PilihBerkas } from "./pilih-berkas"

afterEach(cleanup)

function Uji() {
  const [berkas, setBerkas] = React.useState<File[]>([])
  return <PilihBerkas nilai={berkas} onUbah={setBerkas} />
}

const xlsx = new File(["a"], "rekap-instalasi.xlsx", { type: "application/vnd.ms-excel", lastModified: 1 })
const png = new File(["bb"], "Screenshot.png", { type: "image/png", lastModified: 2 })

describe("PilihBerkas", () => {
  it("menampilkan tiap berkas dan bisa melepas satu per satu", async () => {
    render(<Uji />)
    const input = screen.getByTestId("pilih-berkas-input") as HTMLInputElement

    await userEvent.upload(input, [xlsx, png])
    expect(screen.getByText("rekap-instalasi.xlsx")).toBeTruthy()
    expect(screen.getByText("Screenshot.png")).toBeTruthy()
    expect(screen.getByText("2 berkas dipilih")).toBeTruthy()

    await userEvent.click(screen.getByRole("button", { name: "Lepas Screenshot.png" }))
    expect(screen.queryByText("Screenshot.png")).toBeNull()
    expect(screen.getByText("1 berkas dipilih")).toBeTruthy()
  })

  it("menambahkan pilihan berikutnya tanpa menimpa dan tanpa duplikat", async () => {
    render(<Uji />)
    const input = screen.getByTestId("pilih-berkas-input") as HTMLInputElement

    await userEvent.upload(input, [xlsx])
    await userEvent.upload(input, [xlsx, png])

    expect(screen.getAllByText("rekap-instalasi.xlsx")).toHaveLength(1)
    expect(screen.getByText("2 berkas dipilih")).toBeTruthy()
  })

  it("melepas semua sekaligus", async () => {
    render(<Uji />)
    await userEvent.upload(screen.getByTestId("pilih-berkas-input") as HTMLInputElement, [xlsx, png])

    await userEvent.click(screen.getByRole("button", { name: "Lepas semua" }))

    expect(screen.getByText("Belum ada berkas dipilih")).toBeTruthy()
  })
})
