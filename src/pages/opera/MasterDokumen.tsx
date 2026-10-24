import * as React from "react"
import { FileText, Plus } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import KontrolHalaman from "@/components/Pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getDokumenDenganIsi, setAktifDokumen, simpanDokumen } from "@/services"
import type { Dokumen, DokumenDenganIsi, StatusDokumen } from "@/services"
import { Panel, Th } from "./bagian/ui"
import { apiMessage } from "@/services/api"
import { usePaginasi } from "@/lib/paginasi"

const NADA: Record<StatusDokumen, string> = {
  AKTIF: "bg-emerald-50 text-emerald-700",
  ARSIP: "bg-amber-50 text-amber-700",
}
const LABEL: Record<StatusDokumen, string> = { AKTIF: "Aktif", ARSIP: "Arsip" }

function BarisDokumen({
  d, onUbah, onAktif,
}: {
  d: DokumenDenganIsi
  onUbah: (d: Dokumen) => void
  onAktif: (d: Dokumen) => void
}) {
  return (
    <tr className={d.flagActive ? "hover:bg-slate-50" : "opacity-55"}>
      <td className="px-6 py-3 text-sm">
        <div className="font-medium text-slate-800">{d.nama}</div>
        {d.keterangan && (
          <p className="mt-0.5 max-w-md text-xs text-slate-500 line-clamp-2" title={d.keterangan}>
            {d.keterangan}
          </p>
        )}
      </td>
      <td className="px-6 py-3 text-sm tabular text-slate-500">
        {d.tahunMulai === d.tahunSelesai ? d.tahunMulai : `${d.tahunMulai}–${d.tahunSelesai}`}
      </td>
      <td className="px-6 py-3 text-sm text-slate-500">
        {d.jumlahProgram} program · {d.jumlahPeriode} periode
      </td>
      <td className="px-6 py-3">
        <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${NADA[d.status]}`}>
          {LABEL[d.status]}
        </span>
      </td>
      <td className="px-6 py-3 text-right whitespace-nowrap">
        <Button size="sm" variant="ghost" onClick={() => onUbah(d)}>Ubah</Button>
        <Button size="sm" variant="ghost" onClick={() => onAktif(d)}>
          {d.flagActive ? "Nonaktifkan" : "Aktifkan"}
        </Button>
      </td>
    </tr>
  )
}

export default function MasterDokumen() {
  const [daftar, setDaftar] = React.useState<DokumenDenganIsi[]>([])
  const [memuat, setMemuat] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [laci, setLaci] = React.useState<Dokumen | null | undefined>(undefined)
  const [konfirmasi, setKonfirmasi] = React.useState<Dokumen | null>(null)

  const muat = React.useCallback(async () => {
    setMemuat(true)
    try {
      setDaftar(await getDokumenDenganIsi({ termasukNonaktif: true }))
    } finally {
      setMemuat(false)
    }
  }, [])
  React.useEffect(() => { void muat() }, [muat])
  const paginasi = usePaginasi(daftar)

  async function ubahAktif(d: Dokumen) {
    setGalat(null)
    try { await setAktifDokumen(d.id, !d.flagActive); await muat() }
    catch (e) { setGalat(apiMessage(e, "Gagal mengubah status.")) }
    finally { setKonfirmasi(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="max-w-prose text-sm text-slate-500">
            Dokumen perencanaan menaungi program, dan setiap periode merujuk satu dokumen.
          </p>
        </div>
        <Button onClick={() => setLaci(null)}>
          <Plus className="w-3.5 h-3.5" /> Tambah dokumen
        </Button>
      </div>

      {galat && (
        <div className="p-4 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</div>
      )}

      <div className="flex gap-2.5 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-slate-600">
          <b className="text-slate-800">Kode program unik per dokumen, bukan global.</b>{" "}
          Kode <span className="font-mono text-xs">5.1.2</span> boleh dipakai lagi di dokumen
          berikutnya tanpa bentrok dengan yang lama.
        </p>
      </div>

      <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Nama</Th><Th>Tahun</Th><Th>Isi</Th><Th>Status</Th>
              <Th kanan>Tindakan</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memuat && (
              <tr><td colSpan={5} className="px-6 py-8 text-sm text-center text-slate-400">Memuat…</td></tr>
            )}
            {!memuat && daftar.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-sm text-center text-slate-500">
                Belum ada dokumen perencanaan.
              </td></tr>
            )}
            {!memuat && paginasi.potongan.map((d) => (
              <BarisDokumen key={d.id} d={d} onUbah={setLaci} onAktif={setKonfirmasi} />
            ))}
          </tbody>
        </table>
        {!memuat && <KontrolHalaman {...paginasi} />}
      </Panel>

      {laci !== undefined && (
        <LaciDokumen
          awal={laci}
          onTutup={() => setLaci(undefined)} onTersimpan={() => void muat()}
        />
      )}

      <AlertDialog open={konfirmasi !== null} onOpenChange={(o) => !o && setKonfirmasi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {konfirmasi?.flagActive ? "Nonaktifkan" : "Aktifkan"} {konfirmasi?.nama}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {konfirmasi?.flagActive
                ? "Dokumen tidak dihapus — program dan periode yang menunjuknya tetap utuh. Dokumen arsip tidak ditawarkan lagi saat menambah program."
                : "Dokumen ini akan muncul lagi sebagai pilihan saat menambah program."}
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

function LaciDokumen({
  awal, onTutup, onTersimpan,
}: {
  awal: Dokumen | null
  onTutup: () => void
  onTersimpan: () => void
}) {
  const [nama, setNama] = React.useState(awal?.nama ?? "")
  const [mulai, setMulai] = React.useState(String(awal?.tahunMulai ?? new Date().getFullYear()))
  const [selesai, setSelesai] = React.useState(String(awal?.tahunSelesai ?? new Date().getFullYear()))
  const [status, setStatus] = React.useState<StatusDokumen>(awal?.status ?? "AKTIF")
  const [keterangan, setKeterangan] = React.useState(awal?.keterangan ?? "")
  const [galat, setGalat] = React.useState<string | null>(null)

  const gaya = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"

  async function simpan() {
    setGalat(null)
    try {
      await simpanDokumen({
        id: awal?.id, nama, tahunMulai: Number(mulai), tahunSelesai: Number(selesai), status, keterangan,
      })
      onTersimpan(); onTutup()
    } catch (e) { setGalat(apiMessage(e, "Gagal menyimpan.")) }
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onTutup()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{awal ? "Ubah dokumen" : "Dokumen baru"}</SheetTitle>
          <SheetDescription>
            Isi nama dan rentang tahun berlakunya dokumen perencanaan.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-3">
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Nama</span>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Renstra BAPPERIDA 2026–2030" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Tahun mulai</span>
              <Input type="number" className="tabular font-mono" value={mulai}
                onChange={(e) => setMulai(e.target.value)} />
            </label>
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Tahun selesai</span>
              <Input type="number" className="tabular font-mono" value={selesai}
                onChange={(e) => setSelesai(e.target.value)} />
            </label>
          </div>

          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Status</span>
            <select className={gaya} value={status} onChange={(e) => setStatus(e.target.value as StatusDokumen)}>
              <option value="AKTIF">Aktif</option>
              <option value="ARSIP">Arsip</option>
            </select>
          </label>

          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
              Keterangan <span className="font-normal normal-case tracking-normal text-slate-400">(opsional)</span>
            </span>
            <textarea className={`${gaya} min-h-24 resize-y`} rows={3} maxLength={1000}
              value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Mis. dasar hukum (Perkada No. …) atau catatan revisi" />
          </label>

          {galat && <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</p>}
        </div>

        <SheetFooter>
          <Button onClick={() => void simpan()} disabled={!nama.trim()}>Simpan</Button>
          <Button variant="ghost" onClick={onTutup}>Batal</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
