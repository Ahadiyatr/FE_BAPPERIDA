import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight, Copy, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Eyebrow } from "@/components/opera/primitives"
import { getPapanKesiapan, getPeriode, salinRencana, ubahStatusPeriode } from "@/services"
import { apiMessage } from "@/services/api"
import type { KesiapanBidang, Periode } from "@/services"
import { cn } from "@/lib/utils"

function KartuBidang({ b, onPilih }: { b: KesiapanBidang; onPilih: () => void }) {
  const siap = b.status === "SIAP"
  const persen = b.jumlahSubkegiatan ? (b.jumlahLengkap / b.jumlahSubkegiatan) * 100 : 0

  return (
    <button
      type="button"
      onClick={onPilih}
      className={cn(
        "group flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 text-left shadow-sm transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none hover:border-emerald-600/50"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 truncate font-bold text-sm font-bold">
          {b.namaBidang}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-xl px-1.5 py-0.5 font-mono text-[11px] tracking-[0.12em] uppercase",
            siap ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-600"
          )}
        >
          {siap ? "Siap" : "Draf"}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", siap ? "bg-slate-400" : "bg-emerald-600")}
          style={{ width: `${persen}%` }}
        />
      </div>

      <div className="tabular flex items-baseline gap-1 font-mono text-[11px] text-muted-foreground">
        <b className="text-foreground">{b.jumlahLengkap}</b>
        <span>dari</span>
        <b className="text-foreground">{b.jumlahSubkegiatan}</b>
        <span>subkegiatan lengkap</span>
        <ChevronRight className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  )
}

export default function PenyusunanRencana() {
  const navigate = useNavigate()
  const [periodes, setPeriodes] = React.useState<Periode[] | null>(null)
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [papan, setPapan] = React.useState<KesiapanBidang[] | null>(null)
  const [galat, setGalat] = React.useState<string | null>(null)

  const [salinTerbuka, setSalinTerbuka] = React.useState(false)
  const [opsiSalin, setOpsiSalin] = React.useState({
    ikutAktifitas: true, ikutTarget: true, ikutCapaianNol: false,
  })
  const [menyalin, setMenyalin] = React.useState(false)

  React.useEffect(() => {
    getPeriode()
      .then((p) => {
        setPeriodes(p)
        // Penyusunan dikerjakan untuk periode yang belum dibuka.
        setPeriodeId((p.find((x) => x.status === "DRAFT") ?? p.find((x) => x.status === "OPEN") ?? p[0])?.id ?? null)
      })
      .catch(() => setGalat("Gagal memuat periode."))
  }, [])

  const muat = React.useCallback(async () => {
    if (periodeId == null) return
    try {
      setPapan(await getPapanKesiapan(periodeId))
    } catch {
      setGalat("Gagal memuat papan kesiapan.")
    }
  }, [periodeId])

  React.useEffect(() => { setPapan(null); void muat() }, [muat])

  const periode = periodes?.find((p) => p.id === periodeId) ?? null
  const sumber = React.useMemo(() => {
    if (!periodes || periodeId == null) return null
    const urut = [...periodes].sort((a, b) => a.id - b.id)
    const i = urut.findIndex((p) => p.id === periodeId)
    return i > 0 ? urut[i - 1] : null
  }, [periodes, periodeId])

  const totalSub = papan?.reduce((a, b) => a + b.jumlahSubkegiatan, 0) ?? 0
  const totalLengkap = papan?.reduce((a, b) => a + b.jumlahLengkap, 0) ?? 0
  const semuaSiap = !!papan?.length && papan.every((b) => b.status === "SIAP")

  async function jalankanSalin() {
    if (!sumber || periodeId == null) return
    setMenyalin(true)
    setGalat(null)
    try {
      await salinRencana({
        dariPeriodeId: sumber.id, kePeriodeId: periodeId,
        ikutStruktur: true, ...opsiSalin,
      })
      setSalinTerbuka(false)
      await muat()
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal menyalin rencana.")
    } finally {
      setMenyalin(false)
    }
  }

  async function bukaPeriode() {
    if (periodeId == null) return
    setGalat(null)
    try {
      await ubahStatusPeriode(periodeId, "OPEN")
      setPeriodes(await getPeriode())
      await muat()
    } catch (e) {
      setGalat(apiMessage(e, "Gagal membuka periode."))
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="max-w-prose text-sm text-slate-500">
          Susun rencana per bidang sebelum periode dibuka untuk pencatatan.
          Satu subkegiatan hanya boleh dipegang satu bidang dalam satu periode.
        </p>
      </div>

      {periodes && periodes.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow>Periode</Eyebrow>
          {periodes.map((p) => (
            <Button
              key={p.id}
              size="xs"
              variant={p.id === periodeId ? "secondary" : "ghost"}
              onClick={() => setPeriodeId(p.id)}
            >
              {p.namaPeriode}
              <span className="ml-1 font-mono text-[11px] tracking-[0.12em] uppercase opacity-60">{p.status}</span>
            </Button>
          ))}
        </div>
      )}

      {galat && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{galat}</p>}

      {sumber && totalSub === 0 && (
        <div className="flex gap-2.5 rounded-xl border bg-card px-3.5 py-3 text-sm shadow-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <b>Periode ini masih kosong.</b> Salin dari {sumber.namaPeriode} supaya tidak
            perlu mengetik ulang, lalu sesuaikan target yang berubah.
          </div>
          <Button size="sm" variant="outline" onClick={() => setSalinTerbuka(true)}>
            <Copy className="size-3.5" /> Salin dari {sumber.namaPeriode}
          </Button>
        </div>
      )}

      <div className="flex items-baseline gap-3">
        <Eyebrow>Kesiapan per bidang</Eyebrow>
        <span className="tabular ml-auto font-mono text-xs text-muted-foreground">
          {totalLengkap} dari {totalSub} subkegiatan sudah tersusun
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {papan === null &&
          Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)}
        {papan?.map((b) => (
          <KartuBidang
            key={b.bidangId}
            b={b}
            onPilih={() => navigate(`/rencana/${b.bidangId}?periode=${periodeId}`)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          disabled={!semuaSiap || periode?.status !== "DRAFT"}
          onClick={() => void bukaPeriode()}
        >
          Buka periode untuk pencatatan
        </Button>
        <span className="text-xs text-muted-foreground">
          {periode?.status === "OPEN"
            ? "Periode ini sudah terbuka."
            : periode?.status === "LOCKED"
              ? "Periode ini sudah terkunci."
              : "Tersedia setelah seluruh bidang berstatus Siap, dan tidak ada periode lain yang terbuka."}
        </span>
      </div>

      <Dialog open={salinTerbuka} onOpenChange={setSalinTerbuka}>
        <DialogContent>
          <DialogHeader>
            <Eyebrow>{sumber?.namaPeriode} → {periode?.namaPeriode}</Eyebrow>
            <DialogTitle className="font-bold">Salin rencana periode sebelumnya</DialogTitle>
            <DialogDescription>
              Pilih apa saja yang ikut disalin. Realisasi dan bukti kegiatan tidak pernah
              ikut tersalin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="flex cursor-not-allowed items-start gap-2.5 rounded-xl border bg-muted/40 p-2.5 opacity-70">
              <Checkbox checked disabled className="mt-0.5" />
              <span className="text-sm">
                <b className="block">Struktur subkegiatan dan pembagian bidang</b>
                <span className="text-muted-foreground">
                  Selalu ikut — sisanya menempel padanya.
                </span>
              </span>
            </label>

            {([
              ["ikutAktifitas", "Aktivitas utama dan pendukung", "Bobot 70/30 dihitung ulang di periode baru."],
              ["ikutTarget", "Angka target", "Bisa disesuaikan satu per satu setelah disalin."],
              ["ikutCapaianNol", "Subkegiatan yang capaiannya nol", "Yang tidak berjalan sama sekali di periode sumber."],
            ] as const).map(([kunci, judul, ket]) => (
              <label key={kunci} className="flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 hover:bg-muted/40">
                <Checkbox
                  className="mt-0.5"
                  checked={opsiSalin[kunci]}
                  onCheckedChange={(v) => setOpsiSalin((o) => ({ ...o, [kunci]: v === true }))}
                />
                <span className="text-sm">
                  <b className="block">{judul}</b>
                  <span className="text-muted-foreground">{ket}</span>
                </span>
              </label>
            ))}

            {totalSub > 0 && (
              <p className="rounded-xl bg-amber-50/70 px-3 py-2 text-sm">
                Rencana <b>{periode?.namaPeriode}</b> yang sudah tersusun untuk bidang
                terdampak akan ditimpa.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSalinTerbuka(false)}>Batal</Button>
            <Button onClick={() => void jalankanSalin()} disabled={menyalin}>
              {menyalin ? "Menyalin…" : "Salin sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
