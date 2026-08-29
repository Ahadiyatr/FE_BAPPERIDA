import * as React from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronRight, Plus, Upload, X } from "lucide-react"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ChainNav, Kode } from "@/components/opera/primitives"
import type { MataRantai } from "@/components/opera/primitives"
import { LaciMaster } from "./master/LaciMaster"
import {
  TINGKAT, URUT_TINGKAT, adalahAktifitas, adalahSubkegiatan, kodeDari, namaDari,
} from "./master/tingkat"
import type { BarisMaster, IdTingkat } from "./master/tingkat"
import { getProgram, getKegiatan, getSubkegiatan, getJumlahAktifitas, previewImportExcel, unduhTemplateImportExcel } from "@/services"
import type { PreviewExcel } from "@/services"

const persen = (n: number) =>
  `${n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

function adalahTingkat(v: string | undefined): v is IdTingkat {
  return !!v && (URUT_TINGKAT as string[]).includes(v)
}

export default function DataMaster() {
  const { tingkat: paramTingkat } = useParams()
  const [sp, setSp] = useSearchParams()
  const navigate = useNavigate()

  const tingkat: IdTingkat = adalahTingkat(paramTingkat) ? paramTingkat : "program"
  const def = TINGKAT[tingkat]
  const indukId = sp.get("induk") ? Number(sp.get("induk")) : null

  const [baris, setBaris] = React.useState<BarisMaster[] | null>(null)
  const [jumlah, setJumlah] = React.useState<Record<IdTingkat, number>>({
    program: 0, kegiatan: 0, subkegiatan: 0, aktifitas: 0,
  })
  const [cari, setCari] = React.useState("")
  const [tampilNonaktif, setTampilNonaktif] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)

  const [laciUntuk, setLaciUntuk] = React.useState<BarisMaster | null | undefined>(undefined)
  const [konfirmasi, setKonfirmasi] = React.useState<BarisMaster | null>(null)
  const [imporTerbuka, setImporTerbuka] = React.useState(false)
  const [fileImport, setFileImport] = React.useState<File | null>(null)
  const [previewImport, setPreviewImport] = React.useState<PreviewExcel | null>(null)
  const [memprosesImport, setMemprosesImport] = React.useState(false)
  const [nama_induk, setNamaInduk] = React.useState<string | null>(null)

  const muat = React.useCallback(async () => {
    setGalat(null)
    try {
      const rows = await def.ambil(indukId, { termasukNonaktif: true })
      setBaris(rows)
    } catch (err) {
      setBaris([])
      setGalat(err instanceof Error ? err.message : "Gagal memuat data.")
    }
  }, [def, indukId])

  React.useEffect(() => { setBaris(null); void muat() }, [muat])

  // Angka di ChainNav — katalog penuh, tidak ikut tersaring scope.
  React.useEffect(() => {
    let batal = false
    Promise.all([
      getProgram({ termasukNonaktif: true }),
      getKegiatan({ termasukNonaktif: true }),
      getSubkegiatan({ termasukNonaktif: true }),
      getJumlahAktifitas(),
    ]).then(([p, k, s, jmlAktifitas]) => {
      if (!batal)
        setJumlah({ program: p.length, kegiatan: k.length, subkegiatan: s.length, aktifitas: jmlAktifitas })
    }).catch(() => { /* angka rantai bukan alasan menjatuhkan layar */ })
    return () => { batal = true }
  }, [])

  // Nama induk untuk pita scope.
  React.useEffect(() => {
    let batal = false
    if (indukId == null || !def.induk) { setNamaInduk(null); return }
    TINGKAT[def.induk].ambil(null, { termasukNonaktif: true })
      .then((rows) => {
        const p = rows.find((r) => r.id === indukId)
        if (!batal) setNamaInduk(p ? `${kodeDari(p)} · ${namaDari(p)}` : null)
      })
      .catch(() => { if (!batal) setNamaInduk(null) })
    return () => { batal = true }
  }, [indukId, def.induk])

  const jumlahPendukungAktif = React.useMemo(
    () => (baris ?? []).filter((r) => adalahAktifitas(r) && r.flagActive && r.tipeAktifitas === "PENDUKUNG").length,
    [baris]
  )

  const terlihat = React.useMemo(() => {
    const q = cari.trim().toLowerCase()
    return (baris ?? [])
      .filter((r) => tampilNonaktif || r.flagActive)
      .filter((r) => !q || namaDari(r).toLowerCase().includes(q) || kodeDari(r).toLowerCase().includes(q))
  }, [baris, cari, tampilNonaktif])

  const mata: MataRantai[] = URUT_TINGKAT.map((t) => ({
    id: t,
    tingkat: TINGKAT[t].tingkat,
    label: TINGKAT[t].label,
    jumlah: t === tingkat ? (baris?.length ?? 0) : jumlah[t],
  }))

  function pindahTingkat(t: string, induk?: number) {
    const q = induk != null ? `?induk=${induk}` : ""
    navigate(`/master/${t}${q}`)
  }

  async function ubahAktif(row: BarisMaster) {
    try {
      await def.setAktif(row.id, !row.flagActive)
      await muat()
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal mengubah status.")
    } finally {
      setKonfirmasi(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Master</h1>
        <p className="mt-1 max-w-prose text-sm text-slate-500">
          Katalog murni — tanpa bidang dan tanpa periode. Mengubah di sini tidak
          menyentuh realisasi periode yang sudah berjalan.
        </p>
      </div>

      <ChainNav mata={mata} aktif={tingkat} onPilih={(t) => pindahTingkat(t)} />

      {def.induk && indukId != null && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-emerald-50/50 px-3 py-2 text-sm">
          <span className="font-medium">{nama_induk ?? "…"}</span>
          <span className="text-muted-foreground">
            · menampilkan {def.label.toLowerCase()} milik {TINGKAT[def.induk].label.toLowerCase()} ini
          </span>
          <Button variant="ghost" size="xs" className="ml-auto" onClick={() => setSp({})}>
            Tampilkan semua <X className="size-3" />
          </Button>
        </div>
      )}

      {def.induk && indukId == null && tingkat === "aktifitas" && (
        <div className="rounded-xl border bg-amber-50/60 px-3 py-2 text-sm text-foreground">
          Bobot 30%÷n hanya bermakna dalam satu subkegiatan. Pilih satu subkegiatan
          dulu lewat kolom <b>Aktifitas</b> di tingkat sebelumnya.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={cari}
          onChange={(ev) => setCari(ev.target.value)}
          placeholder="Cari nama atau kode…"
          className="h-8 w-full sm:w-64"
        />
        <Button
          variant={tampilNonaktif ? "secondary" : "outline"}
          size="sm"
          onClick={() => setTampilNonaktif((v) => !v)}
        >
          {tampilNonaktif ? "Aktif dan nonaktif" : "Hanya yang aktif"}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImporTerbuka(true)}>
            <Upload className="size-3.5" /> Impor dari Excel
          </Button>
          <Button
            size="sm"
            onClick={() => setLaciUntuk(null)}
            disabled={def.induk != null && indukId == null}
            title={def.induk != null && indukId == null ? `Pilih ${TINGKAT[def.induk].label.toLowerCase()} dulu` : undefined}
          >
            <Plus className="size-3.5" /> Tambah
          </Button>
        </div>
      </div>

      {galat && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{galat}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono text-[11px] tracking-[0.12em] uppercase">Kode</TableHead>
              <TableHead className="font-mono text-[11px] tracking-[0.12em] uppercase">{def.label}</TableHead>
              {tingkat === "subkegiatan" && (
                <TableHead className="font-mono text-[11px] tracking-[0.12em] uppercase">Indikator kinerja</TableHead>
              )}
              {tingkat === "aktifitas" && (
                <>
                  <TableHead className="font-mono text-[11px] tracking-[0.12em] uppercase">Tipe</TableHead>
                  <TableHead className="text-right font-mono text-[11px] tracking-[0.12em] uppercase">Bobot target</TableHead>
                </>
              )}
              {def.anak && (
                <TableHead className="text-right font-mono text-[11px] tracking-[0.12em] uppercase">
                  {TINGKAT[def.anak].label}
                </TableHead>
              )}
              <TableHead className="font-mono text-[11px] tracking-[0.12em] uppercase">Status</TableHead>
              <TableHead className="text-right font-mono text-[11px] tracking-[0.12em] uppercase">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {baris === null &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))}

            {baris !== null && terlihat.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada baris yang cocok.
                </TableCell>
              </TableRow>
            )}

            {terlihat.map((r) => (
              <TableRow key={r.id} className={r.flagActive ? undefined : "opacity-55"}>
                <TableCell><Kode>{kodeDari(r)}</Kode></TableCell>
                <TableCell className="max-w-md">
                  <span className="line-clamp-2">{namaDari(r)}</span>
                </TableCell>

                {tingkat === "subkegiatan" && (
                  <TableCell className="max-w-xs text-muted-foreground">
                    <span className="line-clamp-2">
                      {adalahSubkegiatan(r) ? r.indikatorKinerja : ""}
                    </span>
                  </TableCell>
                )}

                {tingkat === "aktifitas" && adalahAktifitas(r) && (
                  <>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={r.tipeAktifitas === "UTAMA"
                          ? "border-emerald-600/40 bg-emerald-50 text-emerald-600"
                          : "border-slate-300/30 bg-slate-100 text-slate-600"}
                      >
                        {r.tipeAktifitas === "UTAMA" ? "Utama" : "Pendukung"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular text-right font-mono">
                      {r.flagActive ? persen(r.bobotTarget) : "—"}
                    </TableCell>
                  </>
                )}

                {def.anak && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => pindahTingkat(def.anak!, r.id)}
                    >
                      Telusuri <ChevronRight className="size-3" />
                    </Button>
                  </TableCell>
                )}

                <TableCell>
                  {r.flagActive ? (
                    <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-slate-600">Aktif</span>
                  ) : (
                    <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground">Nonaktif</span>
                  )}
                </TableCell>

                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="xs" onClick={() => setLaciUntuk(r)}>Ubah</Button>
                  <Button variant="ghost" size="xs" onClick={() => setKonfirmasi(r)}>
                    {r.flagActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {laciUntuk !== undefined && (
        <LaciMaster
          tingkat={tingkat}
          baris={laciUntuk}
          indukId={indukId}
          jumlahPendukungAktif={jumlahPendukungAktif}
          terbuka
          onTutup={() => setLaciUntuk(undefined)}
          onTersimpan={() => void muat()}
        />
      )}

      <AlertDialog open={konfirmasi !== null} onOpenChange={(o) => !o && setKonfirmasi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">
              {konfirmasi?.flagActive ? "Nonaktifkan" : "Aktifkan kembali"} {def.label.toLowerCase()} ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {konfirmasi?.flagActive ? (
                <>
                  Baris tidak dihapus — hanya disembunyikan dari daftar aktif, supaya
                  capaian periode lama yang memakainya tetap utuh.
                  {konfirmasi && adalahAktifitas(konfirmasi) && konfirmasi.tipeAktifitas === "PENDUKUNG" && (
                    <>
                      {" "}Bobot 30% akan dibagi ulang ke{" "}
                      <b>{jumlahPendukungAktif - 1} aktifitas pendukung</b> yang tersisa.
                    </>
                  )}
                </>
              ) : (
                "Baris ini akan muncul lagi di daftar aktif dan ikut dihitung."
              )}
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

      <Dialog open={imporTerbuka} onOpenChange={setImporTerbuka}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">Impor dari Excel</DialogTitle>
            <DialogDescription>
              Unggah file `.xlsx` untuk diperiksa oleh parser backend sebelum data katalog diimpor.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" size="sm" className="w-fit" onClick={() => void unduhTemplateImportExcel()}>
            <Upload className="size-3.5" /> Download template Excel
          </Button>
          <Input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => { setFileImport(e.target.files?.[0] ?? null); setPreviewImport(null) }} />
          {previewImport && (
            <div className={`rounded-xl border p-3 text-sm ${previewImport.valid ? "bg-emerald-50" : "bg-red-50"}`}>
              <b>{previewImport.valid ? "File valid untuk dipreview" : "File perlu diperbaiki"}</b>
              <p className="mt-1">Sheet: {previewImport.nama_sheet} · {previewImport.jumlah_baris} baris terisi.</p>
              <p className="mt-1 text-muted-foreground">{previewImport.catatan}</p>
              {previewImport.errors.map((error) => <p key={error} className="mt-1 text-red-600">{error}</p>)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImporTerbuka(false)}>Tutup</Button>
            <Button disabled={!fileImport || memprosesImport} onClick={() => {
              if (!fileImport) return
              setMemprosesImport(true)
              previewImportExcel(fileImport).then(setPreviewImport).catch((e) => setGalat(e instanceof Error ? e.message : "Preview import gagal."))
                .finally(() => setMemprosesImport(false))
            }}>
              {memprosesImport ? "Memeriksa…" : "Preview & validasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
