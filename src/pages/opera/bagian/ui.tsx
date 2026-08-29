import * as React from "react"
import { Link } from "react-router-dom"

/* Potongan tampilan bersama untuk layar hasil refactor.
   Kelasnya mengikuti kosakata halaman lama: kartu putih rounded-2xl,
   border slate-200, header tabel slate-50 uppercase. */

export function Panel({
  judul, aksi, children, className = "",
}: {
  judul?: string
  aksi?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>
      {judul && (
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">{judul}</h2>
          {aksi}
        </div>
      )}
      {children}
    </div>
  )
}

export function Th({ children, kanan }: { children?: React.ReactNode; kanan?: boolean }) {
  return (
    <th
      scope="col"
      className={`px-6 py-3 text-xs font-semibold tracking-wider uppercase text-slate-500 ${
        kanan ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  )
}

export function KartuKpi({
  label, nilai, satuan, catatan,
}: {
  label: string
  nilai: string
  satuan?: string
  catatan?: string
}) {
  return (
    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular text-slate-900">
        {nilai}
        {satuan && <span className="ml-1 text-base font-medium text-slate-400">{satuan}</span>}
      </p>
      {catatan && <p className="mt-1 text-xs text-slate-500">{catatan}</p>}
    </div>
  )
}

/** Ambang warna capaian — satu tempat untuk seluruh layar. */
export function warnaCapaian(persen: number): string {
  if (persen >= 90) return "text-emerald-700"
  if (persen >= 60) return "text-amber-600"
  return "text-red-600"
}

export function BarCapaian({ persen }: { persen: number }) {
  const w = Math.max(0, Math.min(persen, 100))
  const warna = persen >= 90 ? "bg-emerald-600" : persen >= 60 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${warna}`} style={{ width: `${w}%` }} />
    </div>
  )
}

export const persen1 = (n: number) =>
  `${n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export function PilihPeriode({
  periodes, nilai, onPilih,
}: {
  periodes: { id: number; namaPeriode: string; status: string }[]
  nilai: number | null
  onPilih: (id: number) => void
}) {
  return (
    <select
      value={nilai ?? ""}
      onChange={(e) => onPilih(Number(e.target.value))}
      className="px-3 py-2 text-sm bg-white border rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none"
    >
      {periodes.map((p) => (
        <option key={p.id} value={p.id}>
          {p.namaPeriode} — {p.status}
        </option>
      ))}
    </select>
  )
}

export function TautanBidang({ id, children }: { id: number; children: React.ReactNode }) {
  return (
    <Link to={`/bidang/${id}`} className="font-medium text-emerald-700 hover:underline">
      {children}
    </Link>
  )
}
