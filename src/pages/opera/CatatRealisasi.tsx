import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { History, PencilLine, RefreshCw, Trash2 } from "lucide-react"

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BobotLedger } from "@/components/opera/bobot-ledger"
import { MelebihiTargetBadge } from "@/components/opera/realisasi-status"
import {
  catatRealisasi, getAktifitasBidang, getBidang, getPeriode, pratinjauRealisasi, getRealisasiByIndikatorBidang, hapusRealisasi, ubahRealisasi,
} from "@/services"
import type {
  AktifitasPencatatan, Bidang, Periode, PratinjauRealisasi, RealisasiKegiatan,
} from "@/services"
import { usePeran } from "@/lib/peran"
import { KonfirmasiRealisasiMelebihiTarget } from "@/lib/konfirmasi-realisasi"
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
  const [konfirmasiTerbuka, setKonfirmasiTerbuka] = React.useState(false)

  const n = Number(jumlah)
  const sahih = Number.isSafeInteger(n) && n > 0

  // Pratinjau dihitung di service, bukan di komponen — rumusnya satu tempat.
  React.useEffect(() => {
    if (!sahih) { setPratinjau(null); return }
    let batal = false
    pratinjauRealisasi(baris.indikatorBidangId, n).then((p) => !batal && setPratinjau(p))
    return () => { batal = true }
  }, [baris.indikatorBidangId, n, sahih])

  const totalSetelah = pratinjau?.realisasiSetelah ?? baris.realisasi + n
  const target = pratinjau?.satuanTarget ?? baris.target

  async function lakukanSimpan() {
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

  function simpan() {
    if (target > 0 && totalSetelah > target) {
      setKonfirmasiTerbuka(true)
      return
    }
    void lakukanSimpan()
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
                type="number" step="1" min="0" max={Number.MAX_SAFE_INTEGER}
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
                    label: "Realisasi aktivitas ini",
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
        <KonfirmasiRealisasiMelebihiTarget
          open={konfirmasiTerbuka}
          total={totalSetelah}
          target={target}
          onPeriksaKembali={() => setKonfirmasiTerbuka(false)}
          onTetapSimpan={() => { setKonfirmasiTerbuka(false); void lakukanSimpan() }}
        />
      </DialogContent>
    </Dialog>
  )
}

function RiwayatRealisasi({ baris, bolehUbah, onTutup, onTersimpan }: { baris: AktifitasPencatatan; bolehUbah: boolean; onTutup: () => void; onTersimpan: () => void }) {
  const [data, setData] = React.useState<RealisasiKegiatan[] | null>(null)
  const [edit, setEdit] = React.useState<RealisasiKegiatan | null>(null)
  const [hapus, setHapus] = React.useState<RealisasiKegiatan | null>(null)
  const [tanggal, setTanggal] = React.useState("")
  const [jumlah, setJumlah] = React.useState("")
  const [keterangan, setKeterangan] = React.useState("")
  const [proses, setProses] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [konfirmasiEdit, setKonfirmasiEdit] = React.useState(false)
  const totalSetelahKoreksi = edit && Number.isFinite(Number(jumlah)) ? baris.realisasi - edit.jumlahRealisasi + Number(jumlah) : null
  const muat = React.useCallback(() => getRealisasiByIndikatorBidang(baris.indikatorBidangId).then(setData).catch((e) => setGalat(apiMessage(e, "Gagal memuat riwayat."))), [baris.indikatorBidangId])
  React.useEffect(() => { void muat() }, [muat])
  function mulaiEdit(item: RealisasiKegiatan) { setEdit(item); setTanggal(item.tanggalKegiatan); setJumlah(String(item.jumlahRealisasi)); setKeterangan(item.keterangan) }
  async function lakukanSimpanEdit() { if (!edit) return; setProses(true); try { await ubahRealisasi(edit.id, { tanggalKegiatan: tanggal, jumlahRealisasi: Number(jumlah), keterangan }); setEdit(null); await muat(); onTersimpan() } catch (e) { setGalat(apiMessage(e, "Gagal mengubah realisasi.")) } finally { setProses(false) } }
  function simpanEdit() { if (!edit || !Number.isSafeInteger(Number(jumlah)) || Number(jumlah) < 0 || totalSetelahKoreksi == null) return; if (baris.target > 0 && totalSetelahKoreksi > baris.target) { setKonfirmasiEdit(true); return } void lakukanSimpanEdit() }
  async function konfirmasiHapus() { if (!hapus) return; setProses(true); try { await hapusRealisasi(hapus.id); setHapus(null); await muat(); onTersimpan() } catch (e) { setGalat(apiMessage(e, "Gagal menghapus realisasi.")) } finally { setProses(false) } }
  return <Dialog open onOpenChange={(o) => !o && onTutup()}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Riwayat realisasi</DialogTitle><DialogDescription>{baris.namaAktifitas} · perubahan capaian dihitung ulang saat disimpan.</DialogDescription>{baris.realisasi > baris.target && <div className="pt-1"><MelebihiTargetBadge realisasi={baris.realisasi} target={baris.target} /></div>}</DialogHeader><div className="space-y-2 max-h-72 overflow-auto">{data === null ? <p className="text-sm text-slate-500">Memuat…</p> : data.length === 0 ? <p className="text-sm text-slate-500">Belum ada catatan.</p> : data.map((item) => <div className="rounded-lg border p-3 text-sm" key={item.id}><div className="flex justify-between gap-2"><span>{item.tanggalKegiatan} · <b>{angka1(item.jumlahRealisasi)}</b></span>{bolehUbah && <span className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => mulaiEdit(item)}><PencilLine className="size-4" /></Button><Button size="icon" variant="ghost" className="text-red-600" onClick={() => setHapus(item)}><Trash2 className="size-4" /></Button></span>}</div>{item.keterangan && <p className="mt-1 text-slate-500">{item.keterangan}</p>}</div>)}</div>{galat && <p className="text-sm text-red-600">{galat}</p>}{edit && <div className="space-y-2 border-t pt-3"><p className="font-medium text-sm">Koreksi catatan</p><div className="grid grid-cols-2 gap-2"><Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /><Input type="number" step="1" min="0" max={Number.MAX_SAFE_INTEGER} value={jumlah} onChange={(e) => setJumlah(e.target.value)} /></div><Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Keterangan" /><p className="text-xs text-slate-500">Pratinjau total aktivitas: {angka1(baris.realisasi)} → {totalSetelahKoreksi == null ? "—" : angka1(totalSetelahKoreksi)} dari {angka1(baris.target)}. Server menghitung ulang bobot dan capaian saat koreksi disimpan.</p>{totalSetelahKoreksi != null && totalSetelahKoreksi > baris.target && <p className="text-xs text-amber-700">Koreksi ini melebihi target dan akan meminta konfirmasi sebelum disimpan.</p>}<Button size="sm" disabled={proses} onClick={() => simpanEdit()}>{proses ? "Menyimpan…" : "Simpan koreksi"}</Button></div>}{hapus && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm"><p>Hapus catatan {hapus.tanggalKegiatan} sebesar {angka1(hapus.jumlahRealisasi)}? Capaian aktivitas dan subkegiatan akan dihitung ulang.</p><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => setHapus(null)}>Batal</Button><Button size="sm" variant="destructive" disabled={proses} onClick={() => void konfirmasiHapus()}>Hapus</Button></div></div>}<DialogFooter><Button variant="outline" onClick={onTutup}>Tutup</Button></DialogFooter><KonfirmasiRealisasiMelebihiTarget open={konfirmasiEdit} total={totalSetelahKoreksi ?? 0} target={baris.target} onPeriksaKembali={() => setKonfirmasiEdit(false)} onTetapSimpan={() => { setKonfirmasiEdit(false); void lakukanSimpanEdit() }} /></DialogContent></Dialog>
}

export default function CatatRealisasi() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { peran, bidangId: bidangPeran } = usePeran()
  const periodeTautan = Number(searchParams.get("periode"))
  const aktivitasTautan = Number(searchParams.get("aktifitas"))
  const tautanDiproses = React.useRef(false)
  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [bidangs, setBidangs] = React.useState<Bidang[]>([])
  const [bidangId, setBidangId] = React.useState<number | null>(bidangPeran)
  const [daftar, setDaftar] = React.useState<AktifitasPencatatan[]>([])
  const [saring, setSaring] = React.useState<Saring>("belum")
  const [memuat, setMemuat] = React.useState(true)
  const [galatMuat, setGalatMuat] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<AktifitasPencatatan | null>(null)
  const [riwayat, setRiwayat] = React.useState<AktifitasPencatatan | null>(null)

  const muatAwal = React.useCallback(async () => {
    setGalatMuat(null)
    setMemuat(true)
    const sumberBidang = peran === "admin_aplikasi" ? getBidang() : Promise.resolve<Bidang[]>([])
    try {
      const [p, b] = await Promise.all([getPeriode(), sumberBidang])
      setPeriodes(p)
      setPeriodeId((p.find((x) => x.id === periodeTautan) ?? p.find((x) => x.status === "OPEN") ?? p[0])?.id ?? null)
      setBidangs(b)
      if (peran === "admin_aplikasi") setBidangId((v) => v ?? b[0]?.id ?? null)
    } catch (e) { setGalatMuat(apiMessage(e, "Gagal memuat periode atau bidang.")); setMemuat(false) }
  }, [peran, periodeTautan])
  React.useEffect(() => { void muatAwal() }, [muatAwal])

  const muat = React.useCallback(async () => {
    if (periodeId == null || bidangId == null) return
    setMemuat(true)
    setGalatMuat(null)
    try {
      setDaftar(await getAktifitasBidang(bidangId, periodeId))
    } catch (e) {
      setDaftar([])
      setGalatMuat(apiMessage(e, "Gagal memuat aktivitas realisasi."))
    } finally {
      setMemuat(false)
    }
  }, [bidangId, periodeId])

  React.useEffect(() => { void muat() }, [muat])
  React.useEffect(() => {
    if (tautanDiproses.current || !Number.isInteger(aktivitasTautan) || daftar.length === 0) return
    const target = daftar.find((a) => a.indikatorBidangId === aktivitasTautan)
    tautanDiproses.current = true
    if (target) {
      setSaring("semua")
      setForm(target)
    }
    setSearchParams({}, { replace: true })
  }, [aktivitasTautan, daftar, setSearchParams])

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
          <p className="text-sm text-slate-500">
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

      {galatMuat && <Panel><div className="p-8 text-center"><p className="text-sm text-red-600">{galatMuat}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => { if (periodeId == null) void muatAwal(); else void muat() }}><RefreshCw className="size-3.5" /> Coba lagi</Button></div></Panel>}

      {!galatMuat && <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Subkegiatan</Th>
              <Th>Aktivitas</Th>
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
                Tidak ada aktivitas pada saringan ini.
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
                  <div className="mt-1"><MelebihiTargetBadge realisasi={a.realisasi} target={a.target} /></div>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className={`font-semibold tabular ${warnaCapaian(a.capaianSubkegiatan)}`}>
                    {persen1(a.capaianSubkegiatan)}
                  </span>
                  <div className="mt-1.5 w-16 ml-auto"><BarCapaian persen={a.capaianSubkegiatan} /></div>
                </td>
                <td className="px-6 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => setForm(a)} disabled={!dapatMencatat || peran !== "admin_bidang"}>
                    <PencilLine className="w-3.5 h-3.5" /> Catat
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-1" onClick={() => setRiwayat(a)}><History className="w-3.5 h-3.5" /> Riwayat</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>}

      {form && (
        <FormCatat baris={form} onTutup={() => setForm(null)} onTersimpan={() => void muat()} />
      )}
      {riwayat && <RiwayatRealisasi baris={riwayat} bolehUbah={dapatMencatat && peran === "admin_bidang"} onTutup={() => setRiwayat(null)} onTersimpan={() => void muat()} />}
    </div>
  )
}
