import { Link, Navigate, useLocation } from "react-router-dom"
import { ShieldAlert } from "lucide-react"

import { LABEL_PERAN, bolehAkses, peranYangBoleh, usePeran } from "@/lib/peran"

/**
 * Penjaga rute untuk layar hasil refactor.
 *
 * SEMENTARA — berpasangan dengan saklar peran dummy. Fase 6 mengganti
 * sumber peran dengan sesi login sungguhan; komponen ini tetap dipakai,
 * hanya nilainya yang datang dari server. Penjaga di klien tidak pernah
 * cukup sendirian: backend tetap wajib menolak permintaan yang sama.
 */
export function PenjagaPeran({ children }: { children: React.ReactNode }) {
  const { peran, memuat } = usePeran()
  const { pathname } = useLocation()

  if (memuat) return <div className="p-8 text-center text-sm text-slate-500">Memeriksa sesi…</div>
  if (bolehAkses(peran, pathname)) return <>{children}</>

  // Pengunjung tanpa login tidak melihat halaman penolakan — ia diantar ke
  // landing publik yang memang tempatnya (keputusan 29 Agustus 2026).
  if (peran === "publik") {
    return <Navigate to="/login" replace state={{ dari: pathname }} />
  }

  const boleh = peranYangBoleh(pathname) ?? []
  return (
    <div className="max-w-lg p-6 mx-auto mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
        <div>
          <h2 className="font-semibold text-slate-900">Layar ini tidak terbuka untuk peran Anda</h2>
          <p className="mt-1 text-sm text-slate-500">
            Anda sedang melihat sebagai <b>{LABEL_PERAN[peran]}</b>. Layar ini hanya untuk{" "}
            {boleh.map((p) => LABEL_PERAN[p]).join(" dan ")}.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Gunakan akun dengan hak akses yang sesuai, atau{" "}
            <Link to="/dashboard" className="font-medium text-emerald-700 hover:underline">
              kembali ke dashboard
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
