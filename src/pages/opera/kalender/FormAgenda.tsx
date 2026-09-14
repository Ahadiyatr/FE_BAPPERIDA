import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiMessage } from "@/services/api"
import { simpanAgenda } from "@/services"
import type { AgendaKegiatan, DetailSubkegiatan, Periode, StatusAgenda } from "@/services"

const kelasInput =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"

export function FormAgenda({
  terbuka,
  periode,
  rencana,
  agenda,
  tanggalAwal,
  onTutup,
  onTersimpan,
}: {
  terbuka: boolean
  periode: Periode
  /** Sumber pilihan aktivitas, dikelompokkan per subkegiatan. */
  rencana: DetailSubkegiatan[]
  /** null = buat baru. */
  agenda: AgendaKegiatan | null
  tanggalAwal: string
  onTutup: () => void
  onTersimpan: () => void
}) {
  const [aktifitasId, setAktifitasId] = React.useState<number | null>(null)
  const [judul, setJudul] = React.useState("")
  const [mulai, setMulai] = React.useState(tanggalAwal)
  const [selesai, setSelesai] = React.useState(tanggalAwal)
  const [jumlah, setJumlah] = React.useState(1)
  const [lokasi, setLokasi] = React.useState("")
  const [keterangan, setKeterangan] = React.useState("")
  const [status, setStatus] = React.useState<StatusAgenda>("RENCANA")
  const [menyimpan, setMenyimpan] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)

  // Isi ulang setiap kali dialog dibuka, supaya sisa isian sebelumnya tidak bocor.
  React.useEffect(() => {
    if (!terbuka) return
    setGalat(null)
    setAktifitasId(agenda?.aktifitasBidangId ?? rencana[0]?.aktifitas[0]?.id ?? null)
    setJudul(agenda?.judulAgenda ?? "")
    setMulai(agenda?.tanggalMulai ?? tanggalAwal)
    setSelesai(agenda?.tanggalSelesai ?? tanggalAwal)
    setJumlah(agenda?.jumlahRencana ?? 1)
    setLokasi(agenda?.lokasi ?? "")
    setKeterangan(agenda?.keterangan ?? "")
    setStatus(agenda?.status ?? "RENCANA")
  }, [terbuka, agenda, tanggalAwal, rencana])

  const simpan = async () => {
    if (!judul.trim()) return setGalat("Judul agenda wajib diisi.")
    if (aktifitasId == null) return setGalat("Pilih aktivitas yang dijadwalkan.")
    if (selesai < mulai) return setGalat("Tanggal selesai tidak boleh mendahului tanggal mulai.")

    setMenyimpan(true)
    setGalat(null)
    try {
      await simpanAgenda({
        id: agenda?.id ?? null,
        aktifitasBidangId: aktifitasId,
        judulAgenda: judul.trim(),
        // Nilai <Input type="date"> sudah "YYYY-MM-DD" — dikirim apa adanya.
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
        jumlahRencana: jumlah,
        lokasi,
        keterangan,
        status: agenda ? status : undefined,
      })
      onTersimpan()
      onTutup()
    } catch (e) {
      setGalat(apiMessage(e, "Gagal menyimpan agenda."))
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <Dialog open={terbuka} onOpenChange={(v) => !v && onTutup()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{agenda ? "Ubah agenda" : "Tambah agenda"}</DialogTitle>
          <DialogDescription>
            Periode {periode.namaPeriode} ({periode.tanggalMulai} s/d {periode.tanggalSelesai}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="agenda-aktifitas">Aktivitas</Label>
            {agenda ? (
              // Backend menolak pemindahan aktivitas: itu sama dengan memindahkan agenda ke
              // bidang lain. Salah aktivitas → hapus lalu buat ulang.
              <p className="mt-1 text-sm text-slate-600">
                {agenda.konteks?.namaAktifitas ?? "Aktivitas terpilih"}
                <span className="block mt-0.5 text-xs text-slate-400">
                  Aktivitas tidak bisa dipindah. Hapus agenda ini lalu buat ulang bila keliru.
                </span>
              </p>
            ) : (
              <select
                id="agenda-aktifitas"
                value={aktifitasId ?? ""}
                onChange={(e) => setAktifitasId(Number(e.target.value))}
                className={`mt-1 ${kelasInput}`}
              >
                {rencana.map((sub) => (
                  <optgroup key={sub.id} label={`${sub.kodeSubkegiatan} — ${sub.namaSubkegiatan}`}>
                    {sub.aktifitas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.namaAktifitas} ({a.tipeAktifitas})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>

          <div>
            <Label htmlFor="agenda-judul">Judul agenda</Label>
            <Input
              id="agenda-judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Rapat koordinasi triwulan"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="agenda-mulai">Tanggal mulai</Label>
              <Input
                id="agenda-mulai"
                type="date"
                value={mulai}
                // Batas periode ditegakkan browser dulu, sebelum server perlu menolak 422.
                min={periode.tanggalMulai}
                max={periode.tanggalSelesai}
                onChange={(e) => {
                  setMulai(e.target.value)
                  if (selesai < e.target.value) setSelesai(e.target.value)
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="agenda-selesai">Tanggal selesai</Label>
              <Input
                id="agenda-selesai"
                type="date"
                value={selesai}
                min={mulai}
                max={periode.tanggalSelesai}
                onChange={(e) => setSelesai(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="agenda-jumlah">Jumlah rencana</Label>
              <Input
                id="agenda-jumlah"
                type="number"
                step="1"
                min="0"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-slate-400">
                Agenda adalah rencana. Capaian tetap dihitung dari realisasi yang punya bukti.
              </p>
            </div>
            {agenda && (
              <div>
                <Label htmlFor="agenda-status">Status</Label>
                <select
                  id="agenda-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusAgenda)}
                  className={`mt-1 ${kelasInput}`}
                >
                  <option value="RENCANA">Rencana</option>
                  <option value="SELESAI">Selesai</option>
                  <option value="BATAL">Batal</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="agenda-lokasi">Lokasi</Label>
            <Input
              id="agenda-lokasi"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Opsional"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="agenda-keterangan">Keterangan</Label>
            <Textarea
              id="agenda-keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Opsional"
              className="mt-1"
            />
          </div>

          {galat && (
            <p className="px-3 py-2 text-sm text-red-600 rounded-xl bg-red-50">{galat}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onTutup} disabled={menyimpan}>
            Batal
          </Button>
          <Button onClick={() => void simpan()} disabled={menyimpan}>
            {menyimpan ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
