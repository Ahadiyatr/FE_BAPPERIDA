import * as React from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getAktifitasBidang, getPeriode } from "@/services"
import type { AktifitasPencatatan, Periode } from "@/services"
import { apiMessage } from "@/services/api"
import { usePeran } from "@/lib/peran"
import { Panel, PilihPeriode, persen1 } from "./bagian/ui"

export default function RencanaSaya() {
  const { bidangId } = usePeran()
  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [rows, setRows] = React.useState<AktifitasPencatatan[]>([])
  const [memuat, setMemuat] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)

  React.useEffect(() => {
    let batal = false
    setMemuat(true)
    getPeriode()
      .then((p) => {
        if (batal) return
        setPeriodes(p)
        setPeriodeId((p.find((x) => x.status === "OPEN") ?? p[0])?.id ?? null)
      })
      .catch((e) => {
        if (!batal) {
          setGalat(apiMessage(e, "Gagal memuat daftar periode."))
          setMemuat(false)
        }
      })
      .finally(() => !batal && !bidangId && setMemuat(false))
    return () => { batal = true }
  }, [bidangId])

  const muat = React.useCallback(async () => {
    if (periodeId == null || bidangId == null) {
      setRows([])
      setMemuat(false)
      return
    }
    setMemuat(true)
    setGalat(null)
    try {
      setRows(await getAktifitasBidang(bidangId, periodeId))
    } catch (e) {
      setRows([])
      setGalat(apiMessage(e, "Gagal memuat rencana bidang."))
    } finally {
      setMemuat(false)
    }
  }, [bidangId, periodeId])

  React.useEffect(() => { void muat() }, [muat])

  const belumAdaBidang = bidangId == null
  const belumAdaPeriode = !memuat && periodeId == null

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">Target dan bobot aktivitas bidang Anda dari backend OPERA INK.</p></div><PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId} /></div>
    <Panel>
      {memuat ? <p className="p-8 text-center text-sm text-slate-400">Memuat rencana…</p>
        : galat ? <div className="p-8 text-center"><p className="text-sm text-red-600">{galat}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => void muat()}><RefreshCw className="size-3.5" /> Coba lagi</Button></div>
        : belumAdaBidang ? <p className="p-8 text-center text-sm text-slate-500">Akun ini belum ditempatkan pada bidang. Hubungi admin aplikasi untuk menetapkan bidang Anda.</p>
        : belumAdaPeriode ? <p className="p-8 text-center text-sm text-slate-500">Belum ada periode yang dapat ditampilkan.</p>
        : rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Belum ada rencana aktivitas untuk periode ini.</p>
        : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{["Subkegiatan", "Aktivitas", "Jenis", "Target", "Bobot", "Realisasi"].map((x) => <th key={x} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((r) => <tr key={r.indikatorBidangId}><td className="max-w-sm px-5 py-3"><p className="font-mono text-xs text-slate-400">{r.kodeSubkegiatan}</p><p className="text-sm text-slate-700">{r.namaSubkegiatan}</p></td><td className="px-5 py-3 text-sm">{r.namaAktifitas}</td><td className="px-5 py-3 text-xs">{r.tipeAktifitas}</td><td className="px-5 py-3 text-sm tabular">{r.target}</td><td className="px-5 py-3 text-sm tabular">{persen1(r.bobotTarget)}</td><td className="px-5 py-3 text-sm tabular">{r.realisasi}</td></tr>)}</tbody></table></div>}
    </Panel>
  </div>
}
