import * as React from "react"
import { Eye, ListTree, RefreshCw, Rows3 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { MelebihiTargetBadge } from "@/components/opera/realisasi-status"
import { getPeriode, getRencanaSayaRingkas } from "@/services"
import type { DetailSubkegiatan, Periode } from "@/services"
import { apiMessage } from "@/services/api"
import { usePeran } from "@/lib/peran"
import { BarCapaian, Panel, PilihPeriode, Th, persen1, warnaCapaian } from "./bagian/ui"

type Mode = "subkegiatan" | "aktivitas"

const angka = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 })

export default function RencanaSaya() {
  const { bidangId } = usePeran()
  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [rows, setRows] = React.useState<DetailSubkegiatan[]>([])
  const [mode, setMode] = React.useState<Mode>("subkegiatan")
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
      setRows(await getRencanaSayaRingkas(periodeId))
    } catch (e) {
      setRows([])
      setGalat(apiMessage(e, "Gagal memuat rencana bidang."))
    } finally {
      setMemuat(false)
    }
  }, [bidangId, periodeId])

  React.useEffect(() => { void muat() }, [muat])

  const aktivitas = rows.flatMap((r) => r.aktifitas.map((a) => ({ rencana: r, aktivitas: a })))
  const belumAdaBidang = bidangId == null
  const belumAdaPeriode = !memuat && periodeId == null

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <p className="text-sm text-slate-500">Lihat target, capaian, aktivitas, dan bukti rencana bidang Anda.</p>
      <PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId} />
    </div>

    <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1">
      <Button size="sm" variant={mode === "subkegiatan" ? "default" : "ghost"} onClick={() => setMode("subkegiatan")}><ListTree className="size-3.5" /> Subkegiatan</Button>
      <Button size="sm" variant={mode === "aktivitas" ? "default" : "ghost"} onClick={() => setMode("aktivitas")}><Rows3 className="size-3.5" /> Aktivitas</Button>
    </div>

    <Panel>
      {memuat ? <p className="p-8 text-center text-sm text-slate-400">Memuat rencana…</p>
        : galat ? <div className="p-8 text-center"><p className="text-sm text-red-600">{galat}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => void muat()}><RefreshCw className="size-3.5" /> Coba lagi</Button></div>
        : belumAdaBidang ? <p className="p-8 text-center text-sm text-slate-500">Akun ini belum ditempatkan pada bidang. Hubungi admin aplikasi untuk menetapkan bidang Anda.</p>
        : belumAdaPeriode ? <p className="p-8 text-center text-sm text-slate-500">Belum ada periode yang dapat ditampilkan.</p>
        : rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Belum ada rencana untuk periode ini.</p>
        : mode === "subkegiatan" ? <TabelSubkegiatan rows={rows} /> : <TabelAktivitas rows={aktivitas} />}
    </Panel>
  </div>
}

function TabelSubkegiatan({ rows }: { rows: DetailSubkegiatan[] }) {
  return <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200">
    <thead className="bg-slate-50"><tr><Th>Subkegiatan</Th><Th>Indikator dan target</Th><Th kanan>Aktivitas</Th><Th kanan>Catatan / bukti</Th><Th kanan>Capaian</Th><Th kanan>Tindakan</Th></tr></thead>
    <tbody className="divide-y divide-slate-100">{rows.map((r) => {
      const jumlahCatatan = r.aktifitas.reduce((n, a) => n + a.jumlahCatatan, 0)
      const jumlahLampiran = r.aktifitas.reduce((n, a) => n + a.jumlahLampiran, 0)
      return <tr key={r.id} className="hover:bg-slate-50">
        <td className="max-w-sm px-5 py-3"><p className="font-mono text-xs text-slate-400">{r.kodeSubkegiatan}</p><p className="text-sm font-medium text-slate-700">{r.namaSubkegiatan}</p></td>
        <td className="max-w-sm px-5 py-3"><p className="line-clamp-2 text-sm text-slate-600">{r.indikatorKinerja || "—"}</p><p className="mt-1 text-xs text-slate-400">Target {angka(r.target)} {r.satuan}</p></td>
        <td className="px-5 py-3 text-right text-sm tabular">{r.aktifitas.length}</td>
        <td className="px-5 py-3 text-right text-sm tabular"><span>{jumlahCatatan}</span><span className="text-slate-300"> / </span><span>{jumlahLampiran}</span></td>
        <td className="min-w-28 px-5 py-3 text-right"><span className={`font-semibold tabular ${warnaCapaian(r.capaian)}`}>{persen1(r.capaian)}</span><div className="ml-auto mt-1.5 w-20"><BarCapaian persen={r.capaian} /></div></td>
        <td className="px-5 py-3 text-right"><Button size="sm" variant="outline" asChild><Link to={`/rencana-saya/${r.id}`}><Eye className="size-3.5" /> Detail</Link></Button></td>
      </tr>
    })}</tbody>
  </table></div>
}

function TabelAktivitas({ rows }: { rows: Array<{ rencana: DetailSubkegiatan; aktivitas: DetailSubkegiatan["aktifitas"][number] }> }) {
  return <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200">
    <thead className="bg-slate-50"><tr><Th>Subkegiatan</Th><Th>Aktivitas</Th><Th>Jenis</Th><Th kanan>Target</Th><Th kanan>Bobot</Th><Th kanan>Realisasi</Th></tr></thead>
    <tbody className="divide-y divide-slate-100">{rows.map(({ rencana, aktivitas: a }) => <tr key={a.id} className="hover:bg-slate-50">
      <td className="max-w-sm px-5 py-3"><p className="font-mono text-xs text-slate-400">{rencana.kodeSubkegiatan}</p><p className="text-sm text-slate-700">{rencana.namaSubkegiatan}</p></td>
      <td className="px-5 py-3 text-sm">{a.namaAktifitas}</td><td className="px-5 py-3 text-xs">{a.tipeAktifitas}</td><td className="px-5 py-3 text-right text-sm tabular">{angka(a.target)}</td><td className="px-5 py-3 text-right text-sm tabular">{persen1(a.bobotTarget)}</td><td className="px-5 py-3 text-right text-sm tabular">{angka(a.realisasi)}<div className="mt-1"><MelebihiTargetBadge realisasi={a.realisasi} target={a.target} /></div></td>
    </tr>)}</tbody>
  </table></div>
}
