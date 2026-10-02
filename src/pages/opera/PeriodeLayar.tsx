import * as React from "react"
import { Calculator, Lock, LockOpen, Plus, Trash2 } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  cekSyaratBuka, getCapaianPeriode, getDokumen, getPeriode, hapusPeriode, hitungUlangCapaian,
  simpanPeriode, ubahStatusPeriode,
} from "@/services"
import { apiMessage } from "@/services/api"
import type { Dokumen, Periode, StatusPeriode, SyaratBukaPeriode } from "@/services"
import { Panel, Th } from "./bagian/ui"

const NADA: Record<StatusPeriode, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  OPEN: "bg-emerald-50 text-emerald-700",
  LOCKED: "bg-amber-50 text-amber-700",
}
const LABEL: Record<StatusPeriode, string> = { DRAFT: "Draf", OPEN: "Terbuka", LOCKED: "Terkunci" }

const tgl = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

export default function PeriodeLayar() {
  const [daftar, setDaftar] = React.useState<Periode[]>([])
  const [syarat, setSyarat] = React.useState<Record<number, SyaratBukaPeriode>>({})
  const [memuat, setMemuat] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [pesan, setPesan] = React.useState<string | null>(null)
  const [capaian, setCapaian] = React.useState<Record<number, number>>({})
  const [form, setForm] = React.useState<Periode | null | undefined>(undefined)
  const [konfirmasi, setKonfirmasi] = React.useState<{ p: Periode; ke: StatusPeriode } | null>(null)
  const [hitungUlang, setHitungUlang] = React.useState<Periode | null>(null)
  const [akanDihapus, setAkanDihapus] = React.useState<Periode | null>(null)
  const [sedangMenghitung, setSedangMenghitung] = React.useState(false)
  const [sedangMenghapus, setSedangMenghapus] = React.useState(false)

  const muat = React.useCallback(async () => {
    setMemuat(true)
    try {
      const p = await getPeriode()
      setDaftar(p)
      const s = await Promise.all(p.map((x) => cekSyaratBuka(x.id, p)))
      setSyarat(Object.fromEntries(p.map((x, i) => [x.id, s[i]])))
      const hasilCapaian = await Promise.all(p.filter((x) => x.status !== "DRAFT").map(async (x) => {
        try { return [x.id, (await getCapaianPeriode(x.id)).capaianPd] as const }
        catch { return null }
      }))
      setCapaian(Object.fromEntries(hasilCapaian.filter((x): x is readonly [number, number] => x !== null)))
    } finally {
      setMemuat(false)
    }
  }, [])
  React.useEffect(() => { void muat() }, [muat])

  async function ubah(p: Periode, ke: StatusPeriode) {
    setGalat(null)
    try { await ubahStatusPeriode(p.id, ke); await muat() }
    catch (e) { setGalat(apiMessage(e, "Gagal mengubah status periode.")) }
    finally { setKonfirmasi(null) }
  }

  async function jalankanHitungUlang() {
    if (!hitungUlang) return
    setSedangMenghitung(true); setGalat(null); setPesan(null)
    try {
      const hasil = await hitungUlangCapaian(hitungUlang.id)
      setCapaian((lama) => ({ ...lama, [hitungUlang.id]: hasil.capaianPd }))
      setPesan(`Capaian ${hitungUlang.namaPeriode} berhasil dihitung ulang.`)
      setHitungUlang(null)
    } catch (e) { setGalat(apiMessage(e, "Gagal menghitung ulang capaian.")) }
    finally { setSedangMenghitung(false) }
  }

  async function jalankanHapus() {
    if (!akanDihapus) return
    setSedangMenghapus(true); setGalat(null); setPesan(null)
    try {
      const nama = akanDihapus.namaPeriode
      await hapusPeriode(akanDihapus.id)
      setAkanDihapus(null)
      setPesan(`Periode ${nama} berhasil dihapus.`)
      await muat()
    } catch (e) { setGalat(apiMessage(e, "Gagal menghapus periode.")) }
    finally { setSedangMenghapus(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Hanya satu periode boleh terbuka pada satu waktu. Kunci periode yang
            sedang terbuka sebelum membuka periode lain.
          </p>
        </div>
        <Button onClick={() => setForm(null)}>
          <Plus className="w-3.5 h-3.5" /> Tambah periode
        </Button>
      </div>

      {galat && (
        <div className="p-4 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</div>
      )}
      {pesan && <div className="p-4 text-sm text-emerald-700 border border-emerald-100 bg-emerald-50 rounded-xl">{pesan}</div>}

      <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr><Th>Periode</Th><Th>Mulai</Th><Th>Selesai</Th><Th>Status</Th><Th kanan>Capaian PD</Th><Th kanan>Tindakan</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memuat && <tr><td colSpan={6} className="px-6 py-8 text-sm text-center text-slate-400">Memuat…</td></tr>}
            {!memuat && daftar.map((p) => {
              const s = syarat[p.id]
              const halangan = s && !s.boleh
                ? s.adaPeriodeLainTerbuka
                  ? `${s.adaPeriodeLainTerbuka} masih terbuka`
                  : s.bidangBelumSiap.length > 0
                    ? `${s.bidangBelumSiap.length} bidang belum siap: ${s.bidangBelumSiap.join(", ")}`
                    : "Belum ada pembagian rencana"
                : null
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm font-medium text-slate-800">{p.namaPeriode}</td>
                  <td className="px-6 py-3 text-sm tabular text-slate-500">{tgl(p.tanggalMulai)}</td>
                  <td className="px-6 py-3 text-sm tabular text-slate-500">{tgl(p.tanggalSelesai)}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${NADA[p.status]}`}>
                      {LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold tabular">
                    {p.status === "DRAFT" ? "—" : capaian[p.id] === undefined ? "Tidak tersedia" : `${capaian[p.id].toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
                  </td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    {p.status === "DRAFT" && (
                      <Button
                        size="sm" variant="outline"
                        disabled={!!halangan}
                        title={halangan ?? undefined}
                        onClick={() => setKonfirmasi({ p, ke: "OPEN" })}
                      >
                        <LockOpen className="w-3.5 h-3.5" /> Buka
                      </Button>
                    )}
                    {p.status === "OPEN" && (
                      <Button size="sm" variant="outline" onClick={() => setKonfirmasi({ p, ke: "LOCKED" })}>
                        <Lock className="w-3.5 h-3.5" /> Kunci
                      </Button>
                    )}
                    {p.status !== "DRAFT" && (
                      <Button size="sm" variant="outline" className="ml-1" onClick={() => setHitungUlang(p)}>
                        <Calculator className="w-3.5 h-3.5" /> Hitung ulang
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost" className="ml-1"
                      disabled={p.status === "LOCKED"}
                      title={p.status === "LOCKED" ? "Periode terkunci tidak bisa diubah" : undefined}
                      onClick={() => setForm(p)}
                    >
                      Ubah
                    </Button>
                    {p.status === "DRAFT" && p.jumlahRencana === 0 && (
                      <Button size="sm" variant="ghost" className="ml-1 text-red-600 hover:text-red-700" onClick={() => setAkanDihapus(p)}>
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </Button>
                    )}
                    {halangan && <p className="mt-1 text-xs text-amber-600">{halangan}</p>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      {form !== undefined && (
        <FormPeriode
          awal={form}
          onTutup={() => setForm(undefined)}
          onTersimpan={() => void muat()}
        />
      )}

      <AlertDialog open={konfirmasi !== null} onOpenChange={(o) => !o && setKonfirmasi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {konfirmasi?.ke === "OPEN" ? "Buka" : "Kunci"} {konfirmasi?.p.namaPeriode}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {konfirmasi?.ke === "OPEN"
                ? "Bidang bisa mulai mencatat realisasi. Rencana masih bisa disesuaikan selama periode terbuka."
                : "Setelah terkunci, pencatatan realisasi berhenti dan capaian periode ini diarsipkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => konfirmasi && void ubah(konfirmasi.p, konfirmasi.ke)}>
              {konfirmasi?.ke === "OPEN" ? "Buka periode" : "Kunci periode"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={hitungUlang !== null} onOpenChange={(o) => !o && !sedangMenghitung && setHitungUlang(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hitung ulang capaian?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh realisasi, bobot aktivitas, capaian subkegiatan, dan capaian bidang pada {hitungUlang?.namaPeriode} akan dihitung ulang dari transaksi tersimpan. Gunakan tindakan ini sebagai pemulihan jika angka diduga tidak sinkron.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sedangMenghitung}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={sedangMenghitung} onClick={(event) => { event.preventDefault(); void jalankanHitungUlang() }}>
              {sedangMenghitung ? "Menghitung…" : "Hitung ulang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={akanDihapus !== null} onOpenChange={(o) => !o && !sedangMenghapus && setAkanDihapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus periode kosong?</AlertDialogTitle>
            <AlertDialogDescription>
              Periode {akanDihapus?.namaPeriode} akan dihapus permanen. Aksi ini hanya berhasil untuk periode Draf yang belum memiliki pembagian rencana maupun capaian.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sedangMenghapus}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={sedangMenghapus} onClick={(event) => { event.preventDefault(); void jalankanHapus() }}>
              {sedangMenghapus ? "Menghapus…" : "Hapus periode"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FormPeriode({
  awal, onTutup, onTersimpan,
}: { awal: Periode | null; onTutup: () => void; onTersimpan: () => void }) {
  const [nama, setNama] = React.useState(awal?.namaPeriode ?? "")
  const [mulai, setMulai] = React.useState(awal?.tanggalMulai ?? "")
  const [selesai, setSelesai] = React.useState(awal?.tanggalSelesai ?? "")
  const [dokumens, setDokumens] = React.useState<Dokumen[]>([])
  const [dokumenId, setDokumenId] = React.useState<number | null>(awal?.dokumenId ?? null)
  const [memuatDokumen, setMemuatDokumen] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [menyimpan, setMenyimpan] = React.useState(false)

  React.useEffect(() => {
    let aktif = true
    void getDokumen({ termasukNonaktif: true })
      .then((daftar) => {
        if (!aktif) return
        setDokumens(daftar)
        setDokumenId((id) => id ?? daftar.find((dokumen) => dokumen.status === "AKTIF")?.id ?? daftar[0]?.id ?? null)
      })
      .catch((e) => {
        if (aktif) setGalat(apiMessage(e, "Gagal memuat dokumen perencanaan."))
      })
      .finally(() => {
        if (aktif) setMemuatDokumen(false)
      })
    return () => { aktif = false }
  }, [])

  async function simpan() {
    setMenyimpan(true); setGalat(null)
    try {
      await simpanPeriode({ id: awal?.id, dokumenId, namaPeriode: nama, tanggalMulai: mulai, tanggalSelesai: selesai })
      onTersimpan(); onTutup()
    } catch (e) { setGalat(apiMessage(e, "Gagal menyimpan periode.")) }
    finally { setMenyimpan(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onTutup()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {awal ? "Ubah periode" : "Periode baru"}
          </DialogTitle>
          <DialogDescription>
            {awal
              ? "Sesuaikan dokumen, nama, dan rentang tanggal periode."
              : "Pilih dokumen perencanaan, lalu tentukan nama dan rentang tanggal periode."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Dokumen perencanaan</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              value={dokumenId ?? ""}
              onChange={(e) => setDokumenId(e.target.value ? Number(e.target.value) : null)}
              disabled={memuatDokumen}
            >
              <option value="">{memuatDokumen ? "Memuat dokumen…" : "Pilih dokumen"}</option>
              {dokumens.map((dokumen) => (
                <option key={dokumen.id} value={dokumen.id}>
                  {dokumen.nama}{dokumen.status === "ARSIP" ? " (Arsip)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Nama periode</span>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Triwulan I 2027" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Mulai</span>
              <Input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} />
            </label>
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Selesai</span>
              <Input type="date" value={selesai} onChange={(e) => setSelesai(e.target.value)} />
            </label>
          </div>
          {galat && <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onTutup}>Batal</Button>
          <Button onClick={() => void simpan()} disabled={menyimpan || memuatDokumen || dokumenId == null || !nama || !mulai || !selesai}>
            {menyimpan ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
