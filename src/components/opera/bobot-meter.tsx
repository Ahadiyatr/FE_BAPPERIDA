import * as React from "react"
import { Tooltip } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * BobotMeter — batang tersegmen yang memperlihatkan pembagian 70/30.
 *
 * Ini komponen inti OPERA. Di Excel, capaian subkegiatan cuma angka hasil
 * formula; di sini blok besar (emerald) adalah aktifitas utama dengan bobot
 * 70%, dan tiap petak kecil (teal) satu aktifitas pendukung dengan bobot
 * 30% dibagi jumlahnya. Isi tiap segmen = realisasi dibagi target.
 *
 * Jangan ganti dengan <Progress> shadcn: satu batang tunggal menyembunyikan
 * justru informasi yang paling dibutuhkan pengguna — aktifitas mana yang
 * belum jalan.
 */

export interface AktifitasBobot {
  nama: string
  target: number
  realisasi: number
  /** Bobot transaksi aktual dari backend, bukan hasil pembagian di UI. */
  bobotTarget: number
}

interface BobotMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  utama: AktifitasBobot
  pendukung: AktifitasBobot[]
  /** Tinggi batang dalam px. Tabel padat pakai 8, kartu pakai 12-14. */
  tinggi?: number
  /** Sembunyikan tooltip untuk konteks yang sangat padat. */
  tanpaTooltip?: boolean
}

const rasio = (a: AktifitasBobot) =>
  a.target > 0 ? Math.min(a.realisasi / a.target, 1) : 0

const persen = (n: number) =>
  n.toFixed(1).replace(".", ",") + "%"

function Segmen({
  isi,
  flex,
  warna,
  judul,
  tanpaTooltip,
}: {
  isi: number
  flex: number
  warna: "utama" | "pendukung"
  judul: string
  tanpaTooltip?: boolean
}) {
  const batang = (
    <div
      className="relative overflow-hidden rounded-[1px] bg-muted"
      style={{ flex }}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-[1px] transition-[width] duration-300",
          warna === "utama" ? "bg-emerald-600" : "bg-slate-400"
        )}
        style={{ width: `${isi * 100}%` }}
      />
    </div>
  )

  if (tanpaTooltip) return batang

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{batang}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="z-50 max-w-[240px] rounded-xl bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-md"
        >
          {judul}
          <Tooltip.Arrow className="fill-slate-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export function BobotMeter({
  utama,
  pendukung,
  tinggi = 12,
  tanpaTooltip,
  className,
  ...props
}: BobotMeterProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <div
        className={cn("flex w-full min-w-[120px] gap-[2px]", className)}
        style={{ height: tinggi }}
        role="img"
        aria-label={`Capaian: aktivitas utama ${persen(
          rasio(utama) * utama.bobotTarget
        )} dari ${persen(utama.bobotTarget)}, ${pendukung.length} aktifitas pendukung`}
        {...props}
      >
        <Segmen
          isi={rasio(utama)}
          flex={utama.bobotTarget}
          warna="utama"
          tanpaTooltip={tanpaTooltip}
          judul={`Utama · ${utama.nama} — ${utama.realisasi} dari ${utama.target}, bobot ${persen(utama.bobotTarget)}`}
        />
        {pendukung.map((p, i) => (
          <Segmen
            key={i}
            isi={rasio(p)}
            flex={p.bobotTarget}
            warna="pendukung"
            tanpaTooltip={tanpaTooltip}
            judul={`Pendukung · ${p.nama} — ${p.realisasi} dari ${
              p.target
            }, bobot ${persen(p.bobotTarget)}`}
          />
        ))}
      </div>
    </Tooltip.Provider>
  )
}

/** Keterangan warna, dipakai di bawah meter pada tampilan detail. */
export function BobotMeterLegenda({
  bobotPendukung,
  className,
}: {
  bobotPendukung: number[]
  className?: string
}) {
  const total = bobotPendukung.reduce((jumlah, bobot) => jumlah + bobot, 0)
  return (
    <div
      className={cn(
        "mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        <i className="size-2.5 rounded-[1px] bg-emerald-600" aria-hidden />
        Aktivitas utama — bobot 70%
      </span>
      <span className="flex items-center gap-1.5">
        <i className="size-2.5 rounded-[1px] bg-slate-400" aria-hidden />
        {bobotPendukung.length} aktivitas pendukung — bobot aktual {bobotPendukung.map(persen).join(", ")} (Σ {persen(total)})
      </span>
    </div>
  )
}
