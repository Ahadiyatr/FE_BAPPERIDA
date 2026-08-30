import * as React from "react"

import { Link } from "react-router-dom"
import { Download } from "lucide-react"
import {
  getPeriode, getRankingBidang, getRankingProgram, getRingkasanDashboard,
  getSubkegiatanTertinggal, getTrenCapaian,
  eksporLaporan,
} from "@/services"
import type {
  CapaianBidang, CapaianProgram, Periode, RingkasanDashboard, SubkegiatanTertinggal, TrenCapaian,
} from "@/services"
import { usePeran } from "@/lib/peran"
import { Button } from "@/components/ui/button"
import {
  BarCapaian, KartuKpi, Panel, PilihPeriode, TautanBidang, Th, persen1, warnaCapaian,
} from "./bagian/ui"

export default function DashboardUmum() {
  const { peran, bidangId } = usePeran()
  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [ringkas, setRingkas] = React.useState<RingkasanDashboard | null>(null)
  const [bidang, setBidang] = React.useState<CapaianBidang[]>([])
  const [program, setProgram] = React.useState<CapaianProgram[]>([])
  const [tertinggal, setTertinggal] = React.useState<SubkegiatanTertinggal[]>([])
  const [tren, setTren] = React.useState<TrenCapaian[]>([])
  const [memuat, setMemuat] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)

  React.useEffect(() => {
    getPeriode()
      .then((p) => {
        setPeriodes(p)
        setPeriodeId((p.find((x) => x.status === "OPEN") ?? p[0])?.id ?? null)
      })
      .catch(() => setGalat("Gagal memuat periode."))
  }, [])

  React.useEffect(() => {
    if (periodeId == null) return
    let batal = false
    setMemuat(true)
    Promise.all([
      getRingkasanDashboard(periodeId),
      getRankingBidang(periodeId),
      getRankingProgram(periodeId),
      getSubkegiatanTertinggal(periodeId),
      getTrenCapaian(periodeId),
    ])
      .then(([r, b, p, t, tr]) => {
        if (batal) return
        setRingkas(r); setBidang(b); setProgram(p); setTertinggal(t); setTren(tr)
      })
      .catch(() => !batal && setGalat("Gagal memuat capaian."))
      .finally(() => !batal && setMemuat(false))
    return () => { batal = true }
  }, [periodeId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Capaian BAPPERIDA dihitung ulang otomatis setiap ada bidang yang mencatat realisasi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId} />
          {peran === "admin_aplikasi" && periodeId != null && (
            <Button size="sm" variant="outline" onClick={() => void eksporLaporan(periodeId, "rincian")}>
              <Download className="size-3.5" /> Ekspor CSV
            </Button>
          )}
        </div>
      </div>

      {galat && (
        <div className="p-4 text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</div>
      )}

      {peran === "admin_bidang" && bidangId != null && (
        <div className="p-4 text-sm border bg-emerald-50 border-emerald-100 rounded-xl text-emerald-800">
          Anda masuk sebagai admin bidang.{" "}
          <Link to="/rencana-saya" className="font-medium text-emerald-700 hover:underline">
            Lihat rencana bidang Anda →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {memuat || !ringkas ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))
        ) : (
          <>
            <KartuKpi
              label="Capaian perangkat daerah"
              nilai={persen1(ringkas.capaianPd)}
              catatan="Rata-rata seluruh subkegiatan periode ini"
            />
            <KartuKpi
              label="Subkegiatan tersusun"
              nilai={String(ringkas.jumlahSubkegiatan)}
              catatan={`${ringkas.jumlahBidangSiap} dari ${ringkas.jumlahBidang} bidang berstatus siap`}
            />
            <KartuKpi
              label="Aktivitas"
              nilai={String(ringkas.jumlahAktifitas)}
              catatan="Utama + pendukung pada periode ini"
            />
            <KartuKpi
              label="Realisasi tercatat"
              nilai={String(ringkas.jumlahRealisasi)}
              satuan="catatan"
            />
          </>
        )}
      </div>

      <Panel judul={peran === "admin_bidang" ? "Tren capaian bidang" : "Tren capaian perangkat daerah"} aksi={<span className="text-xs text-slate-500">Maks. 6 periode terakhir</span>}>
        {memuat ? <div className="h-40 animate-pulse bg-slate-50" /> : tren.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Belum ada periode OPEN atau LOCKED untuk dibandingkan.</p>
        ) : (
          <div className="flex min-h-44 items-end gap-3 overflow-x-auto px-5 pb-5 pt-6">
            {tren.map((t) => (
              <div key={t.periodeId} className="flex min-w-24 flex-1 flex-col items-center gap-2 text-center" title={`${t.namaPeriode}: ${t.capaian}%`}>
                <span className="text-xs font-semibold tabular text-slate-700">{persen1(t.capaian)}</span>
                <div className="flex h-24 w-full max-w-16 items-end rounded-t-lg bg-slate-100">
                  <div className="w-full rounded-t-lg bg-emerald-600 transition-all" style={{ height: `${Math.max(2, Math.min(t.capaian, 100))}%` }} />
                </div>
                <div>
                  <p className="line-clamp-2 text-xs font-medium text-slate-700">{t.namaPeriode}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{t.jumlahSubkegiatan} subkeg · {t.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel judul="Kinerja per bidang">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Bidang</Th>
                <Th kanan>Capaian</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bidang.map((b) => (
                <tr key={b.bidangId} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    {peran === "admin_aplikasi"
                      ? <TautanBidang id={b.bidangId}>{b.namaBidang}</TautanBidang>
                      : <span className="font-medium text-slate-700">{b.namaBidang}</span>}
                    <p className="text-xs text-slate-400">{b.jumlahSubkegiatan} subkegiatan</p>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className={`font-semibold tabular ${warnaCapaian(b.capaianBidang)}`}>
                      {persen1(b.capaianBidang)}
                    </span>
                    <div className="mt-1.5 w-24 ml-auto"><BarCapaian persen={b.capaianBidang} /></div>
                  </td>
                </tr>
              ))}
              {!memuat && bidang.length === 0 && (
                <tr><td colSpan={2} className="px-6 py-8 text-sm text-center text-slate-500">Belum ada data.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel judul="Kinerja per program">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Program</Th>
                <Th kanan>Subkeg</Th>
                <Th kanan>Capaian</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {program.map((p) => (
                <tr key={p.programId} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <p className="font-mono text-xs text-slate-400">{p.kodeProgram}</p>
                    <p className="text-sm line-clamp-2 text-slate-700">{p.namaProgram}</p>
                  </td>
                  <td className="px-6 py-3 text-sm text-right tabular text-slate-500">{p.jumlahSubkegiatan}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`font-semibold tabular ${warnaCapaian(p.capaian)}`}>
                      {persen1(p.capaian)}
                    </span>
                    <div className="mt-1.5 w-20 ml-auto"><BarCapaian persen={p.capaian} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel judul={`Subkegiatan tertinggal (di bawah 60%)`}>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Kode</Th>
              <Th>Subkegiatan</Th>
              <Th>Bidang</Th>
              <Th kanan>Belum jalan</Th>
              <Th kanan>Capaian</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tertinggal.map((t) => (
              <tr key={t.subkegiatanBidangId} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-xs whitespace-nowrap text-slate-400">{t.kode}</td>
                <td className="px-6 py-3 text-sm text-slate-700"><span className="line-clamp-2">{t.nama}</span></td>
                <td className="px-6 py-3 text-sm text-slate-500">{t.namaBidang}</td>
                <td className="px-6 py-3 text-sm text-right tabular text-slate-500">
                  {t.jumlahAktifitasBelumJalan} aktivitas
                </td>
                <td className={`px-6 py-3 text-right font-semibold tabular ${warnaCapaian(t.capaian)}`}>
                  {persen1(t.capaian)}
                </td>
              </tr>
            ))}
            {!memuat && tertinggal.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-sm text-center text-slate-500">
                Tidak ada subkegiatan di bawah 60%.
              </td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
