import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * BobotLedger — buku besar bobot.
 *
 * Menampilkan perhitungan 70/30 sebagai baris-baris yang bisa dibaca, bukan
 * angka akhir saja. Dipakai di tiga tempat: detail subkegiatan, form tambah
 * aktifitas pendukung, dan sebelum tombol simpan pada pencatatan realisasi.
 *
 * Alasannya bukan estetika. Keluhan nomor satu saat pindah dari Excel adalah
 * "kok angkanya beda dari hitungan saya" — dan satu-satunya obatnya adalah
 * menunjukkan hitungannya, termasuk konsekuensi dari perubahan yang belum
 * disimpan.
 */

const persen = (n: number) => n.toFixed(1).replace(".", ",") + "%"
const persen2 = (n: number) => n.toFixed(2).replace(".", ",") + "%"

interface Baris {
  label: string
  nilai: string
  /** Tandai baris hasil akhir — dicetak emerald dan tebal. */
  total?: boolean
}

interface BobotLedgerProps extends React.HTMLAttributes<HTMLDivElement> {
  baris: Baris[]
  /** Gambar meter mini di bawah baris. */
  meter?: { jumlahPendukung: number; segmenBaru?: boolean }
  /** Kalimat konsekuensi, dicetak amber. */
  peringatan?: string
}

export function BobotLedger({
  baris,
  meter,
  peringatan,
  className,
  ...props
}: BobotLedgerProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-slate-800 px-4 py-3.5 font-mono text-[11.5px] leading-[1.9] text-white/85",
        className
      )}
      {...props}
    >
      {baris.map((b, i) => (
        <React.Fragment key={i}>
          {b.total && <div className="my-2 h-px bg-white/15" />}
          <div className="flex gap-2.5">
            <span className={cn("flex-1", b.total && "font-medium text-emerald-600")}>
              {b.label}
            </span>
            <span
              className={cn(
                "tabular font-medium",
                b.total ? "text-emerald-600" : "text-white"
              )}
            >
              {b.nilai}
            </span>
          </div>
        </React.Fragment>
      ))}

      {meter && (
        <>
          <div className="my-3 flex h-3.5 gap-[2px]">
            <i className="flex-[70] rounded-[1px] bg-emerald-600" />
            {Array.from({ length: meter.jumlahPendukung }, (_, i) => (
              <i
                key={i}
                className={cn(
                  "flex-[10] rounded-[1px] bg-slate-400",
                  meter.segmenBaru &&
                    i === meter.jumlahPendukung - 1 &&
                    "shadow-[inset_0_0_0_1px_white]"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9.5px] uppercase tracking-[0.08em] text-white/50">
            <span>70% utama</span>
            <span>30% pendukung</span>
          </div>
        </>
      )}

      {peringatan && (
        <>
          <div className="my-2 h-px bg-white/15" />
          <div className="text-amber-50">{peringatan}</div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Pembungkus siap pakai untuk dua kasus tersering.
   ───────────────────────────────────────────────────────────── */

/** Rincian capaian sebuah subkegiatan. */
export function LedgerCapaian({
  bobotUtama,
  bobotPendukung,
  jumlahPendukung,
}: {
  bobotUtama: number
  bobotPendukung: number
  jumlahPendukung: number
}) {
  return (
    <BobotLedger
      baris={[
        { label: "Bobot realisasi aktifitas utama", nilai: persen2(bobotUtama) },
        {
          label: `Bobot realisasi ${jumlahPendukung} aktifitas pendukung`,
          nilai: persen2(bobotPendukung),
        },
        {
          label: "Capaian subkegiatan",
          nilai: persen2(bobotUtama + bobotPendukung),
          total: true,
        },
      ]}
    />
  )
}

/** Akibat menambah satu aktifitas pendukung baru. */
export function LedgerTambahPendukung({
  jumlahSekarang,
}: {
  jumlahSekarang: number
}) {
  const n = jumlahSekarang + 1
  const lama = jumlahSekarang > 0 ? 30 / jumlahSekarang : 0
  const baru = 30 / n

  return (
    <BobotLedger
      baris={[
        { label: "Aktifitas utama", nilai: "70,0%" },
        {
          label: `${n} aktifitas pendukung × ${persen(baru)}`,
          nilai: "30,0%",
        },
        { label: "Bobot baris baru ini", nilai: persen(baru), total: true },
      ]}
      meter={{ jumlahPendukung: n, segmenBaru: true }}
      peringatan={
        jumlahSekarang > 0
          ? `Menambah baris ini menurunkan bobot ${jumlahSekarang} aktifitas pendukung yang sudah ada dari ${persen(
              lama
            )} menjadi ${persen(baru)}.`
          : undefined
      }
    />
  )
}
