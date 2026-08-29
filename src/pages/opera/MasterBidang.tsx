import * as React from "react"
import { Plus } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getBidang, setAktifBidang, simpanBidang } from "@/services"
import type { Bidang } from "@/services"
import { Panel, Th } from "./bagian/ui"

export default function MasterBidang() {
  const [bidangs, setBidangs] = React.useState<Bidang[]>([])
  const [galat, setGalat] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<Bidang | null | undefined>(undefined)
  const [konfirmasi, setKonfirmasi] = React.useState<Bidang | null>(null)

  const muat = React.useCallback(async () => {
    const b = await getBidang({ termasukNonaktif: true })
    setBidangs(b)
  }, [])
  React.useEffect(() => { void muat() }, [muat])

  async function ubahAktif(b: Bidang) {
    setGalat(null)
    try { await setAktifBidang(b.id, !b.flagActive); await muat() }
    catch (e) { setGalat(e instanceof Error ? e.message : "Gagal mengubah status.") }
    finally { setKonfirmasi(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Bidang</h1>
          <p className="mt-1 text-sm text-slate-500">
            Daftar bidang penanggung jawab. Bidang yang sudah dipakai dalam rencana atau
            capaian sebuah periode tidak bisa dihapus — nonaktifkan saja.
          </p>
        </div>
        <Button onClick={() => setForm(null)}><Plus className="w-3.5 h-3.5" /> Tambah bidang</Button>
      </div>

      {galat && <div className="p-4 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</div>}

      <Panel judul="Bidang">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr><Th>Kode</Th><Th>Nama bidang</Th><Th>Status</Th><Th kanan>Tindakan</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bidangs.map((b) => (
              <tr key={b.id} className={b.flagActive ? "hover:bg-slate-50" : "opacity-55"}>
                <td className="px-6 py-3 font-mono text-xs text-slate-400">{b.kode}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{b.namaBidang}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-semibold uppercase ${b.flagActive ? "text-emerald-700" : "text-slate-400"}`}>
                    {b.flagActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setForm(b)}>Ubah</Button>
                  <Button size="sm" variant="ghost" onClick={() => setKonfirmasi(b)}>
                    {b.flagActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </td>
              </tr>
            ))}
            {bidangs.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-sm text-center text-slate-500">Belum ada bidang.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>

      {form !== undefined && (
        <FormBidang awal={form} onTutup={() => setForm(undefined)} onTersimpan={() => void muat()} />
      )}

      <AlertDialog open={konfirmasi !== null} onOpenChange={(o) => !o && setKonfirmasi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {konfirmasi?.flagActive ? "Nonaktifkan" : "Aktifkan"} {konfirmasi?.namaBidang}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {konfirmasi?.flagActive
                ? "Bidang tidak dihapus — capaian periode lama yang memakainya tetap utuh. Ditolak kalau bidang ini masih memegang subkegiatan di periode yang belum terkunci atau masih punya pengguna."
                : "Bidang ini akan muncul lagi dan bisa diberi subkegiatan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => konfirmasi && void ubahAktif(konfirmasi)}>
              {konfirmasi?.flagActive ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FormBidang({
  awal, onTutup, onTersimpan,
}: { awal: Bidang | null; onTutup: () => void; onTersimpan: () => void }) {
  const [kode, setKode] = React.useState(awal?.kode ?? "")
  const [nama, setNama] = React.useState(awal?.namaBidang ?? "")
  const [galat, setGalat] = React.useState<string | null>(null)

  async function simpan() {
    setGalat(null)
    try { await simpanBidang({ id: awal?.id, kode, namaBidang: nama }); onTersimpan(); onTutup() }
    catch (e) { setGalat(e instanceof Error ? e.message : "Gagal menyimpan.") }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onTutup()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-base">
          {awal ? "Ubah bidang" : "Bidang baru"}
        </DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Kode</span>
            <Input value={kode} onChange={(e) => setKode(e.target.value)} className="font-mono" placeholder="P2EPD" />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Nama bidang</span>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} />
          </label>
          {galat && <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onTutup}>Batal</Button>
          <Button onClick={() => void simpan()} disabled={!kode || !nama}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
