import * as React from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft, Download, FileImage, FileText, Maximize2, PanelRightClose, PanelRightOpen,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AuthedImage } from "@/components/AuthedMedia"
import { getMonitoringSubkegiatan } from "@/services"
import type { DetailAktifitas, DetailCatatanRealisasi, DetailSubkegiatan, RealisasiLampiran } from "@/services"
import { apiMessage } from "@/services/api"
import { BobotMeter, BobotMeterLegenda } from "@/components/opera/bobot-meter"
import { LedgerCapaian } from "@/components/opera/bobot-ledger"
import { Kode } from "@/components/opera/primitives"
import {
  PratinjauLampiran, ekstensiBerkas, formatUkuranBerkas, unduhLampiran,
} from "@/components/opera/pratinjau-lampiran"
import { BarCapaian, Panel, Th, persen1, warnaCapaian } from "./bagian/ui"

const angka = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 })

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })

const warnaStatus: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-600",
  OPEN: "bg-emerald-50 text-emerald-700",
  LOCKED: "bg-slate-100 text-slate-600",
}

function BadgeTipe({ tipe, adhoc }: { tipe: "UTAMA" | "PENDUKUNG"; adhoc?: boolean }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-4 ${
        tipe === "UTAMA" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {tipe === "UTAMA" ? "Utama" : "Pendukung"}
      {adhoc && " · ad-hoc"}
    </span>
  )
}

function Fakta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:w-28 sm:pt-0.5">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-slate-700">{children}</dd>
    </div>
  )
}

/* ── Tabel datar: aktifitas + baris catatan realisasi ber-indent ─────────── */

function TabelAktifitas({
  aktifitas, lampiranTerpilih, onPilihCatatan,
}: {
  aktifitas: DetailAktifitas[]
  lampiranTerpilih: RealisasiLampiran | null
  onPilihCatatan: (c: DetailCatatanRealisasi) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 table-fixed">
        <colgroup>
          <col className="w-[46%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[13%]" />
          <col className="w-[9%]" />
        </colgroup>
        <thead className="bg-slate-50">
          <tr>
            <Th>Uraian</Th>
            <Th>Tanggal</Th>
            <Th kanan>Realisasi</Th>
            <Th kanan>Bobot real.</Th>
            <Th kanan>Bukti</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {aktifitas.map((a) => {
            const lampiranAkt = a.catatan.reduce((n, c) => n + c.lampiran.length, 0)
            return (
              <React.Fragment key={a.id}>
                <tr className="border-t border-slate-200 bg-slate-50/70 align-top">
                  <td className="px-4 py-2.5">
                    <div className="flex items-start gap-2">
                      <BadgeTipe tipe={a.tipeAktifitas} adhoc={a.flagAdhoc} />
                      <span className="line-clamp-2 text-sm font-medium text-slate-800">
                        {a.namaAktifitas}
                      </span>
                    </div>
                  </td>
                  <td />
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm tabular text-slate-600">
                    {angka(a.realisasi)} <span className="text-slate-400">/ {angka(a.target)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm">
                    <span className="font-semibold tabular text-slate-700">{persen1(a.bobotRealisasi)}</span>
                    <span className="tabular text-xs text-slate-400"> / {persen1(a.bobotTarget)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm tabular text-slate-500">
                    {lampiranAkt || "—"}
                  </td>
                </tr>

                {a.catatan.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-1.5 pl-11 pr-4 text-xs italic text-slate-400">
                      Belum ada realisasi dicatat.
                    </td>
                  </tr>
                ) : (
                  a.catatan.map((c) => {
                    const adaLampiran = c.lampiran.length > 0
                    const sorot =
                      lampiranTerpilih != null && c.lampiran.some((l) => l.id === lampiranTerpilih.id)
                    return (
                      <tr
                        key={c.id}
                        onClick={adaLampiran ? () => onPilihCatatan(c) : undefined}
                        className={`text-xs ${adaLampiran ? "cursor-pointer hover:bg-emerald-50/40" : ""} ${
                          sorot ? "bg-emerald-50" : ""
                        }`}
                      >
                        <td className="py-1.5 pl-11 pr-4 text-slate-600">
                          <span className="line-clamp-1">
                            <span className="text-slate-300">└ </span>
                            {c.keterangan || <span className="text-slate-400">Catatan realisasi</span>}
                          </span>
                        </td>
                        <td className="truncate px-4 py-1.5 text-slate-500">
                          {tanggal(c.tanggalKegiatan)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-1.5 text-right tabular text-slate-600">
                          +{angka(c.jumlahRealisasi)}
                        </td>
                        <td />
                        <td className="whitespace-nowrap px-4 py-1.5 text-right tabular text-slate-500">
                          {adaLampiran ? c.lampiran.length : "—"}
                        </td>
                      </tr>
                    )
                  })
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Sidebar kanan: daftar lampiran + pane pratinjau ────────────────────── */

function SidebarLampiran({
  aktifitas, terpilih, onPilih, onPerbesar,
}: {
  aktifitas: DetailAktifitas[]
  terpilih: RealisasiLampiran | null
  onPilih: (l: RealisasiLampiran) => void
  onPerbesar: (l: RealisasiLampiran) => void
}) {
  const grup = aktifitas
    .flatMap((a) => a.catatan.map((c) => ({ a, c })))
    .filter(({ c }) => c.lampiran.length > 0)
  const total = grup.reduce((n, { c }) => n + c.lampiran.length, 0)

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:max-h-[calc(100vh-6rem)]">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Lampiran ({total})</h2>
      </div>

      {total === 0 ? (
        <p className="p-6 text-sm text-slate-400">Belum ada lampiran pada subkegiatan ini.</p>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 max-lg:max-h-[45vh]">
            {grup.map(({ a, c }) => {
              const grupTerpilih = terpilih != null && c.lampiran.some((l) => l.id === terpilih.id)
              return (
                <div
                  key={c.id}
                  id={`lmp-catatan-${c.id}`}
                  className={`rounded-xl border p-2 ${
                    grupTerpilih ? "border-emerald-200 bg-emerald-50/40" : "border-slate-100 bg-slate-50/40"
                  }`}
                >
                  <p className="truncate px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {a.tipeAktifitas === "UTAMA" ? "Utama" : "Pendukung"} · {a.namaAktifitas}
                  </p>
                  <p className="px-1 pb-1 text-[11px] text-slate-400">
                    {tanggal(c.tanggalKegiatan)} · {angka(c.jumlahRealisasi)} tercatat
                  </p>
                  <div className="space-y-0.5">
                    {c.lampiran.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => onPilih(l)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${
                          terpilih?.id === l.id
                            ? "bg-emerald-100 font-medium text-emerald-800"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        {l.tipeBerkas === "FOTO" ? (
                          <FileImage className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        )}
                        <span className="flex-1 truncate">{l.namaBerkas}</span>
                        <span className="shrink-0 tabular text-[11px] text-slate-400">
                          {formatUkuranBerkas(l.ukuranByte)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {c.pencatat && (
                    <p className="mt-1.5 border-t border-slate-100 px-1 pt-1.5 text-[11px] text-slate-400">
                      Dicatat oleh <span className="text-slate-500">{c.pencatat}</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <Separator />

          <div className="shrink-0 p-3">
            {!terpilih ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Pilih lampiran untuk melihat pratinjau.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <span className="flex-1 truncate text-xs font-medium text-slate-700">
                    {terpilih.namaBerkas}
                  </span>
                  <button
                    type="button"
                    onClick={() => void unduhLampiran(terpilih)}
                    title="Unduh"
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPerbesar(terpilih)}
                    title="Perbesar"
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {terpilih.tipeBerkas === "FOTO" ? (
                  <div className="h-72 overflow-hidden rounded-lg bg-slate-100">
                    <AuthedImage
                      lampiranId={terpilih.id}
                      alt={terpilih.namaBerkas}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPerbesar(terpilih)}
                    className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-6 text-xs text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    <FileText className="h-8 w-8 text-slate-300" />
                    {(ekstensiBerkas(terpilih.namaBerkas) || "dokumen").toUpperCase()} · klik untuk
                    membuka pratinjau
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function DetailSubkegiatan() {
  const { id } = useParams()
  const rencanaId = Number(id)

  const [data, setData] = React.useState<DetailSubkegiatan | null>(null)
  const [memuat, setMemuat] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [lampiranTerpilih, setLampiranTerpilih] = React.useState<RealisasiLampiran | null>(null)
  const [pratinjau, setPratinjau] = React.useState<RealisasiLampiran | null>(null)
  const [sidebarTampil, setSidebarTampil] = React.useState(true)

  React.useEffect(() => {
    if (!Number.isFinite(rencanaId)) {
      setGalat("Subkegiatan tidak dikenali.")
      setMemuat(false)
      return
    }
    let batal = false
    setMemuat(true)
    setGalat(null)
    getMonitoringSubkegiatan(rencanaId)
      .then((d) => {
        if (batal) return
        setData(d)
        const pertama = d.aktifitas.flatMap((a) => a.catatan).flatMap((c) => c.lampiran)[0] ?? null
        setLampiranTerpilih(pertama)
      })
      .catch((e) => !batal && setGalat(apiMessage(e, "Subkegiatan tidak ditemukan atau gagal dimuat.")))
      .finally(() => !batal && setMemuat(false))
    return () => { batal = true }
  }, [rencanaId])

  const utama = data?.aktifitas.find((a) => a.tipeAktifitas === "UTAMA") ?? null
  const pendukung = data?.aktifitas.filter((a) => a.tipeAktifitas === "PENDUKUNG") ?? []
  const jumlahCatatan = data?.aktifitas.reduce((n, a) => n + a.catatan.length, 0) ?? 0
  const jumlahLampiran =
    data?.aktifitas.reduce((n, a) => n + a.catatan.reduce((m, c) => m + c.lampiran.length, 0), 0) ?? 0
  const bobotUtama = utama?.bobotRealisasi ?? 0
  const bobotPendukung = pendukung.reduce((n, a) => n + a.bobotRealisasi, 0)

  const pilihCatatan = (c: DetailCatatanRealisasi) => {
    const l = c.lampiran[0] ?? null
    setLampiranTerpilih(l)
    if (!sidebarTampil) {
      if (l) setPratinjau(l)
      return
    }
    requestAnimationFrame(() =>
      document
        .getElementById(`lmp-catatan-${c.id}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/monitoring"><ArrowLeft className="size-3.5" /> Monitoring Kinerja</Link>
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {data?.periode && (
              <span
                className={`rounded-lg px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${
                  warnaStatus[data.periode.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {data.periode.status}
              </span>
            )}
            {data && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarTampil((v) => !v)}
                title={sidebarTampil ? "Sembunyikan panel lampiran" : "Tampilkan panel lampiran"}
              >
                {sidebarTampil
                  ? <PanelRightClose className="size-3.5" />
                  : <PanelRightOpen className="size-3.5" />}
                Lampiran{jumlahLampiran ? ` (${jumlahLampiran})` : ""}
              </Button>
            )}
          </div>
        </div>

        {data && (
          <p className="truncate text-xs text-slate-500">
            <span className="font-mono text-slate-400">{data.kodeProgram}</span> {data.namaProgram}
            <span className="mx-1.5 text-slate-300">›</span>
            <span className="font-mono text-slate-400">{data.kodeKegiatan}</span> {data.namaKegiatan}
          </p>
        )}
        <h1 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
          {data
            ? `${data.kodeSubkegiatan} — ${data.namaSubkegiatan}`
            : galat
              ? "Tidak ditemukan"
              : "Memuat…"}
        </h1>
      </div>

      {galat && (
        <div className="p-4 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</div>
      )}

      {memuat && !data && (
        <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
          <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* ── Ringkasan: capaian + rincian ──────────────────── */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_1fr]">
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Capaian subkegiatan
              </p>
              <p className={`mt-2 text-4xl font-bold tabular ${warnaCapaian(data.capaian)}`}>
                {persen1(data.capaian)}
              </p>
              <div className="mt-3">
                <BarCapaian persen={data.capaian} />
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Rata-rata bobot 70/30 dari {data.aktifitas.length} aktifitas
              </p>
            </div>

            <Panel judul="Rincian subkegiatan">
              <dl className="divide-y divide-slate-100">
                <Fakta label="Bidang">{data.bidang?.namaBidang ?? "—"}</Fakta>
                <Fakta label="Periode">
                  {data.periode?.namaPeriode ?? "—"}
                  {data.periode && <span className="text-slate-400"> · {data.periode.status}</span>}
                </Fakta>
                <Fakta label="Target">
                  <span className="tabular">{angka(data.target)}</span>
                  {data.satuan ? ` ${data.satuan}` : ""}
                </Fakta>
                <Fakta label="Indikator">{data.indikatorKinerja || "—"}</Fakta>
                <Fakta label="Isi">
                  {data.aktifitas.length} aktifitas · {jumlahCatatan} catatan realisasi ·{" "}
                  {jumlahLampiran} lampiran
                </Fakta>
              </dl>
            </Panel>
          </div>

          {/* ── Pembagian bobot 70/30 ─────────────────────────── */}
          <Panel judul="Pembagian bobot 70 / 30">
            {utama ? (
              <div className="space-y-4 p-4 xl:grid xl:grid-cols-2 xl:gap-4 xl:space-y-0">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <BobotMeter
                    tinggi={18}
                    utama={{ nama: utama.namaAktifitas, target: utama.target, realisasi: utama.realisasi, bobotTarget: utama.bobotTarget }}
                    pendukung={pendukung.map((a) => ({
                      nama: a.namaAktifitas, target: a.target, realisasi: a.realisasi, bobotTarget: a.bobotTarget,
                    }))}
                  />
                  <BobotMeterLegenda bobotPendukung={pendukung.map((a) => a.bobotTarget)} />
                </div>
                <div className="max-w-md xl:max-w-none">
                  <LedgerCapaian
                    bobotUtama={bobotUtama}
                    bobotPendukung={bobotPendukung}
                    jumlahPendukung={pendukung.length}
                  />
                </div>
              </div>
            ) : (
              <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Tanpa aktifitas utama — tidak ada pemegang bobot 70%.
              </p>
            )}
          </Panel>

          {/* ── Tabel aktifitas + sidebar lampiran, sejajar ───── */}
          <div className={`grid gap-6 lg:items-start ${sidebarTampil ? "lg:grid-cols-[1fr_23rem]" : ""}`}>
            <div className="min-w-0 space-y-6">
              <Panel judul={`Aktifitas & realisasi (${data.aktifitas.length})`}>
                {data.aktifitas.length === 0 ? (
                  <p className="p-8 text-sm text-center text-slate-500">
                    Subkegiatan ini belum punya aktifitas tersusun.
                  </p>
                ) : (
                  <TabelAktifitas
                    aktifitas={data.aktifitas}
                    lampiranTerpilih={lampiranTerpilih}
                    onPilihCatatan={pilihCatatan}
                  />
                )}
              </Panel>

              <p className="text-xs text-slate-400">
                <Kode>{data.kodeSubkegiatan}</Kode> · angka berubah otomatis begitu realisasi baru dicatat.
              </p>
            </div>

            {sidebarTampil && (
              <aside className="lg:sticky lg:top-6">
                <SidebarLampiran
                  aktifitas={data.aktifitas}
                  terpilih={lampiranTerpilih}
                  onPilih={setLampiranTerpilih}
                  onPerbesar={setPratinjau}
                />
              </aside>
            )}
          </div>
        </div>
      )}

      {pratinjau && (
        <PratinjauLampiran lampiran={pratinjau} onTutup={() => setPratinjau(null)} />
      )}
    </div>
  )
}
