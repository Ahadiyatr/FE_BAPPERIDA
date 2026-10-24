import * as React from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  hapusAktifitasDariRencana, setDipakaiAktifitas, tambahAktifitasKeRencana,
} from "@/services"
import type { DetailAktifitas } from "@/services"
import { apiMessage } from "@/services/api"
import { cn } from "@/lib/utils"
import { Panel, persen1 } from "../bagian/ui"

/**
 * Penyusunan aktivitas pendukung oleh admin bidang, hanya saat periode DRAFT (PRD §3.2).
 * Pengubahan target tetap milik admin aplikasi di `/rencana/:bidangId`; di sini hanya
 * pakai/tidak pakai, tambah, dan hapus ad-hoc — tiga jalur `aktifitas-bidang` yang terbuka
 * untuk peran bidang. Backend tetap penegak akhir (pendukung terakhir, status periode).
 */
export function SusunPendukung({
  rencanaId, aktifitas, onBerubah,
}: {
  rencanaId: number
  aktifitas: DetailAktifitas[]
  onBerubah: () => Promise<void>
}) {
  const [sibuk, setSibuk] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [namaBaru, setNamaBaru] = React.useState("")
  const [targetBaru, setTargetBaru] = React.useState("1")

  const pendukung = aktifitas.filter((a) => a.tipeAktifitas === "PENDUKUNG")
  const jumlahDipakai = pendukung.filter((a) => a.dipakai).length

  async function bungkus(aksi: () => Promise<unknown>, gagal: string) {
    setSibuk(true)
    setGalat(null)
    try { await aksi(); await onBerubah() }
    catch (e) { setGalat(apiMessage(e, gagal)) }
    finally { setSibuk(false) }
  }

  return (
    <Panel judul="Susun aktivitas pendukung">
      <div className="space-y-3 p-4">
        <p className="text-sm text-slate-500">
          Hilangkan centang untuk pendukung yang tidak dikerjakan bidang periode ini — 30% dibagi
          ulang ke pendukung yang tersisa. Setiap perubahan membatalkan status siap bidang, jadi
          admin aplikasi perlu menandainya ulang.
        </p>

        <div className="divide-y rounded-xl border">
          {pendukung.map((a) => {
            const terakhir = a.dipakai && jumlahDipakai === 1
            return (
              <div key={a.id} className={cn("flex items-center gap-2 px-3 py-2 text-sm", !a.dipakai && "bg-slate-50")}>
                <Checkbox
                  className="shrink-0"
                  checked={a.dipakai}
                  disabled={sibuk || terakhir}
                  title={terakhir ? "Sisakan minimal satu pendukung yang dipakai" : undefined}
                  aria-label={`Pakai ${a.namaAktifitas}`}
                  onCheckedChange={(v) => void bungkus(() => setDipakaiAktifitas(a.id, v === true), "Gagal mengubah pendukung.")}
                />
                <span className={cn("min-w-0 flex-1 truncate", !a.dipakai && "text-slate-400 line-through")}>
                  {a.namaAktifitas}
                </span>
                <span className="tabular w-14 shrink-0 text-right font-mono text-xs text-slate-500">
                  {a.dipakai ? persen1(a.bobotTarget) : "—"}
                </span>
                {a.flagAdhoc && (
                  <Button
                    variant="ghost" size="icon-xs" disabled={sibuk}
                    aria-label={`Hapus ${a.namaAktifitas}`} title="Hapus aktivitas ad-hoc permanen"
                    onClick={() => void bungkus(() => hapusAktifitasDariRencana(a.id), "Gagal menghapus pendukung.")}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            className="h-8 min-w-48 flex-1"
            placeholder="Nama aktivitas pendukung"
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
          />
          <Input
            type="number" step="any" min={0}
            className="tabular h-8 w-20 font-mono"
            aria-label="Target aktivitas baru"
            value={targetBaru}
            onChange={(e) => setTargetBaru(e.target.value)}
          />
          <Button
            size="sm"
            disabled={sibuk || !namaBaru.trim()}
            onClick={() => void bungkus(async () => {
              await tambahAktifitasKeRencana({
                subkegiatanBidangId: rencanaId,
                namaAktifitas: namaBaru.trim(),
                target: Number(targetBaru) || 0,
              })
              setNamaBaru("")
            }, "Gagal menambah pendukung.")}
          >
            <Plus className="size-3.5" /> Tambah
          </Button>
        </div>

        {galat && <p role="alert" className="text-sm text-red-600">{galat}</p>}
      </div>
    </Panel>
  )
}
