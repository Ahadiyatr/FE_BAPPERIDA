import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { apiMessage } from "@/services/api"
import { simpanAgenda } from "@/services"
import type { AgendaKegiatan, DetailSubkegiatan, Periode, StatusAgenda } from "@/services"

const kelasInput =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"

type Aktivitas = DetailSubkegiatan["aktifitas"][number]

/**
 * Hanya aktivitas yang dipakai yang bisa dijadwalkan — server menolak 422 sisanya — dan
 * subkegiatan tanpa satu pun aktivitas terpakai tidak perlu ditawarkan.
 */
function rencanaTerjadwalkan(rencana: DetailSubkegiatan[]) {
  return rencana
    .map((sub) => ({
      ...sub,
      aktifitas: sub.aktifitas
        .filter((a) => a.dipakai)
        .sort((a, b) => a.urutan - b.urutan),
    }))
    .filter((sub) => sub.aktifitas.length > 0)
}

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
  const pilihan = React.useMemo(() => rencanaTerjadwalkan(rencana), [rencana])

  const [subId, setSubId] = React.useState<number | null>(null)
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
  // Judul terakhir yang diisikan otomatis dari nama aktivitas. Selama pengguna belum
  // mengetik sendiri, mengganti aktivitas ikut mengganti judulnya.
  const judulOtomatis = React.useRef("")

  // Isi ulang setiap kali dialog dibuka, supaya sisa isian sebelumnya tidak bocor.
  React.useEffect(() => {
    if (!terbuka) return
    setGalat(null)
    // Tidak ada aktivitas yang dipilihkan diam-diam: pilihan bawaan yang keliru lolos
    // tersimpan tanpa disadari. Hanya bila bidang memegang satu subkegiatan, langkah
    // pertama sudah pasti dan langsung diisi.
    setSubId(pilihan.length === 1 ? pilihan[0].id : null)
    setAktifitasId(agenda?.aktifitasBidangId ?? null)
    judulOtomatis.current = ""
    setJudul(agenda?.judulAgenda ?? "")
    setMulai(agenda?.tanggalMulai ?? tanggalAwal)
    setSelesai(agenda?.tanggalSelesai ?? tanggalAwal)
    setJumlah(agenda?.jumlahRencana ?? 1)
    setLokasi(agenda?.lokasi ?? "")
    setKeterangan(agenda?.keterangan ?? "")
    setStatus(agenda?.status ?? "RENCANA")
  }, [terbuka, agenda, tanggalAwal, pilihan])

  const pilihSub = (id: number) => {
    if (id === subId) return
    setSubId(id)
    setAktifitasId(null)
  }

  const pilihAktifitas = (a: Aktivitas) => {
    setAktifitasId(a.id)
    setJudul((j) => (j.trim() === "" || j === judulOtomatis.current ? a.namaAktifitas : j))
    judulOtomatis.current = a.namaAktifitas
  }

  const aktifTerpilih = React.useMemo(
    () => pilihan.flatMap((s) => s.aktifitas).find((a) => a.id === aktifitasId) ?? null,
    [pilihan, aktifitasId],
  )

  const simpan = async () => {
    if (aktifitasId == null) return setGalat("Pilih aktivitas yang dijadwalkan.")
    if (!judul.trim()) return setGalat("Judul agenda wajib diisi.")
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
      {/* Kolom grid dikunci minmax(0,1fr): tanpa itu nama subkegiatan yang di-truncate
          melebarkan kolom melewati tepi dialog. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{agenda ? "Ubah agenda" : "Tambah agenda"}</DialogTitle>
          <DialogDescription>
            Periode {periode.namaPeriode} ({periode.tanggalMulai} s/d {periode.tanggalSelesai}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {agenda ? (
            // Backend menolak pemindahan aktivitas: itu sama dengan memindahkan agenda ke
            // bidang lain. Salah aktivitas → hapus lalu buat ulang.
            <div>
              <Label>Aktivitas</Label>
              <div className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {agenda.konteks && (
                  <span className="block text-xs text-slate-500">
                    <span className="font-mono">{agenda.konteks.kodeSubkegiatan}</span>{" "}
                    {agenda.konteks.namaSubkegiatan}
                  </span>
                )}
                {agenda.konteks?.namaAktifitas ?? "Aktivitas terpilih"}
              </div>
              <span className="mt-1 block text-xs text-slate-400">
                Aktivitas tidak bisa dipindah. Hapus agenda ini lalu buat ulang bila keliru.
              </span>
            </div>
          ) : (
            <PilihAktivitas
              pilihan={pilihan}
              subId={subId}
              aktifitasId={aktifitasId}
              onPilihSub={pilihSub}
              onPilihAktifitas={pilihAktifitas}
            />
          )}

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

          <div className="-mt-1 space-y-1">
            {aktifTerpilih && (
              <RingkasTarget
                aktivitas={aktifTerpilih}
                // Saat mengubah, jumlah lama agenda ini sudah ada di jumlahTerjadwal — keluarkan
                // dulu supaya tidak terhitung dua kali.
                terjadwalLain={
                  (aktifTerpilih.jumlahTerjadwal ?? 0) -
                  (agenda && agenda.status !== "BATAL" ? agenda.jumlahRencana : 0)
                }
                jumlahIni={status === "BATAL" ? 0 : jumlah}
              />
            )}
            <p className="text-xs text-slate-400">
              Agenda adalah rencana. Capaian tetap dihitung dari realisasi yang punya bukti.
            </p>
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

/**
 * Pemilih dua langkah: subkegiatan dulu (dapat dicari), lalu aktivitasnya. Satu daftar
 * datar tidak bisa dipakai — nama aktivitas pendukung ("Rapat Koordinasi", "Pembentukan
 * SK Tim") berulang di setiap subkegiatan, jadi pilihan tidak terbedakan tanpa induknya.
 */
function PilihAktivitas({
  pilihan,
  subId,
  aktifitasId,
  onPilihSub,
  onPilihAktifitas,
}: {
  pilihan: DetailSubkegiatan[]
  subId: number | null
  aktifitasId: number | null
  onPilihSub: (id: number) => void
  onPilihAktifitas: (a: Aktivitas) => void
}) {
  const [cariTerbuka, setCariTerbuka] = React.useState(false)
  const sub = pilihan.find((s) => s.id === subId) ?? null
  const utama = sub?.aktifitas.filter((a) => a.tipeAktifitas === "UTAMA") ?? []
  const pendukung = sub?.aktifitas.filter((a) => a.tipeAktifitas === "PENDUKUNG") ?? []

  if (pilihan.length === 0) {
    return (
      <div>
        <Label>Aktivitas</Label>
        <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Bidang ini belum memegang aktivitas yang dipakai pada periode ini.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="agenda-subkegiatan">1. Subkegiatan</Label>
        {/* `modal`: dialog induk mengunci scroll di luar isinya, sedangkan konten popover
            di-portal ke body — tanpa kunci scroll milik popover sendiri daftarnya tak bisa digulir. */}
        <Popover modal open={cariTerbuka} onOpenChange={setCariTerbuka}>
          <PopoverTrigger asChild>
            <button
              id="agenda-subkegiatan"
              type="button"
              role="combobox"
              aria-expanded={cariTerbuka}
              className={cn(kelasInput, "mt-1 flex items-center gap-2 text-left")}
            >
              {sub ? (
                <span className="min-w-0 flex-1" title={sub.namaSubkegiatan}>
                  <span className="block font-mono text-[11px] text-slate-400">
                    {sub.kodeSubkegiatan}
                  </span>
                  <span className="block truncate">{sub.namaSubkegiatan}</span>
                </span>
              ) : (
                <span className="flex-1 text-slate-400">Pilih subkegiatan…</span>
              )}
              <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <Command>
              <CommandInput placeholder="Cari kode atau nama subkegiatan…" />
              <CommandList className="max-h-72">
                <CommandEmpty>Tidak ada subkegiatan yang cocok.</CommandEmpty>
                <CommandGroup>
                  {pilihan.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={`${s.kodeSubkegiatan} ${s.namaSubkegiatan}`}
                      onSelect={() => {
                        onPilihSub(s.id)
                        setCariTerbuka(false)
                      }}
                      className="items-start"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          s.id === subId ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="min-w-0">
                        <span className="block font-mono text-[11px] text-slate-400">
                          {s.kodeSubkegiatan}
                        </span>
                        <span className="line-clamp-2 text-sm">{s.namaSubkegiatan}</span>
                        <span className="text-[11px] text-slate-400">
                          {s.aktifitas.length} aktivitas
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <span className="text-sm font-medium leading-none">2. Aktivitas</span>
        {sub ? (
          <div
            role="radiogroup"
            aria-label="Aktivitas"
            className="mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200"
          >
            {utama.map((a) => (
              <OpsiAktivitas key={a.id} aktivitas={a} terpilih={a.id === aktifitasId} onPilih={onPilihAktifitas} />
            ))}
            {pendukung.length > 0 && (
              <p className="border-t border-slate-100 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Pendukung
              </p>
            )}
            {pendukung.map((a) => (
              <OpsiAktivitas key={a.id} aktivitas={a} terpilih={a.id === aktifitasId} onPilih={onPilihAktifitas} />
            ))}
          </div>
        ) : (
          <p className="mt-1 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
            Pilih subkegiatan dulu untuk melihat aktivitasnya.
          </p>
        )}
      </div>
    </div>
  )
}

const angka = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 })

/**
 * Sandingan jumlah rencana agenda dengan target aktivitas di rencana program. Hanya
 * peringatan — melebihi target sah (mis. cadangan jadwal), dan agenda tidak pernah
 * menyumbang capaian.
 */
function RingkasTarget({
  aktivitas,
  terjadwalLain,
  jumlahIni,
}: {
  aktivitas: Aktivitas
  terjadwalLain: number
  jumlahIni: number
}) {
  // Respons lama tanpa jumlah_terjadwal: lebih baik diam daripada menampilkan angka keliru.
  if (aktivitas.jumlahTerjadwal == null) return null

  const satuan = aktivitas.satuan ? ` ${aktivitas.satuan}` : ""
  if (aktivitas.target <= 0) {
    return (
      <p className="text-xs text-slate-500">
        Aktivitas ini tidak bertarget; jumlah rencana bebas diisi.
      </p>
    )
  }

  const total = terjadwalLain + jumlahIni
  const sisa = aktivitas.target - total
  return (
    <>
      <p className="text-xs text-slate-500" data-testid="ringkas-target">
        Terjadwal <b>{angka(total)}</b> dari target <b>{angka(aktivitas.target)}</b>
        {satuan} · sisa <b>{angka(Math.max(sisa, 0))}</b>
      </p>
      {sisa < 0 && (
        <p className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700" role="status">
          Total agenda jadi {angka(total)}, melebihi target {angka(aktivitas.target)}
          {satuan}. Tetap bisa disimpan.
        </p>
      )}
    </>
  )
}

function OpsiAktivitas({
  aktivitas,
  terpilih,
  onPilih,
}: {
  aktivitas: Aktivitas
  terpilih: boolean
  onPilih: (a: Aktivitas) => void
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2 border-t border-slate-100 px-3 py-2 text-sm first:border-t-0 hover:bg-slate-50",
        terpilih && "bg-emerald-50 hover:bg-emerald-50",
      )}
    >
      <input
        type="radio"
        name="agenda-aktifitas"
        checked={terpilih}
        onChange={() => onPilih(aktivitas)}
        className="mt-0.5 accent-emerald-600"
      />
      <span className="min-w-0 flex-1 text-slate-700">
        {aktivitas.tipeAktifitas === "UTAMA" && (
          <span className="mr-1.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Utama
          </span>
        )}
        {aktivitas.namaAktifitas}
      </span>
      {aktivitas.satuan && (
        <span className="shrink-0 text-xs text-slate-400">{aktivitas.satuan}</span>
      )}
    </label>
  )
}
