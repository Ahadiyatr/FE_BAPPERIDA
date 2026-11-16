import * as React from "react"
import { persen1, persen2 } from "@/lib/format-angka"
import { cn } from "@/lib/utils"

interface Baris {
  label: string
  nilai: string
  total?: boolean
}

interface BobotLedgerProps extends React.HTMLAttributes<HTMLDivElement> {
  baris: Baris[]
  meter?: { jumlahPendukung: number; segmenBaru?: boolean }
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
          <div className="my-3 flex h-3.5 gap-0.5">
            <i className="flex-70 rounded-[1px] bg-emerald-600" />
            {Array.from({ length: meter.jumlahPendukung }, (_, i) => (
              <i
                key={i}
                className={cn(
                  "flex-10 rounded-[1px] bg-slate-400",
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
        { label: "Bobot realisasi aktivitas utama", nilai: persen2(bobotUtama) },
        {
          label: `Bobot realisasi ${jumlahPendukung} aktivitas pendukung`,
          nilai: persen2(bobotPendukung),
        },
        {
          label: "Capaian subkegiatan",
          nilai: persen1(bobotUtama + bobotPendukung),
          total: true,
        },
      ]}
    />
  )
}

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
          label: `${n} aktivitas pendukung × ${persen2(baru)}`,
          nilai: "30,0%",
        },
        { label: "Bobot baris baru ini", nilai: persen2(baru), total: true },
      ]}
      meter={{ jumlahPendukung: n, segmenBaru: true }}
      peringatan={
        jumlahSekarang > 0
          ? `Menambah baris ini menurunkan bobot ${jumlahSekarang} aktivitas pendukung yang sudah ada dari ${persen2(
              lama
            )} menjadi ${persen2(baru)}.`
          : undefined
      }
    />
  )
}
