import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   Primitif kecil yang dipakai berulang di seluruh OPERA.
   Semuanya tipis — sengaja, supaya tidak jadi lapisan abstraksi
   yang harus dipelihara.
   ═══════════════════════════════════════════════════════════════ */

/** Label kapital berspasi lebar di atas judul. */
export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-mono text-eyebrow font-medium uppercase text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/** Kode rekening: 5.1.2.2.01.1. Selalu mono, selalu tabular. */
export function Kode({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "tabular whitespace-nowrap font-mono text-[11.5px] tracking-[-0.02em] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/* ─────────────────────────────────────────────────────────────
   Status. Ambang batas ditetapkan di satu tempat supaya seluruh
   aplikasi memberi warna yang sama untuk angka yang sama.
   ───────────────────────────────────────────────────────────── */

export type Nada = "teal" | "amber" | "rust" | "brass" | "netral"

export const nadaCapaian = (persen: number): Nada =>
  persen >= 90 ? "teal" : persen >= 60 ? "amber" : "rust"

const kelasNada: Record<Nada, string> = {
  teal: "bg-teal-tint text-teal",
  amber: "bg-amber-tint text-amber",
  rust: "bg-rust-tint text-rust",
  brass: "bg-brass-tint text-brass",
  netral: "bg-muted text-muted-foreground",
}

const kelasTeks: Record<Nada, string> = {
  teal: "text-teal",
  amber: "text-amber",
  rust: "text-rust",
  brass: "text-brass",
  netral: "text-muted-foreground",
}

/**
 * Lencana status. Membungkus <Badge> shadcn, bukan menggantikannya —
 * varian bawaan (default/secondary/destructive) tidak punya nada
 * teal/amber/brass yang dibutuhkan OPERA.
 */
export function StatusBadge({
  nada = "netral",
  className,
  ...props
}: React.ComponentProps<typeof Badge> & { nada?: Nada }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-[2px] border-0 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.07em]",
        kelasNada[nada],
        className
      )}
      {...props}
    />
  )
}

/** Angka persen capaian, diberi warna sesuai ambang. */
export function CapaianPersen({
  nilai,
  desimal = 1,
  className,
}: {
  nilai: number
  desimal?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        "tabular font-display text-[13px] font-bold",
        kelasTeks[nadaCapaian(nilai)],
        className
      )}
    >
      {nilai.toFixed(desimal).replace(".", ",")}%
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────
   ChainNav — navigasi data berjenjang.
   Dipakai di layar Data Master untuk Program → Kegiatan →
   Subkegiatan → Aktifitas. Bukan <Tabs>: tab sejajar menyiratkan
   lima hal setara, padahal ini rantai induk-anak.
   ───────────────────────────────────────────────────────────── */

export interface MataRantai {
  id: string
  tingkat: string
  label: string
  jumlah: number
  /** Titik amber di pojok — menandai masalah skema yang belum beres. */
  bermasalah?: boolean
}

export function ChainNav({
  mata,
  aktif,
  onPilih,
  className,
}: {
  mata: MataRantai[]
  aktif: string
  onPilih: (id: string) => void
  className?: string
}) {
  return (
    <nav
      className={cn(
        "flex overflow-hidden rounded-sm border bg-card shadow-card",
        className
      )}
      aria-label="Tingkat data master"
    >
      {mata.map((m) => {
        const dipilih = m.id === aktif
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onPilih(m.id)}
            aria-current={dipilih ? "page" : undefined}
            className={cn(
              "relative min-w-0 flex-1 border-r px-3.5 py-2.5 text-left last:border-r-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dipilih ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
            )}
          >
            {m.bermasalah && (
              <span
                className="absolute right-2 top-2 size-1.5 rounded-full bg-amber"
                title="Bertumpang tindih dengan master lain"
              />
            )}
            <span
              className={cn(
                "block font-mono text-[9.5px] uppercase tracking-[0.14em]",
                dipilih ? "text-brass" : "text-muted-foreground"
              )}
            >
              {m.tingkat}
            </span>
            <span className="mt-1 block truncate font-display text-[12.5px] font-bold tracking-[-0.01em]">
              {m.label}
            </span>
            <span
              className={cn(
                "tabular mt-0.5 block font-mono text-[10.5px]",
                dipilih ? "text-primary-foreground/55" : "text-muted-foreground"
              )}
            >
              {m.jumlah} baris
            </span>
          </button>
        )
      })}
    </nav>
  )
}
