import * as React from "react"
import { Lock, LockOpen, Plus } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cekSyaratBuka, getPeriode, simpanPeriode, ubahStatusPeriode } from "@/services"
import { apiMessage } from "@/services/api"
import type { Periode, StatusPeriode, SyaratBukaPeriode } from "@/services"
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
  const [form, setForm] = React.useState<Periode | null | undefined>(undefined)
  const [konfirmasi, setKonfirmasi] = React.useState<{ p: Periode; ke: StatusPeriode } | null>(null)

  const muat = React.useCallback(async () => {
    setMemuat(true)
    try {
      const p = await getPeriode()
      setDaftar(p)
      const s = await Promise.all(p.map((x) => cekSyaratBuka(x.id)))
      setSyarat(Object.fromEntries(p.map((x, i) => [x.id, s[i]])))
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

      <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr><Th>Periode</Th><Th>Mulai</Th><Th>Selesai</Th><Th>Status</Th><Th kanan>Tindakan</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memuat && <tr><td colSpan={5} className="px-6 py-8 text-sm text-center text-slate-400">Memuat…</td></tr>}
            {!memuat && daftar.map((p) => {
              const s = syarat[p.id]
              const halangan = s && !s.boleh
                ? s.adaPeriodeLainTerbuka
                  ? `${s.adaPeriodeLainTerbuka} masih terbuka`
                  : `${s.bidangBelumSiap.length} bidang belum siap`
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
                    <Button
                      size="sm" variant="ghost" className="ml-1"
                      disabled={p.status === "LOCKED"}
                      title={p.status === "LOCKED" ? "Periode terkunci tidak bisa diubah" : undefined}
                      onClick={() => setForm(p)}
                    >
                      Ubah
                    </Button>
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
    </div>
  )
}

function FormPeriode({
  awal, onTutup, onTersimpan,
}: { awal: Periode | null; onTutup: () => void; onTersimpan: () => void }) {
  const [nama, setNama] = React.useState(awal?.namaPeriode ?? "")
  const [mulai, setMulai] = React.useState(awal?.tanggalMulai ?? "")
  const [selesai, setSelesai] = React.useState(awal?.tanggalSelesai ?? "")
  const [galat, setGalat] = React.useState<string | null>(null)
  const [menyimpan, setMenyimpan] = React.useState(false)

  async function simpan() {
    setMenyimpan(true); setGalat(null)
    try {
      await simpanPeriode({ id: awal?.id, dokumenId: awal?.dokumenId ?? null, namaPeriode: nama, tanggalMulai: mulai, tanggalSelesai: selesai })
      onTersimpan(); onTutup()
    } catch (e) { setGalat(e instanceof Error ? e.message : "Gagal menyimpan.") }
    finally { setMenyimpan(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onTutup()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-base">
          {awal ? "Ubah periode" : "Periode baru"}
        </DialogTitle></DialogHeader>
        <div className="space-y-3">
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
          <Button onClick={() => void simpan()} disabled={menyimpan || !nama || !mulai || !selesai}>
            {menyimpan ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
