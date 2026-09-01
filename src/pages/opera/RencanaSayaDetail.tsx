import * as React from "react"
import { ArrowLeft, Database, PencilLine, RefreshCw } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { BobotMeter, BobotMeterLegenda } from "@/components/opera/bobot-meter"
import { MelebihiTargetBadge } from "@/components/opera/realisasi-status"
import { Button } from "@/components/ui/button"
import { getRencanaSayaDetail } from "@/services"
import type { DetailSubkegiatan } from "@/services"
import { apiMessage } from "@/services/api"
import { BarCapaian, Panel, Th, persen1, warnaCapaian } from "./bagian/ui"

const angka = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 })

export default function RencanaSayaDetail() {
  const id = Number(useParams().id)
  const [data, setData] = React.useState<DetailSubkegiatan | null>(null)
  const [memuat, setMemuat] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)

  const muat = React.useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setGalat("Subkegiatan tidak dikenali.")
      setMemuat(false)
      return
    }
    setMemuat(true)
    setGalat(null)
    try { setData(await getRencanaSayaDetail(id)) }
    catch (e) { setData(null); setGalat(apiMessage(e, "Subkegiatan tidak ditemukan atau bukan milik bidang Anda.")) }
    finally { setMemuat(false) }
  }, [id])

  React.useEffect(() => { void muat() }, [muat])

  if (memuat) return <Panel><p className="p-8 text-center text-sm text-slate-400">Memuat detail rencana…</p></Panel>
  if (galat || !data) return <Panel><div className="p-8 text-center"><p className="text-sm text-red-600">{galat ?? "Data tidak tersedia."}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => void muat()}><RefreshCw className="size-3.5" /> Coba lagi</Button></div></Panel>

  const utama = data.aktifitas.find((a) => a.tipeAktifitas === "UTAMA")
  const pendukung = data.aktifitas.filter((a) => a.tipeAktifitas === "PENDUKUNG")
  const dapatMencatat = data.periode?.status === "OPEN"
  const jumlahCatatan = data.aktifitas.reduce((n, a) => n + a.jumlahCatatan, 0)
  const jumlahLampiran = data.aktifitas.reduce((n, a) => n + a.jumlahLampiran, 0)

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="ghost" size="sm" asChild className="-ml-2"><Link to="/rencana-saya"><ArrowLeft className="size-3.5" /> Rencana Saya</Link></Button>
      {data.periode && <span className="ml-auto rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-slate-600">{data.periode.namaPeriode} · {data.periode.status}</span>}
    </div>

    <Panel>
      <div className="space-y-4 p-5">
        <div><p className="font-mono text-xs text-slate-400">{data.kodeProgram} · {data.kodeKegiatan} · {data.kodeSubkegiatan}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{data.namaSubkegiatan}</h2><p className="mt-1 text-sm text-slate-500">{data.namaProgram} · {data.namaKegiatan}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fakta label="Indikator" nilai={data.indikatorKinerja || "—"} />
          <Fakta label="Output" nilai={data.outputKinerja || "—"} />
          <Fakta label="Target" nilai={`${angka(data.target)} ${data.satuan}`} />
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Capaian</p><p className={`mt-1 text-xl font-bold tabular ${warnaCapaian(data.capaian)}`}>{persen1(data.capaian)}</p><div className="mt-2"><BarCapaian persen={data.capaian} /></div></div>
        </div>
        {utama && <div><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pembagian bobot</p><span className="text-xs text-slate-400">{jumlahCatatan} catatan · {jumlahLampiran} bukti</span></div><BobotMeter utama={{ nama: utama.namaAktifitas, target: utama.target, realisasi: utama.realisasi, bobotTarget: utama.bobotTarget }} pendukung={pendukung.map((a) => ({ nama: a.namaAktifitas, target: a.target, realisasi: a.realisasi, bobotTarget: a.bobotTarget }))} /><BobotMeterLegenda bobotPendukung={pendukung.map((a) => a.bobotTarget)} /></div>}
      </div>
    </Panel>

    {!dapatMencatat && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Rencana ini hanya dapat dilihat. Pencatatan realisasi tersedia ketika periode berstatus <b>OPEN</b>.</div>}

    <Panel judul={`Aktivitas (${data.aktifitas.length})`}>
      <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50"><tr><Th>Aktivitas</Th><Th kanan>Bobot</Th><Th kanan>Realisasi</Th><Th kanan>Bobot real.</Th><Th kanan>Catatan / bukti</Th><Th kanan>Tindakan</Th></tr></thead>
        <tbody className="divide-y divide-slate-100">{data.aktifitas.map((a) => <tr key={a.id} className="hover:bg-slate-50">
          <td className="max-w-xl px-6 py-3"><span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${a.tipeAktifitas === "UTAMA" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{a.tipeAktifitas === "UTAMA" ? "Utama" : "Pendukung"}</span><span className="text-sm text-slate-700">{a.namaAktifitas}</span></td>
          <td className="px-6 py-3 text-right text-sm tabular">{persen1(a.bobotTarget)}</td><td className="px-6 py-3 text-right text-sm tabular">{angka(a.realisasi)} / {angka(a.target)}<div className="mt-1"><MelebihiTargetBadge realisasi={a.realisasi} target={a.target} /></div></td><td className="px-6 py-3 text-right text-sm tabular">{persen1(a.bobotRealisasi)}</td><td className="px-6 py-3 text-right text-sm tabular">{a.jumlahCatatan} / {a.jumlahLampiran}</td>
          <td className="whitespace-nowrap px-6 py-3 text-right">{dapatMencatat && <Button size="sm" variant="outline" asChild><Link to={`/realisasi?periode=${data.periode?.id}&aktifitas=${a.id}`}><PencilLine className="size-3.5" /> Catat</Link></Button>}{a.jumlahLampiran > 0 && <Button size="sm" variant="ghost" asChild className="ml-1"><Link to={`/bukti?periode=${data.periode?.id}`}><Database className="size-3.5" /> Bukti</Link></Button>}</td>
        </tr>)}</tbody>
      </table></div>
    </Panel>
  </div>
}

function Fakta({ label, nilai }: { label: string; nilai: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-700">{nilai}</p></div>
}
