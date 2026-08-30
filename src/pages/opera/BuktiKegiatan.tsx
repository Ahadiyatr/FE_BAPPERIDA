import * as React from "react"
import { RefreshCw, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getBidang, getBuktiByBidang, getPeriode, hapusLampiran, uploadLampiran } from "@/services"
import type { Bidang, CatatanBukti, Periode, RealisasiLampiran } from "@/services"
import { apiMessage } from "@/services/api"
import { usePeran } from "@/lib/peran"
import { Toast } from "@/utils/toast"
import { GaleriLampiran, PratinjauLampiran } from "@/components/opera/pratinjau-lampiran"
import { Panel, PilihPeriode } from "./bagian/ui"

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

function KartuCatatan({
  c, sedangUnggah, onUnggah, onHapus, onPratinjau,
}: {
  c: CatatanBukti
  sedangUnggah: boolean
  onUnggah: (f: FileList) => void
  onHapus: (l: RealisasiLampiran) => void
  onPratinjau: (l: RealisasiLampiran) => void
}) {
  const input = React.useRef<HTMLInputElement>(null)

  return (
    <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <p className="font-mono text-xs text-slate-400">{c.kodeSubkegiatan}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800 line-clamp-2">{c.namaAktifitas}</p>
        <p className="mt-1 text-xs text-slate-500">
          {tanggal(c.tanggalKegiatan)} · {c.jumlahRealisasi} tercatat · {c.logEntryName}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {c.keterangan && <p className="text-sm text-slate-600 line-clamp-3">{c.keterangan}</p>}

        <GaleriLampiran lampiran={c.lampirans} onPratinjau={onPratinjau} onHapus={c.lampirans.length > 1 ? onHapus : undefined} />

        <input
          ref={input}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onUnggah(e.target.files)
            e.target.value = ""
          }}
        />
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={sedangUnggah}
          onClick={() => input.current?.click()}
        >
          {sedangUnggah ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Mengunggah…
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" /> Tambah bukti
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function BuktiKegiatan() {
  const { peran, bidangId: bidangPeran } = usePeran()
  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [bidangs, setBidangs] = React.useState<Bidang[]>([])
  const [bidangId, setBidangId] = React.useState<number | null>(bidangPeran)
  const [catatan, setCatatan] = React.useState<CatatanBukti[]>([])
  const [hanyaBerlampiran, setHanyaBerlampiran] = React.useState(false)
  const [memuat, setMemuat] = React.useState(true)
  const [galatMuat, setGalatMuat] = React.useState<string | null>(null)
  const [mengunggah, setMengunggah] = React.useState<number | null>(null)
  const [menghapus, setMenghapus] = React.useState<number | null>(null)
  const [pratinjau, setPratinjau] = React.useState<RealisasiLampiran | null>(null)

  const muatAwal = React.useCallback(async () => {
    setGalatMuat(null)
    setMemuat(true)
    const sumberBidang = peran === "admin_aplikasi" ? getBidang() : Promise.resolve<Bidang[]>([])
    try {
      const [p, b] = await Promise.all([getPeriode(), sumberBidang])
      setPeriodes(p)
      setPeriodeId((p.find((x) => x.status === "OPEN") ?? p[0])?.id ?? null)
      setBidangs(b)
      if (peran === "admin_aplikasi") setBidangId((v) => v ?? b[0]?.id ?? null)
    } catch (e) { setGalatMuat(apiMessage(e, "Gagal memuat periode atau bidang.")); setMemuat(false) }
  }, [peran])
  React.useEffect(() => { void muatAwal() }, [muatAwal])

  const muat = React.useCallback(async () => {
    if (periodeId == null || bidangId == null) return
    setMemuat(true)
    setGalatMuat(null)
    try {
      setCatatan(await getBuktiByBidang(bidangId, periodeId))
    } catch (e) {
      setCatatan([])
      setGalatMuat(apiMessage(e, "Gagal memuat bukti kegiatan."))
    } finally {
      setMemuat(false)
    }
  }, [bidangId, periodeId])

  React.useEffect(() => { void muat() }, [muat])

  const terlihat = hanyaBerlampiran ? catatan.filter((c) => c.lampirans.length > 0) : catatan
  const totalBerkas = catatan.reduce((a, c) => a + c.lampirans.length, 0)

  async function unggah(realisasiId: number, files: FileList) {
    const sebelum = catatan.find((c) => c.realisasiId === realisasiId)?.lampirans.length ?? 0
    setMengunggah(realisasiId)
    try {
      const lampiranBaru = await uploadLampiran(realisasiId, Array.from(files))
      setCatatan((prev) =>
        prev.map((c) =>
          c.realisasiId === realisasiId ? { ...c, lampirans: lampiranBaru } : c
        )
      )
      const n = Math.max(lampiranBaru.length - sebelum, 1)
      Toast.fire({ icon: "success", title: `${n} bukti ditambahkan.` })
    } catch (e) {
      Toast.fire({ icon: "error", title: apiMessage(e, "Gagal menambah bukti.") })
    } finally {
      setMengunggah(null)
    }
  }

  async function hapus(lampiran: RealisasiLampiran) {
    if (!window.confirm(`Hapus bukti “${lampiran.namaBerkas}”?`)) return
    setMenghapus(lampiran.id)
    try {
      await hapusLampiran(lampiran.id)
      setCatatan((prev) => prev.map((c) => c.realisasiId === lampiran.realisasiId
        ? { ...c, lampirans: c.lampirans.filter((x) => x.id !== lampiran.id) } : c))
      if (pratinjau?.id === lampiran.id) setPratinjau(null)
      Toast.fire({ icon: "success", title: "Bukti dihapus." })
    } catch (e) {
      Toast.fire({ icon: "error", title: apiMessage(e, "Gagal menghapus bukti.") })
    } finally {
      setMenghapus(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Foto dan dokumen pendukung tiap catatan realisasi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {peran === "admin_aplikasi" && (
            <select
              value={bidangId ?? ""}
              onChange={(e) => setBidangId(Number(e.target.value))}
              className="px-3 py-2 text-sm bg-white border rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              {bidangs.map((b) => <option key={b.id} value={b.id}>{b.namaBidang}</option>)}
            </select>
          )}
          <PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-500">
          <b className="text-slate-700 tabular">{catatan.length}</b> catatan ·{" "}
          <b className="text-slate-700 tabular">{totalBerkas}</b> berkas
        </span>
        <Button
          size="sm"
          variant={hanyaBerlampiran ? "secondary" : "outline"}
          className="ml-auto"
          onClick={() => setHanyaBerlampiran((v) => !v)}
        >
          {hanyaBerlampiran ? "Hanya yang berlampiran" : "Tampilkan semua"}
        </Button>
      </div>

      {memuat && <Panel><p className="p-8 text-sm text-center text-slate-400">Memuat…</p></Panel>}

      {galatMuat && <Panel><div className="p-8 text-center"><p className="text-sm text-red-600">{galatMuat}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => { if (periodeId == null) void muatAwal(); else void muat() }}><RefreshCw className="size-3.5" /> Coba lagi</Button></div></Panel>}

      {!memuat && !galatMuat && terlihat.length === 0 && (
        <Panel><p className="p-8 text-sm text-center text-slate-500">
          Belum ada catatan realisasi pada periode ini.
        </p></Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {!memuat && !galatMuat && terlihat.map((c) => (
          <KartuCatatan
            key={c.realisasiId}
            c={c}
            sedangUnggah={mengunggah === c.realisasiId}
            onUnggah={(f) => void unggah(c.realisasiId, f)}
            onHapus={(l) => { if (menghapus == null) void hapus(l) }}
            onPratinjau={setPratinjau}
          />
        ))}
      </div>

      {pratinjau && (
        <PratinjauLampiran lampiran={pratinjau} onTutup={() => setPratinjau(null)} />
      )}
    </div>
  )
}
