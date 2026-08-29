import * as React from "react"
import { getAktifitasBidang,getPeriode } from "@/services"
import type { AktifitasPencatatan,Periode } from "@/services"
import { usePeran } from "@/lib/peran"
import { Panel,PilihPeriode,persen1 } from "./bagian/ui"

export default function RencanaSaya(){
  const {bidangId}=usePeran()
  const [periodes,setPeriodes]=React.useState<Periode[]>([])
  const [periodeId,setPeriodeId]=React.useState<number|null>(null)
  const [rows,setRows]=React.useState<AktifitasPencatatan[]>([])
  const [memuat,setMemuat]=React.useState(true)
  React.useEffect(()=>{getPeriode().then(p=>{setPeriodes(p);setPeriodeId((p.find(x=>x.status==="OPEN")??p[0])?.id??null)})},[])
  React.useEffect(()=>{if(periodeId==null||bidangId==null)return;setMemuat(true);getAktifitasBidang(bidangId,periodeId).then(setRows).finally(()=>setMemuat(false))},[bidangId,periodeId])
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">Rencana Saya</h1><p className="mt-1 text-sm text-slate-500">Target dan bobot aktifitas bidang Anda dari backend OPERA INK.</p></div><PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId}/></div>
    <Panel><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{["Subkegiatan","Aktifitas","Jenis","Target","Bobot","Realisasi"].map(x=><th key={x} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{memuat?<tr><td colSpan={6} className="p-8 text-center text-sm text-slate-400">Memuat…</td></tr>:rows.map(r=><tr key={r.indikatorBidangId}><td className="max-w-sm px-5 py-3"><p className="font-mono text-xs text-slate-400">{r.kodeSubkegiatan}</p><p className="text-sm text-slate-700">{r.namaSubkegiatan}</p></td><td className="px-5 py-3 text-sm">{r.namaAktifitas}</td><td className="px-5 py-3 text-xs">{r.tipeAktifitas}</td><td className="px-5 py-3 text-sm tabular">{r.target}</td><td className="px-5 py-3 text-sm tabular">{persen1(r.bobotTarget)}</td><td className="px-5 py-3 text-sm tabular">{r.realisasi}</td></tr>)}</tbody></table></div></Panel>
  </div>
}
