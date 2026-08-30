import * as React from "react"
import { useParams } from "react-router-dom"

import { getPeriode, getRankingBidang, getRencanaBidang } from "@/services"
import type { CapaianBidang, Periode, RencanaBidangDetail } from "@/services"
import { BobotMeter } from "@/components/opera/bobot-meter"
import { BarCapaian, KartuKpi, Panel, PilihPeriode, Th, persen1, warnaCapaian } from "./bagian/ui"

export default function KinerjaBidang() {
  const { id } = useParams()
  const bidangId = Number(id)

  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [rencana, setRencana] = React.useState<RencanaBidangDetail | null>(null)
  const [ringkas, setRingkas] = React.useState<CapaianBidang | null>(null)
  const [memuat, setMemuat] = React.useState(true)
  const [tidakAda, setTidakAda] = React.useState(false)

  React.useEffect(() => {
    getPeriode()
      .then((p) => {
        setPeriodes(p)
        setPeriodeId((p.find((x) => x.status === "OPEN") ?? p[0])?.id ?? null)
      })
      .catch(() => setMemuat(false))
  }, [])

  React.useEffect(() => {
    if (periodeId == null || !Number.isFinite(bidangId)) return
    let batal = false
    setMemuat(true)
    Promise.all([getRencanaBidang(bidangId, periodeId), getRankingBidang(periodeId)])
      .then(([r, semua]) => {
        if (batal) return
        setTidakAda(r === null)
        setRencana(r)
        setRingkas(semua.find((b) => b.bidangId === bidangId) ?? null)
      })
      .finally(() => !batal && setMemuat(false))
    return () => { batal = true }
  }, [bidangId, periodeId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Capaian tiap subkegiatan memakai pembagian bobot 70% aktivitas utama dan 30%
            dibagi rata ke aktivitas pendukung.
          </p>
        </div>
        <PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId} />
      </div>

      {tidakAda && (
        <div className="p-6 text-sm bg-white border border-slate-200 rounded-2xl text-slate-600">
          Bidang atau periode tidak ditemukan.
        </div>
      )}

      {!tidakAda && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memuat || !ringkas ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[104px] bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))
            ) : (
              <>
                <KartuKpi label="Capaian bidang" nilai={persen1(ringkas.capaianBidang)}
                  catatan={`Rata-rata ${ringkas.jumlahSubkegiatan} subkegiatan — informasi, tidak dibobot`} />
                <KartuKpi label="Jumlah subkegiatan" nilai={String(ringkas.jumlahSubkegiatan)}
                  catatan="Dipegang bidang ini pada periode terpilih" />
                <KartuKpi label="Status rencana"
                  nilai={rencana?.status === "SIAP" ? "Siap" : "Draf"}
                  catatan={rencana?.periode.namaPeriode} />
              </>
            )}
          </div>

          <Panel judul="Subkegiatan bidang ini">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Kode</Th>
                  <Th>Subkegiatan</Th>
                  <Th>Pembagian bobot 70 / 30</Th>
                  <Th kanan>Capaian</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rencana?.baris.map((b) => {
                  const utama = b.aktifitas.find((a) => a.tipeAktifitas === "UTAMA")
                  const pendukung = b.aktifitas.filter((a) => a.tipeAktifitas === "PENDUKUNG")
                  return (
                    <tr key={b.subkegiatanBidang.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono text-xs whitespace-nowrap text-slate-400">
                        {b.kodeSubkegiatan}
                      </td>
                      <td className="max-w-sm px-6 py-3 text-sm text-slate-700">
                        <span className="line-clamp-2">{b.namaSubkegiatan}</span>
                        <p className="mt-0.5 text-xs text-slate-400">
                          target {b.subkegiatanBidang.target} {b.subkegiatanBidang.satuan}
                          {" · "}{pendukung.length} aktivitas pendukung
                        </p>
                      </td>
                      <td className="px-6 py-3 w-56">
                        {utama ? (
                          <BobotMeter
                            tinggi={10}
                            utama={{ nama: utama.namaAktifitas, target: utama.target, realisasi: utama.realisasi, bobotTarget: utama.bobotTarget }}
                            pendukung={pendukung.map((a) => ({
                              nama: a.namaAktifitas, target: a.target, realisasi: a.realisasi, bobotTarget: a.bobotTarget,
                            }))}
                          />
                        ) : (
                          <span className="text-xs text-red-600">Tanpa aktivitas utama</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`font-semibold tabular ${warnaCapaian(b.subkegiatanBidang.capaian)}`}>
                          {persen1(b.subkegiatanBidang.capaian)}
                        </span>
                        <div className="mt-1.5 w-20 ml-auto">
                          <BarCapaian persen={b.subkegiatanBidang.capaian} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!memuat && rencana?.baris.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-sm text-center text-slate-500">
                    Bidang ini belum punya subkegiatan pada periode tersebut.
                  </td></tr>
                )}
              </tbody>
            </table>
          </Panel>
        </>
      )}
    </div>
  )
}
