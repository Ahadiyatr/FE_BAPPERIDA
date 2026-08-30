import * as React from "react"
import { ChevronRight, X } from "lucide-react"

import {
  getAktifitasByIndikatorUtama, getKegiatanByProgram, getPeriode, getProgram, getRankingProgram,
  getStrukturSubkegiatan,
} from "@/services"
import type {
  AktifitasDenganBobot, CapaianProgram, Kegiatan, Periode, Program, SubkegiatanStruktur,
} from "@/services"
import { BarCapaian, Panel, PilihPeriode, Th, persen1, warnaCapaian } from "./bagian/ui"

export default function StrukturProgram() {
  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [capaianProgram, setCapaianProgram] = React.useState<CapaianProgram[]>([])

  const [programAktif, setProgramAktif] = React.useState<Program | null>(null)
  const [kegiatans, setKegiatans] = React.useState<Kegiatan[]>([])
  const [kegiatanAktif, setKegiatanAktif] = React.useState<Kegiatan | null>(null)
  const [subs, setSubs] = React.useState<SubkegiatanStruktur[]>([])
  const [subAktif, setSubAktif] = React.useState<SubkegiatanStruktur | null>(null)
  const [aktifitas, setAktifitas] = React.useState<AktifitasDenganBobot[]>([])

  React.useEffect(() => {
    Promise.all([getPeriode(), getProgram()]).then(([p, pr]) => {
      setPeriodes(p)
      setPeriodeId((p.find((x) => x.status === "OPEN") ?? p[0])?.id ?? null)
      setPrograms(pr)
    })
  }, [])

  React.useEffect(() => {
    if (periodeId == null) return
    getRankingProgram(periodeId).then(setCapaianProgram)
  }, [periodeId])

  React.useEffect(() => {
    if (!programAktif) { setKegiatans([]); return }
    getKegiatanByProgram(programAktif.id).then(setKegiatans)
    setKegiatanAktif(null)
    setSubs([])
    setSubAktif(null)
    setAktifitas([])
  }, [programAktif])

  React.useEffect(() => {
    if (!kegiatanAktif || periodeId == null) { setSubs([]); setSubAktif(null); setAktifitas([]); return }
    let batal = false
    getStrukturSubkegiatan(kegiatanAktif.id, periodeId).then((daftar) => {
      if (!batal) setSubs(daftar)
    })
    return () => { batal = true }
  }, [kegiatanAktif, periodeId])

  React.useEffect(() => {
    if (!subAktif) { setAktifitas([]); return }
    let batal = false
    getAktifitasByIndikatorUtama(subAktif.indikatorUtamaId)
      .then(rows => { if (!batal) setAktifitas(rows) })
    return () => { batal = true }
  }, [subAktif])

  const capaianDari = (programId: number) =>
    capaianProgram.find((c) => c.programId === programId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Telusur hirarki program → kegiatan → subkegiatan, beserta bidang penanggung
            jawab dan capaiannya pada periode terpilih.
          </p>
        </div>
        <PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId} />
      </div>

      {(programAktif || kegiatanAktif || subAktif) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm border bg-emerald-50 border-emerald-100 rounded-xl">
          <button onClick={() => setProgramAktif(null)} className="text-emerald-700 hover:underline">
            Semua program
          </button>
          {programAktif && (
            <>
              <ChevronRight className="w-3 h-3 text-emerald-400" />
              <button
                onClick={() => setKegiatanAktif(null)}
                className="font-medium text-emerald-800 hover:underline"
              >
                {programAktif.kodeProgram}
              </button>
            </>
          )}
          {kegiatanAktif && (
            <>
              <ChevronRight className="w-3 h-3 text-emerald-400" />
              <span className="font-medium text-emerald-800">{kegiatanAktif.kodeKegiatan}</span>
            </>
          )}
          {subAktif && (
            <>
              <ChevronRight className="w-3 h-3 text-emerald-400" />
              <span className="font-medium text-emerald-800">{subAktif.kode}</span>
            </>
          )}
          <button
            onClick={() => { setProgramAktif(null); setKegiatanAktif(null); setSubAktif(null) }}
            className="flex items-center gap-1 ml-auto text-xs text-slate-500 hover:text-slate-700"
          >
            Bersihkan <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {!programAktif && (
        <Panel judul={`Program (${programs.length})`}>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr><Th>Kode</Th><Th>Nama program</Th><Th kanan>Subkeg</Th><Th kanan>Capaian</Th><Th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programs.map((p) => {
                const c = capaianDari(p.id)
                return (
                  <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setProgramAktif(p)}>
                    <td className="px-6 py-3 font-mono text-xs whitespace-nowrap text-slate-400">{p.kodeProgram}</td>
                    <td className="px-6 py-3 text-sm text-slate-700"><span className="line-clamp-2">{p.namaProgram}</span></td>
                    <td className="px-6 py-3 text-sm text-right tabular text-slate-500">{c?.jumlahSubkegiatan ?? 0}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`font-semibold tabular ${warnaCapaian(c?.capaian ?? 0)}`}>
                        {persen1(c?.capaian ?? 0)}
                      </span>
                      <div className="mt-1.5 w-20 ml-auto"><BarCapaian persen={c?.capaian ?? 0} /></div>
                    </td>
                    <td className="px-6 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
      )}

      {programAktif && !kegiatanAktif && (
        <Panel judul={`Kegiatan dalam ${programAktif.kodeProgram} (${kegiatans.length})`}>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr><Th>Kode</Th><Th>Nama kegiatan</Th><Th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kegiatans.map((k) => (
                <tr key={k.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setKegiatanAktif(k)}>
                  <td className="px-6 py-3 font-mono text-xs whitespace-nowrap text-slate-400">{k.kodeKegiatan}</td>
                  <td className="px-6 py-3 text-sm text-slate-700"><span className="line-clamp-2">{k.namaKegiatan}</span></td>
                  <td className="px-6 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {kegiatanAktif && (
        <Panel judul={`Subkegiatan dalam ${kegiatanAktif.kodeKegiatan} (${subs.length})`}>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr><Th>Kode</Th><Th>Subkegiatan</Th><Th>Bidang</Th><Th kanan>Capaian</Th><Th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subs.map((s) => (
                <tr key={s.indikatorUtamaId} className="cursor-pointer hover:bg-slate-50" onClick={() => setSubAktif(s)}>
                  <td className="px-6 py-3 font-mono text-xs whitespace-nowrap text-slate-400">{s.kode}</td>
                  <td className="max-w-md px-6 py-3 text-sm text-slate-700">
                    <span className="line-clamp-2">{s.nama}</span>
                    <p className="mt-0.5 text-xs text-slate-400">{s.indikatorKinerja}</p>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500">
                    {s.namaBidang ?? <span className="text-slate-400">belum ditugaskan</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {s.capaian === null ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <span className={`font-semibold tabular ${warnaCapaian(s.capaian)}`}>
                        {persen1(s.capaian)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right"><ChevronRight className="ml-auto w-4 h-4 text-slate-300" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {subAktif && (
        <Panel judul={`Aktivitas dalam ${subAktif.kode} (${aktifitas.length})`}>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr><Th>Kode</Th><Th>Aktivitas</Th><Th>Tipe</Th><Th>Satuan</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aktifitas.map(a => (
                <tr key={a.id}>
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{a.kodeIndikator}</td>
                  <td className="px-6 py-3 text-sm text-slate-700">{a.namaIndikator}</td>
                  <td className="px-6 py-3 text-xs font-medium text-slate-600">{a.tipeAktifitas}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{a.satuan}</td>
                </tr>
              ))}
              {!aktifitas.length && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">Belum ada aktivitas aktif.</td></tr>}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  )
}
