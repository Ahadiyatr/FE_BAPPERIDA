import * as React from "react"
import { FileText, Plus } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getDokumenBerpohon, getRpjmd, setAktifDokumen, simpanDokumen } from "@/services"
import type {
  Dokumen, DokumenDenganIsi, JenisDokumen, StatusDokumen,
} from "@/services"
import { Panel, Th } from "./bagian/ui"

const NADA: Record<StatusDokumen, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  AKTIF: "bg-emerald-50 text-emerald-700",
  ARSIP: "bg-amber-50 text-amber-700",
}
const LABEL: Record<StatusDokumen, string> = { DRAFT: "Draf", AKTIF: "Aktif", ARSIP: "Arsip" }

function BarisDokumen({
  d, anak, onUbah, onAktif,
}: {
  d: DokumenDenganIsi
  anak: boolean
  onUbah: (d: Dokumen) => void
  onAktif: (d: Dokumen) => void
}) {
  return (
    <tr className={d.flagActive ? "hover:bg-slate-50" : "opacity-55"}>
      <td className={`px-6 py-3 font-mono text-xs text-slate-400 ${anak ? "pl-12" : ""}`}>
        {anak && <span className="mr-1.5 text-slate-300">└</span>}
        {d.kode}
      </td>
      <td className="px-6 py-3">
        <span className="text-sm font-medium text-slate-800">{d.nama}</span>
        <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
          d.jenis === "RPJMD" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
        }`}>
          {d.jenis}
        </span>
      </td>
      <td className="px-6 py-3 text-sm tabular text-slate-500">
        {d.tahunMulai === d.tahunSelesai ? d.tahunMulai : `${d.tahunMulai}–${d.tahunSelesai}`}
      </td>
      <td className="px-6 py-3 text-sm text-slate-500">
        {d.jenis === "RPJMD"
          ? `${d.jumlahProgram} program`
          : `${d.jumlahPeriode} periode`}
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
  const [pohon, setPohon] = React.useState<DokumenDenganIsi[]>([])
  const [rpjmd, setRpjmd] = React.useState<Dokumen[]>([])
  const [memuat, setMemuat] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [laci, setLaci] = React.useState<Dokumen | null | undefined>(undefined)
  const [konfirmasi, setKonfirmasi] = React.useState<Dokumen | null>(null)

  const muat = React.useCallback(async () => {
    setMemuat(true)
    try {
      const [p, r] = await Promise.all([
        getDokumenBerpohon({ termasukNonaktif: true }),
        getRpjmd(),
      ])
      setPohon(p)
      setRpjmd(r)
    } finally {
      setMemuat(false)
    }
  }, [])
  React.useEffect(() => { void muat() }, [muat])

  async function ubahAktif(d: Dokumen) {
    setGalat(null)
    try { await setAktifDokumen(d.id, !d.flagActive); await muat() }
    catch (e) { setGalat(e instanceof Error ? e.message : "Gagal mengubah status.") }
    finally { setKonfirmasi(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Dokumen Perencanaan</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-500">
            RPJMD berlaku lima tahun dan menaungi RKPD tahunan. Program hidup di RPJMD;
            periode triwulanan menunjuk RKPD tahun berjalan.
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
          Kode <span className="font-mono text-xs">5.1.2</span> boleh dipakai lagi di RPJMD
          berikutnya tanpa bentrok dengan yang lama.
        </p>
      </div>

      <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Kode</Th><Th>Nama</Th><Th>Tahun</Th><Th>Isi</Th><Th>Status</Th>
              <Th kanan>Tindakan</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memuat && (
              <tr><td colSpan={6} className="px-6 py-8 text-sm text-center text-slate-400">Memuat…</td></tr>
            )}
            {!memuat && pohon.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-sm text-center text-slate-500">
                Belum ada dokumen perencanaan. Tambahkan satu RPJMD sebagai induk.
              </td></tr>
            )}
            {!memuat && pohon.map((d) => (
              <React.Fragment key={d.id}>
                <BarisDokumen d={d} anak={false} onUbah={setLaci} onAktif={setKonfirmasi} />
                {d.anak.map((a) => (
                  <BarisDokumen key={a.id} d={a} anak onUbah={setLaci} onAktif={setKonfirmasi} />
                ))}
                {d.anak.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-2 pl-12 text-xs text-slate-400">
                      └ belum punya RKPD
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Panel>

      {laci !== undefined && (
        <LaciDokumen
          awal={laci} rpjmd={rpjmd}
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
                ? "Dokumen tidak dihapus — program dan periode yang menunjuknya tetap utuh. Ditolak kalau dokumen ini masih menaungi program, periode, atau RKPD aktif."
                : "Dokumen ini akan muncul lagi sebagai pilihan saat menambah program atau periode."}
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
  awal, rpjmd, onTutup, onTersimpan,
}: {
  awal: Dokumen | null
  rpjmd: Dokumen[]
  onTutup: () => void
  onTersimpan: () => void
}) {
  const [kode, setKode] = React.useState(awal?.kode ?? "")
  const [nama, setNama] = React.useState(awal?.nama ?? "")
  const [jenis, setJenis] = React.useState<JenisDokumen>(awal?.jenis ?? "RKPD")
  const [indukId, setIndukId] = React.useState<number | null>(awal?.indukId ?? rpjmd[0]?.id ?? null)
  const [mulai, setMulai] = React.useState(String(awal?.tahunMulai ?? new Date().getFullYear()))
  const [selesai, setSelesai] = React.useState(String(awal?.tahunSelesai ?? new Date().getFullYear()))
  const [status, setStatus] = React.useState<StatusDokumen>(awal?.status ?? "DRAFT")
  const [galat, setGalat] = React.useState<string | null>(null)

  // RKPD berlaku satu tahun — tahun selesai mengikuti tahun mulai.
  React.useEffect(() => { if (jenis === "RKPD") setSelesai(mulai) }, [jenis, mulai])

  const gaya = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"

  async function simpan() {
    setGalat(null)
    try {
      await simpanDokumen({
        id: awal?.id, kode, nama, jenis,
        indukId: jenis === "RKPD" ? indukId : null,
        tahunMulai: Number(mulai), tahunSelesai: Number(selesai), status,
      })
      onTersimpan(); onTutup()
    } catch (e) { setGalat(e instanceof Error ? e.message : "Gagal menyimpan.") }
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onTutup()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{awal ? "Ubah dokumen" : "Dokumen baru"}</SheetTitle>
          <SheetDescription>
            RPJMD berdiri sendiri. RKPD wajib memilih RPJMD induk dan berlaku satu tahun
            di dalam rentangnya.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-3">
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Jenis</span>
            <select className={gaya} value={jenis} onChange={(e) => setJenis(e.target.value as JenisDokumen)}>
              <option value="RPJMD">RPJMD — lima tahun, menaungi RKPD</option>
              <option value="RKPD">RKPD — satu tahun</option>
            </select>
          </label>

          {jenis === "RKPD" && (
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">RPJMD induk</span>
              <select
                className={gaya}
                value={indukId ?? ""}
                onChange={(e) => setIndukId(Number(e.target.value))}
              >
                {rpjmd.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama} ({d.tahunMulai}–{d.tahunSelesai})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Kode</span>
            <Input className="font-mono" value={kode} onChange={(e) => setKode(e.target.value)}
              placeholder={jenis === "RPJMD" ? "RPJMD-2025-2029" : "RKPD-2026"} />
          </label>

          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Nama</span>
            <Input value={nama} onChange={(e) => setNama(e.target.value)}
              placeholder={jenis === "RPJMD" ? "RPJMD 2025–2029" : "RKPD 2026"} />
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
                disabled={jenis === "RKPD"}
                title={jenis === "RKPD" ? "RKPD berlaku satu tahun" : undefined}
                onChange={(e) => setSelesai(e.target.value)} />
            </label>
          </div>

          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Status</span>
            <select className={gaya} value={status} onChange={(e) => setStatus(e.target.value as StatusDokumen)}>
              <option value="DRAFT">Draf</option>
              <option value="AKTIF">Aktif</option>
              <option value="ARSIP">Arsip</option>
            </select>
          </label>

          {galat && <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</p>}
        </div>

        <SheetFooter>
          <Button onClick={() => void simpan()} disabled={!kode || !nama}>Simpan</Button>
          <Button variant="ghost" onClick={onTutup}>Batal</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
