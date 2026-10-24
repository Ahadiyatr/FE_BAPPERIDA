import { describe, expect, it } from "vitest"

import type { LogAktivitas } from "@/services"
import {
  jamWita,
  judulHari,
  kalimatRangkaian,
  kelompokkanPerHari,
  labelEntitas,
  lipatBeruntun,
  pecahRingkasan,
} from "./log-aktivitas"

let id = 0
const log = (waktu: string, ubah: Partial<LogAktivitas> = {}): LogAktivitas => ({
  id: ++id,
  waktu,
  userId: 2,
  namaPengguna: "Admin Aplikasi",
  peran: "admin_aplikasi",
  aksi: "BUAT",
  entitas: "MASTER_KEGIATAN",
  entitasId: id,
  ringkasan: "Membuat kegiatan.",
  periodeId: null,
  bidangId: null,
  ...ubah,
})

describe("kelompokkanPerHari", () => {
  it("membaca hari dalam WITA, bukan zona browser", () => {
    // 00.30 WITA = 16.30 UTC hari sebelumnya.
    const hari = kelompokkanPerHari([
      log("2026-10-24T00:30:00+08:00"),
      log("2026-10-23T23:50:00+08:00"),
    ])
    expect(hari.map(h => h.tanggal)).toEqual(["2026-10-24", "2026-10-23"])
    expect(jamWita("2026-10-24T00:30:00+08:00")).toBe("00.30")
  })
})

describe("judulHari", () => {
  it("menamai hari ini dan kemarin", () => {
    expect(judulHari("2026-10-24", "2026-10-24").utama).toBe("Hari ini")
    expect(judulHari("2026-10-23", "2026-10-24").utama).toBe("Kemarin")
    expect(judulHari("2026-10-20", "2026-10-24").sekunder).toBeNull()
  })
})

describe("lipatBeruntun", () => {
  it("melipat tiga kejadian beruntun atau lebih, menyisakan sisanya tunggal", () => {
    const butir = lipatBeruntun([
      log("2026-10-24T04:17:00+08:00", { aksi: "LOGIN", entitas: "users" }),
      log("2026-10-24T00:49:00+08:00"),
      log("2026-10-24T00:48:00+08:00"),
      log("2026-10-24T00:45:00+08:00"),
      log("2026-10-24T00:42:00+08:00", { entitas: "MASTER_PROGRAM" }),
    ])
    expect(butir.map(b => b.jenis)).toEqual(["tunggal", "rangkaian", "tunggal"])
    if (butir[1].jenis === "rangkaian") {
      expect(butir[1].baris).toHaveLength(3)
      expect(kalimatRangkaian(butir[1].baris)).toBe("Membuat 3 kegiatan")
    }
  })

  it("memutus rangkaian bila jeda lebih dari 15 menit atau pelakunya lain", () => {
    const butir = lipatBeruntun([
      log("2026-10-24T10:00:00+08:00"),
      log("2026-10-24T09:59:00+08:00", { userId: 9, namaPengguna: "Rina" }),
      log("2026-10-24T09:58:00+08:00"),
      log("2026-10-24T09:30:00+08:00"),
    ])
    expect(butir.every(b => b.jenis === "tunggal")).toBe(true)
  })

  it("tidak pernah melipat sesi masuk", () => {
    const butir = lipatBeruntun(
      [1, 2, 3].map(m => log(`2026-10-24T09:0${m}:00+08:00`, { aksi: "GAGAL_LOGIN", entitas: "users" })),
    )
    expect(butir).toHaveLength(3)
  })
})

describe("pecahRingkasan", () => {
  it("menyorot kode berjenjang dan nama dalam kutip", () => {
    expect(pecahRingkasan('Membuat kegiatan 5.01.02.06 — "Administrasi Umum".')).toEqual([
      { jenis: "teks", isi: "Membuat kegiatan " },
      { jenis: "kode", isi: "5.01.02.06" },
      { jenis: "teks", isi: " — " },
      { jenis: "nama", isi: "Administrasi Umum" },
      { jenis: "teks", isi: "." },
    ])
  })

  it("membiarkan kode di dalam kutip sebagai bagian nama", () => {
    expect(pecahRingkasan('Login gagal untuk "a.b@c.d".')[1]).toEqual({ jenis: "nama", isi: "a.b@c.d" })
  })
})

describe("labelEntitas", () => {
  it("mengenali tabel users huruf kecil dan meloloskan tabel tak dikenal", () => {
    expect(labelEntitas("users")).toBe("Pengguna")
    expect(labelEntitas("TABEL_BARU")).toBe("TABEL_BARU")
  })
})
