import * as React from "react"
import { PencilLine } from "lucide-react"

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BobotLedger } from "@/components/opera/bobot-ledger"
import {
  catatRealisasi, getAktifitasBidang, getBidang, getPeriode, pratinjauRealisasi,
} from "@/services"
import type {
  AktifitasPencatatan, Bidang, Periode, PratinjauRealisasi,
} from "@/services"
import { usePeran } from "@/lib/peran"
import { apiMessage } from "@/services/api"
import { BarCapaian, Panel, PilihPeriode, Th, persen1, warnaCapaian } from "./bagian/ui"

type Saring = "belum" | "semua" | "selesai"
const TAB: { id: Saring; label: string }[] = [
  { id: "belum", label: "Belum lengkap" },
  { id: "semua", label: "Semua" },
  { id: "selesai", label: "Selesai" },
]

const angka1 = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 })

function FormCatat({
  baris, onTutup, onTersimpan,
}: {
  baris: AktifitasPencatatan
  onTutup: () => void
  onTersimpan: () => void
}) {
  const { bidangId } = usePeran()
  const [tanggal, setTanggal] = React.useState(new Date().toISOString().slice(0, 10))
  const [jumlah, setJumlah] = React.useState("1")
  const [keterangan, setKeterangan] = React.useState("")
  const [bukti, setBukti] = React.useState<File[]>([])
  const [pratinjau, setPratinjau] = React.useState<PratinjauRealisasi | null>(null)
  const [menyimpan, setMenyimpan] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)

  const n = Number(jumlah)
  const sahih = Number.isFinite(n) && n > 0

  // Pratinjau dihitung di service, bukan di komponen — rumusnya satu tempat.
  React.useEffect(() => {
    if (!sahih) { setPratinjau(null); return }
    let batal = false
    pratinjauRealisasi(baris.indikatorBidangId, n).then((p) => !batal && setPratinjau(p))
    return () => { batal = true }
  }, [baris.indikatorBidangId, n, sahih])

  async function simpan() {
    setMenyimpan(true)
    setGalat(null)
    try {
      await catatRealisasi({
        indikatorBidangId: baris.indikatorBidangId,
        tanggalKegiatan: tanggal,
        jumlahRealisasi: n,
        keterangan: keterangan.trim(),
        createdBy: bidangId ?? 1,
        fotos: bukti.filter((f) => f.type.startsWith("image/")),
        dokumen: bukti.find((f) => !f.type.startsWith("image/")) ?? null,
      })
      onTersimpan()
      onTutup()
    } catch (e) {
      setGalat(apiMessage(e, "Gagal menyimpan realisasi."))
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onTutup()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Catat realisasi</DialogTitle>
          <DialogDescription>
            {baris.namaAktifitas} · target {angka1(baris.target)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Bukti kegiatan (wajib)</span>
            <Input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setBukti(Array.from(e.target.files ?? []))} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
                Tanggal kegiatan
              </span>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </label>
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
                Jumlah realisasi
              </span>
              <Input
                type="number" step="any" min="0"
                className="font-mono tabular"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
              Keterangan
            </span>
            <Textarea rows={2} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
          </label>

          {pratinjau && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pratinjau sebelum simpan
              </p>
              <BobotLedger
                baris={[
                  {
                    label: "Realisasi aktifitas ini",
                    nilai: `${angka1(pratinjau.realisasiSekarang)} → ${angka1(pratinjau.realisasiSetelah)} dari ${angka1(pratinjau.satuanTarget)}`,
                  },
                  {
                    label: `Bobot target (${baris.tipeAktifitas === "UTAMA" ? "utama" : "pendukung"})`,
                    nilai: persen1(pratinjau.bobotTarget),
                  },
                  {
                    label: "Bobot realisasi = (realisasi ÷ target) × bobot target",
                    nilai: `${persen1(pratinjau.bobotRealisasiSekarang)} → ${persen1(pratinjau.bobotRealisasiSetelah)}`,
                  },
                  {
                    label: "Capaian subkegiatan",
                    nilai: `${persen1(pratinjau.capaianSekarang)} → ${persen1(pratinjau.capaianSetelah)}`,
                    total: true,
                  },
                ]}
                peringatan={
                  pratinjau.melebihiTarget
                    ? `Realisasi melampaui target. Kelebihannya tidak menambah capaian karena subkegiatan dibatasi 100%.`
                    : undefined
                }
              />
            </div>
          )}

          {galat && (
            <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onTutup}>Batal</Button>
          <Button onClick={() => void simpan()} disabled={!sahih || !bukti.length || menyimpan}>
            {menyimpan ? "Menyimpan…" : "Simpan realisasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CatatRealisasi() {
  const { peran, bidangId: bidangPeran } = usePeran()
  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [bidangs, setBidangs] = React.useState<Bidang[]>([])
  const [bidangId, setBidangId] = React.useState<number | null>(bidangPeran)
  const [daftar, setDaftar] = React.useState<AktifitasPencatatan[]>([])
  const [saring, setSaring] = React.useState<Saring>("belum")
  const [memuat, setMemuat] = React.useState(true)
  const [form, setForm] = React.useState<AktifitasPencatatan | null>(null)

  React.useEffect(() => {
    const sumberBidang = peran === "admin_aplikasi" ? getBidang() : Promise.resolve<Bidang[]>([])
    Promise.all([getPeriode(), sumberBidang]).then(([p, b]) => {
      setPeriodes(p)
      setPeriodeId((p.find((x) => x.status === "OPEN") ?? p[0])?.id ?? null)
      setBidangs(b)
      if (peran === "admin_aplikasi") setBidangId((v) => v ?? b[0]?.id ?? null)
    })
  }, [peran])

  const muat = React.useCallback(async () => {
    if (periodeId == null || bidangId == null) return
    setMemuat(true)
    try {
      setDaftar(await getAktifitasBidang(bidangId, periodeId))
    } finally {
      setMemuat(false)
    }
  }, [bidangId, periodeId])

  React.useEffect(() => { void muat() }, [muat])

  const terlihat = daftar.filter((a) =>
    saring === "semua" ? true : saring === "selesai" ? a.selesai : !a.selesai
  )
  const jumlah = {
    belum: daftar.filter((a) => !a.selesai).length,
    semua: daftar.length,
    selesai: daftar.filter((a) => a.selesai).length,
  }
  const periodeTerpilih = periodes.find((p) => p.id === periodeId)
  const dapatMencatat = periodeTerpilih?.status === "OPEN"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catat Realisasi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Setiap pencatatan langsung menyusun ulang bobot realisasi dan capaian
            subkegiatannya. Efeknya ditampilkan sebelum disimpan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {peran === "admin_aplikasi" && (
            <select
              value={bidangId ?? ""}
              onChange={(e) => setBidangId(Number(e.target.value))}
              className="px-3 py-2 text-sm bg-white border rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              {bidangs.map((b) => <option key={b.id} value={b.id}>{b.namaBidang}</option>)}
            </select>
          )}
          <PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId} />
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-white border w-fit border-slate-200 rounded-xl">
        {TAB.map((t) => (
          <button
            key={t.id}
            onClick={() => setSaring(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              saring === t.id
                ? "bg-emerald-600 font-medium text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 tabular ${saring === t.id ? "text-emerald-100" : "text-slate-400"}`}>
              {jumlah[t.id]}
            </span>
          </button>
        ))}
      </div>

      {!dapatMencatat && periodeTerpilih && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Periode <b>{periodeTerpilih.namaPeriode}</b> berstatus <b>{periodeTerpilih.status}</b>.
          Realisasi hanya dapat dicatat saat periode berstatus OPEN.
        </div>
      )}

      <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Subkegiatan</Th>
              <Th>Aktifitas</Th>
              <Th kanan>Bobot</Th>
              <Th kanan>Realisasi</Th>
              <Th kanan>Capaian subkeg</Th>
              <Th kanan>Tindakan</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memuat && (
              <tr><td colSpan={6} className="px-6 py-8 text-sm text-center text-slate-400">Memuat…</td></tr>
            )}
            {!memuat && terlihat.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-sm text-center text-slate-500">
                Tidak ada aktifitas pada saringan ini.
              </td></tr>
            )}
            {!memuat && terlihat.map((a) => (
              <tr key={a.indikatorBidangId} className="hover:bg-slate-50">
                <td className="max-w-xs px-6 py-3">
                  <p className="font-mono text-xs text-slate-400">{a.kodeSubkegiatan}</p>
                  <p className="text-sm line-clamp-2 text-slate-600">{a.namaSubkegiatan}</p>
                </td>
                <td className="max-w-xs px-6 py-3">
                  <span className={`mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    a.tipeAktifitas === "UTAMA"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {a.tipeAktifitas === "UTAMA" ? "Utama" : "Pendukung"}
                  </span>
                  <span className="text-sm text-slate-700">{a.namaAktifitas}</span>
                  {a.jumlahCatatan > 0 && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {a.jumlahCatatan} catatan · {a.jumlahLampiran} lampiran
                    </p>
                  )}
                </td>
                <td className="px-6 py-3 text-sm text-right tabular text-slate-500">
                  {persen1(a.bobotTarget)}
                </td>
                <td className="px-6 py-3 text-sm text-right whitespace-nowrap tabular">
                  <span className={a.selesai ? "font-medium text-emerald-700" : "text-slate-700"}>
                    {angka1(a.realisasi)}
                  </span>
                  <span className="text-slate-400"> / {angka1(a.target)}</span>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className={`font-semibold tabular ${warnaCapaian(a.capaianSubkegiatan)}`}>
                    {persen1(a.capaianSubkegiatan)}
                  </span>
                  <div className="mt-1.5 w-16 ml-auto"><BarCapaian persen={a.capaianSubkegiatan} /></div>
                </td>
                <td className="px-6 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => setForm(a)} disabled={!dapatMencatat}>
                    <PencilLine className="w-3.5 h-3.5" /> Catat
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {form && (
        <FormCatat baris={form} onTutup={() => setForm(null)} onTersimpan={() => void muat()} />
      )}
    </div>
  )
}
