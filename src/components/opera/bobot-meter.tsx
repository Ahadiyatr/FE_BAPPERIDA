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
      className={cn(
        "relative overflow-hidden rounded-[3px]",
        warna === "utama" ? "bg-emerald-100" : "bg-slate-200"
      )}
      style={{ flex }}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-[1px] transition-[width] duration-300",
          warna === "utama" ? "bg-emerald-600" : "bg-slate-500"
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
        className={cn("flex w-full min-w-[120px] gap-[3px]", className)}
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
  bobotUtama = 70,
  className,
}: {
  bobotPendukung: number[]
  bobotUtama?: number
  className?: string
}) {
  const total = bobotPendukung.reduce((jumlah, bobot) => jumlah + bobot, 0)
  const minimum = Math.min(...bobotPendukung)
  const maksimum = Math.max(...bobotPendukung)
  const bobotSeragam = bobotPendukung.length > 0 && maksimum - minimum < 0.001
  const rincianPendukung = bobotPendukung.length === 0
    ? "Tidak ada aktivitas pendukung"
    : bobotSeragam
      ? `${bobotPendukung.length} aktivitas · masing-masing ${persen(minimum)}`
      : `${bobotPendukung.length} aktivitas · bobot disesuaikan per aktivitas`

  return (
    <div
      className={cn(
        "mt-2 grid gap-2 sm:grid-cols-2",
        className
      )}
    >
      <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
        <i className="size-3 shrink-0 rounded-[3px] bg-emerald-600" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-emerald-900">Aktivitas utama</span>
          <span className="block text-[11px] text-emerald-700/75">Satu aktivitas utama</span>
        </span>
        <strong className="font-mono text-sm tabular text-emerald-700">{persen(bobotUtama)}</strong>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <i className="size-3 shrink-0 rounded-[3px] bg-slate-500" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-slate-800">Aktivitas pendukung</span>
          <span className="block truncate text-[11px] text-slate-500" title={rincianPendukung}>
            {rincianPendukung}
          </span>
        </span>
        <strong className="font-mono text-sm tabular text-slate-600">{persen(total)}</strong>
      </div>
      <p className="text-[11px] text-slate-400 sm:col-span-2">
        Warna pekat menunjukkan bagian target yang sudah terealisasi.
      </p>
    </div>
  )
}
