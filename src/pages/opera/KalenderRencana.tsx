import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  bulanDariKunci,
  bulanPeriode,
  geserBulan,
  jendelaGrid,
  kunciDariBulan,
  labelBulan,
  susunGridBulan,
  type Bulan,
  type SelKalender,
} from "@/lib/kalender"
import { usePeran } from "@/lib/peran"
import { KartuKpi, Panel, PilihPeriode } from "@/pages/opera/bagian/ui"
import { GridBulan } from "@/pages/opera/kalender/GridBulan"
import { PanelHari } from "@/pages/opera/kalender/PanelHari"
import { FormAgenda } from "@/pages/opera/kalender/FormAgenda"
import { PreviewTahun } from "@/pages/opera/kalender/PreviewTahun"
import { getKalenderBulan, getPeriode, getRencanaSayaRingkas, hapusAgenda } from "@/services"
import type { AgendaKegiatan, DetailSubkegiatan, KalenderBulan, Periode } from "@/services"
import { apiMessage } from "@/services/api"

/**
 * Kalender rencana pelaksanaan — satu halaman untuk kedua peran.
 *
 * admin_bidang menyusun agenda bidangnya sendiri; admin_aplikasi membaca lintas bidang
 * dengan penyaring bidang dan tanpa satu pun aksi tulis. Keduanya berbagi grid, panel hari,
 * dan pemuatan data — memisahkannya jadi dua halaman berarti menduplikasi ±400 baris yang
 * pasti akan melenceng satu sama lain.
 */
export default function KalenderRencana() {
  const { peran } = usePeran()

  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [periodeId, setPeriodeId] = React.useState<number | null>(null)
  const [bulan, setBulan] = React.useState<Bulan | null>(null)
  const [tampilan, setTampilan] = React.useState<"bulan" | "tahun">("bulan")
  const [bidangPilihan, setBidangPilihan] = React.useState<number | null>(null)

  const [data, setData] = React.useState<KalenderBulan | null>(null)
  const [rencana, setRencana] = React.useState<DetailSubkegiatan[]>([])
  const [terpilih, setTerpilih] = React.useState<string | null>(null)
  const [memuat, setMemuat] = React.useState(true)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [dataTahun, setDataTahun] = React.useState<Map<string, KalenderBulan>>(new Map())
  const [memuatTahun, setMemuatTahun] = React.useState(false)

  const [formTerbuka, setFormTerbuka] = React.useState(false)
  const [agendaDiubah, setAgendaDiubah] = React.useState<AgendaKegiatan | null>(null)
  const [tanggalForm, setTanggalForm] = React.useState("")
  const [agendaDihapus, setAgendaDihapus] = React.useState<AgendaKegiatan | null>(null)

  // Navigasi bulan memicu request beruntun yang bisa mendarat tidak berurutan.
  const urutanMuat = React.useRef(0)

  React.useEffect(() => {
    let batal = false
    void (async () => {
      try {
        const daftar = await getPeriode()
        if (batal) return
        setPeriodes(daftar)
        const aktif = daftar.find((p) => p.status === "OPEN") ?? daftar.find((p) => p.status === "DRAFT") ?? daftar[0]
        setPeriodeId(aktif?.id ?? null)
        if (!aktif) setMemuat(false)
      } catch (e) {
        if (batal) return
        setGalat(apiMessage(e, "Gagal memuat daftar periode."))
        setMemuat(false)
      }
    })()
    return () => {
      batal = true
    }
  }, [])

  // Bulan menyesuaikan periode: server yang menentukan bulan bawaan, jadi di sini cukup
  // dikosongkan supaya panggilan pertama tidak memaksa bulan periode sebelumnya.
  React.useEffect(() => {
    setBulan(null)
    setTerpilih(null)
    setDataTahun(new Map())
  }, [periodeId])

  const muat = React.useCallback(async () => {
    if (periodeId == null) return
    const urutan = ++urutanMuat.current
    setMemuat(true)
    setGalat(null)
    try {
      const hasil = await getKalenderBulan({
        periodeId,
        // Tanpa bulan, server memilih bulan hari ini bila di dalam periode, selain itu
        // bulan awal periode.
        bulan: bulan ? kunciDariBulan(bulan) : "",
        // admin_bidang JANGAN mengirim bidang_id — server yang mengunci ke bidangnya.
        bidangId: peran === "admin_aplikasi" ? bidangPilihan : null,
      })
      if (urutan !== urutanMuat.current) return

      setData(hasil)
      if (!bulan) setBulan(bulanDariKunci(hasil.bulan))

      // Jaring pengaman kalau backend dan FE tidak sepakat awal pekan: selisihnya membuat
      // agenda hilang dari sel bocoran tanpa error apa pun.
      const lokal = jendelaGrid(bulanDariKunci(hasil.bulan))
      if (import.meta.env.DEV && (lokal.dari !== hasil.rentang.dari || lokal.sampai !== hasil.rentang.sampai)) {
        console.warn("Jendela grid FE dan backend berbeda", { lokal, server: hasil.rentang })
      }
    } catch (e) {
      if (urutan !== urutanMuat.current) return
      setData(null)
      setGalat(apiMessage(e, "Gagal memuat kalender."))
    } finally {
      if (urutan === urutanMuat.current) setMemuat(false)
    }
  }, [periodeId, bulan, bidangPilihan, peran])

  React.useEffect(() => {
    void muat()
  }, [muat])

  // Daftar aktivitas untuk form hanya relevan bagi admin_bidang (satu-satunya penulis).
  React.useEffect(() => {
    if (peran !== "admin_bidang" || periodeId == null) return setRencana([])
    let batal = false
    void (async () => {
      try {
        const hasil = await getRencanaSayaRingkas(periodeId)
        if (!batal) setRencana(hasil)
      } catch {
        if (!batal) setRencana([])
      }
    })()
    return () => {
      batal = true
    }
  }, [peran, periodeId])

  const baris = React.useMemo<SelKalender[][]>(() => {
    if (!data || !bulan) return []
    return susunGridBulan({
      bulan,
      agenda: data.agenda,
      realisasi: data.realisasi,
      periodeMulai: data.periode.tanggalMulai,
      periodeSelesai: data.periode.tanggalSelesai,
    })
  }, [data, bulan])

  const selTerpilih = React.useMemo(
    () => baris.flat().find((s) => s.kunci === terpilih) ?? null,
    [baris, terpilih],
  )

  // Navigasi dikunci ke rentang periode — tanpa ini pengguna tersasar ke bulan kosong
  // dan menyimpulkan datanya hilang.
  const daftarBulan = React.useMemo(
    () => (data ? bulanPeriode(data.periode.tanggalMulai, data.periode.tanggalSelesai) : []),
    [data],
  )
  const indeksBulan = bulan
    ? daftarBulan.findIndex((b) => kunciDariBulan(b) === kunciDariBulan(bulan))
    : -1
  const adaSebelum = indeksBulan > 0
  const adaSesudah = indeksBulan >= 0 && indeksBulan < daftarBulan.length - 1

  const bolehTulis = peran === "admin_bidang" && (data?.dapatMenjadwalkan ?? false)

  React.useEffect(() => {
    if (tampilan !== "tahun" || !data || !bulan || periodeId == null) return
    let batal = false
    const bulanTahun = daftarBulan.filter((item) => item.tahun === bulan.tahun)
    setMemuatTahun(true)

    void Promise.all(
      bulanTahun.map(async (item) => {
        const kunci = kunciDariBulan(item)
        if (kunci === data.bulan) return [kunci, data] as const
        const hasil = await getKalenderBulan({
          periodeId,
          bulan: kunci,
          bidangId: peran === "admin_aplikasi" ? bidangPilihan : null,
        })
        return [kunci, hasil] as const
      }),
    )
      .then((hasil) => {
        if (!batal) setDataTahun(new Map(hasil))
      })
      .catch((e) => {
        if (!batal) setGalat(apiMessage(e, "Gagal memuat preview tahunan."))
      })
      .finally(() => {
        if (!batal) setMemuatTahun(false)
      })

    return () => {
      batal = true
    }
  }, [tampilan, data, bulan, daftarBulan, periodeId, peran, bidangPilihan])

  const bukaForm = (tanggal: string, agenda: AgendaKegiatan | null = null) => {
    setTanggalForm(tanggal)
    setAgendaDiubah(agenda)
    setFormTerbuka(true)
  }

  const konfirmasiHapus = async () => {
    if (!agendaDihapus) return
    try {
      await hapusAgenda(agendaDihapus.id)
      setAgendaDihapus(null)
      void muat()
    } catch (e) {
      setGalat(apiMessage(e, "Gagal menghapus agenda."))
      setAgendaDihapus(null)
    }
  }

  if (!memuat && periodes.length === 0) {
    return (
      <Panel judul="Kalender Rencana Pelaksanaan">
        <p className="p-6 text-sm text-slate-500">
          Belum ada periode perencanaan. Kalender akan tampil setelah periode dibuat.
        </p>
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-500">
          {peran === "admin_bidang"
            ? "Susun agenda pelaksanaan bidang Anda, lalu bandingkan dengan realisasi yang sudah dicatat."
            : "Sebaran agenda pelaksanaan seluruh bidang beserta realisasi yang sudah dicatat."}
        </p>

        <div className="flex items-center gap-2">
          {peran === "admin_aplikasi" && data && (
            <select
              value={bidangPilihan ?? ""}
              onChange={(e) => setBidangPilihan(e.target.value ? Number(e.target.value) : null)}
              aria-label="Saring bidang"
              className="px-3 py-2 text-sm bg-white border rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Semua bidang</option>
              {data.bidang.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.namaBidang}
                </option>
              ))}
            </select>
          )}
          {periodes.length > 0 && (
            <PilihPeriode periodes={periodes} nilai={periodeId} onPilih={setPeriodeId} />
          )}
        </div>
      </div>

      {galat && <p className="px-3 py-2 text-sm text-red-600 rounded-xl bg-red-50">{galat}</p>}

      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KartuKpi label="Agenda bulan ini" nilai={String(data.ringkasan.jumlahAgenda)} />
          <KartuKpi label="Realisasi tercatat" nilai={String(data.ringkasan.jumlahRealisasi)} />
          <KartuKpi
            label="Agenda terlewat"
            nilai={String(data.ringkasan.agendaTerlewat)}
            catatan="Sudah lewat tapi masih berstatus rencana"
          />
        </div>
      )}

      <div className="flex justify-end">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <Button
            size="sm"
            variant={tampilan === "bulan" ? "default" : "ghost"}
            aria-pressed={tampilan === "bulan"}
            onClick={() => setTampilan("bulan")}
          >
            Bulanan
          </Button>
          <Button
            size="sm"
            variant={tampilan === "tahun" ? "default" : "ghost"}
            aria-pressed={tampilan === "tahun"}
            onClick={() => setTampilan("tahun")}
          >
            Tahunan
          </Button>
        </div>
      </div>

      {tampilan === "bulan" ? (
      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Panel
          judul={bulan ? labelBulan(bulan) : "Kalender"}
          aksi={
            <div className="flex items-center gap-1.5">
              <select
                value={bulan ? kunciDariBulan(bulan) : ""}
                onChange={(e) => {
                  setBulan(bulanDariKunci(e.target.value))
                  setTerpilih(null)
                }}
                aria-label="Pilih bulan"
                className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
              >
                {daftarBulan.map((item) => (
                  <option key={kunciDariBulan(item)} value={kunciDariBulan(item)}>
                    {labelBulan(item)}
                  </option>
                ))}
              </select>
              <Button
                size="icon-xs"
                variant="outline"
                aria-label="Bulan sebelumnya"
                disabled={!adaSebelum}
                onClick={() => bulan && setBulan(geserBulan(bulan, -1))}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                variant="outline"
                aria-label="Bulan berikutnya"
                disabled={!adaSesudah}
                onClick={() => bulan && setBulan(geserBulan(bulan, 1))}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          }
        >
          <div className="p-4">
            {memuat && !data ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="min-h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <GridBulan baris={baris} terpilih={terpilih} onPilih={setTerpilih} />
            )}
          </div>
        </Panel>

        <PanelHari
          sel={selTerpilih}
          bolehTulis={bolehTulis}
          onTambah={(kunci) => bukaForm(kunci)}
          onUbah={(agenda) => bukaForm(agenda.tanggalMulai, agenda)}
          onHapus={setAgendaDihapus}
        />
      </div>
      ) : data && bulan ? (
        <Panel judul={`Preview tahun ${bulan.tahun}`}>
          <div className="p-4">
            <PreviewTahun
              tahun={bulan.tahun}
              periode={data.periode}
              bulanPeriode={daftarBulan}
              data={dataTahun}
              memuat={memuatTahun}
              onPilih={(pilihan) => {
                setBulan(pilihan)
                setTerpilih(null)
                setTampilan("bulan")
              }}
            />
          </div>
        </Panel>
      ) : null}

      {data && (
        <FormAgenda
          terbuka={formTerbuka}
          periode={data.periode}
          rencana={rencana}
          agenda={agendaDiubah}
          tanggalAwal={tanggalForm}
          onTutup={() => setFormTerbuka(false)}
          onTersimpan={() => void muat()}
        />
      )}

      <AlertDialog open={agendaDihapus !== null} onOpenChange={(v) => !v && setAgendaDihapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus agenda ini?</AlertDialogTitle>
            <AlertDialogDescription>
              “{agendaDihapus?.judulAgenda}” pada {agendaDihapus?.tanggalMulai} akan dihapus dari
              kalender. Realisasi yang sudah dicatat tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => void konfirmasiHapus()}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
