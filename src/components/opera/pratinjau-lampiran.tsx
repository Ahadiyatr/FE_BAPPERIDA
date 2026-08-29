import { Download, Eye, FileText, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { AuthedImage, DocumentPreview, downloadAuthedFile } from "@/components/AuthedMedia"
import { apiMessage } from "@/services/api"
import type { RealisasiLampiran } from "@/services"
import { Toast } from "@/utils/toast"

/* Pratinjau & unduh lampiran bukti (foto/dokumen). Dipakai bersama oleh
   Bukti Kegiatan dan Detail Subkegiatan. Berkas ditarik lewat endpoint
   ber-auth `/lampiran/:id/preview`, jadi tidak bisa dipasang langsung di
   <img src> / <a href> — lihat komponen di @/components/AuthedMedia. */

export const ekstensiBerkas = (nama: string) => nama.split(".").pop()?.toLowerCase() ?? ""

export const formatUkuranBerkas = (b: number) =>
  b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

export async function unduhLampiran(l: RealisasiLampiran) {
  try {
    await downloadAuthedFile(`/lampiran/${l.id}/preview`, l.namaBerkas)
  } catch (e) {
    Toast.fire({ icon: "error", title: apiMessage(e, "Gagal mengunduh berkas.") })
  }
}

/** Modal pratinjau satu lampiran — PDF & gambar tampil langsung, format lain
 * jatuh ke tombol unduh (lihat DocumentPreview). */
export function PratinjauLampiran({
  lampiran, onTutup,
}: {
  lampiran: RealisasiLampiran
  onTutup: () => void
}) {
  const ext = ekstensiBerkas(lampiran.namaBerkas)

  return (
    <Dialog open onOpenChange={(o) => !o && onTutup()}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base break-all">{lampiran.namaBerkas}</DialogTitle>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl bg-slate-100">
          {lampiran.tipeBerkas === "FOTO" ? (
            <div className="h-[70vh]">
              <AuthedImage
                lampiranId={lampiran.id}
                alt={lampiran.namaBerkas}
                className="h-full w-full object-contain"
              />
            </div>
          ) : ext === "pdf" ? (
            <div className="h-[75vh]">
              <DocumentPreview id={lampiran.id} ext="pdf" />
            </div>
          ) : (
            <div className="flex justify-center bg-white p-8">
              <DocumentPreview id={lampiran.id} ext={ext} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => void unduhLampiran(lampiran)}>
            <Download className="h-4 w-4" /> Unduh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Galeri lampiran satu catatan realisasi — grid foto + daftar dokumen, tiap
 * item bisa dipratinjau atau diunduh. */
export function GaleriLampiran({
  lampiran, onPratinjau, onHapus, className = "",
}: {
  lampiran: RealisasiLampiran[]
  onPratinjau: (l: RealisasiLampiran) => void
  onHapus?: (l: RealisasiLampiran) => void
  className?: string
}) {
  const foto = lampiran.filter((l) => l.tipeBerkas === "FOTO")
  const dokumen = lampiran.filter((l) => l.tipeBerkas === "DOKUMEN")

  if (lampiran.length === 0) {
    return <p className={`text-xs text-slate-400 ${className}`}>Belum ada bukti terlampir.</p>
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {foto.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {foto.map((l) => (
            <div key={l.id} className="group relative overflow-hidden aspect-video rounded-lg bg-slate-100">
              <button
                type="button"
                onClick={() => onPratinjau(l)}
                title={`Pratinjau ${l.namaBerkas}`}
                className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <AuthedImage
                  lampiranId={l.id}
                  alt={l.namaBerkas}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
              <button
                type="button"
                onClick={() => void unduhLampiran(l)}
                title="Unduh foto"
                className="absolute right-1 top-1 z-10 rounded-md bg-white/90 p-1 text-slate-600 opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100 focus:opacity-100 focus:outline-none"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              {onHapus && (
                <button type="button" onClick={() => onHapus(l)} title="Hapus bukti" className="absolute bottom-1 right-1 z-10 rounded-md bg-white/90 p-1 text-rose-600 opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100 focus:opacity-100 focus:outline-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {dokumen.length > 0 && (
        <ul className="space-y-1">
          {dokumen.map((l) => (
            <li key={l.id} className="flex items-center gap-1 pr-1 text-xs rounded-lg bg-slate-50">
              <button
                type="button"
                onClick={() => onPratinjau(l)}
                title={`Pratinjau ${l.namaBerkas}`}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="flex-1 truncate text-slate-600">{l.namaBerkas}</span>
                <span className="tabular text-slate-400">{formatUkuranBerkas(l.ukuranByte)}</span>
                <Eye className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => void unduhLampiran(l)}
                title="Unduh dokumen"
                className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {onHapus && <button type="button" onClick={() => onHapus(l)} title="Hapus bukti" className="shrink-0 rounded p-1 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none"><Trash2 className="w-3.5 h-3.5" /></button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
