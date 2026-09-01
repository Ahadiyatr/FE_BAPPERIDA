import * as React from "react"
import { TriangleAlert } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const angka = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 })

export function KonfirmasiRealisasiMelebihiTarget({
  open, total, target, onPeriksaKembali, onTetapSimpan,
}: {
  open: boolean
  total: number
  target: number
  onPeriksaKembali: () => void
  onTetapSimpan: () => void
}) {
  const tombolAman = React.useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          tombolAman.current?.focus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-50 text-amber-700">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Realisasi melebihi target</AlertDialogTitle>
          <AlertDialogDescription>
            Total realisasi akan menjadi <b>{angka(total)}</b> dari target <b>{angka(target)}</b>.
            Kelebihan tetap dicatat, tetapi tidak menambah capaian di atas batas bobot/100%.
            Pastikan angka yang dimasukkan benar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel ref={tombolAman} onClick={onPeriksaKembali}>
            Periksa kembali
          </AlertDialogCancel>
          <AlertDialogAction variant="default" onClick={onTetapSimpan}>
            Tetap simpan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
