import * as React from "react"
import { ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getLog, getPeriode, getRingkasanLog } from "@/services"
import type { AksiLog, LogAktivitas as Baris, Periode } from "@/services"
import { usePeran } from "@/lib/peran"
import { KartuKpi, Panel, Th } from "./bagian/ui"

const LABEL_AKSI: Record<AksiLog, string> = {
  BUAT: "Tambah", UBAH: "Ubah", HAPUS: "Hapus", NONAKTIFKAN: "Nonaktifkan", AKTIFKAN: "Aktifkan",
  BUKA_PERIODE: "Buka periode", KUNCI_PERIODE: "Kunci periode",
  UBAH_BOBOT: "Ubah bobot", TANDAI_SIAP: "Tandai siap", BATAL_SIAP: "Batal siap",
  SALIN_RENCANA: "Salin rencana", CATAT_REALISASI: "Catat realisasi",
  UNGGAH_BUKTI: "Unggah bukti",
}

/** Warna menandai berat-ringannya tindakan, bukan jenis datanya. */
const NADA_AKSI: Record<AksiLog, string> = {
  KUNCI_PERIODE: "bg-amber-50 text-amber-700",
  BUKA_PERIODE: "bg-amber-50 text-amber-700",
  HAPUS: "bg-red-50 text-red-600",
  NONAKTIFKAN: "bg-red-50 text-red-600",
  AKTIFKAN: "bg-emerald-50 text-emerald-700",
  UBAH_BOBOT: "bg-amber-50 text-amber-700",
  SALIN_RENCANA: "bg-amber-50 text-amber-700",
  TANDAI_SIAP: "bg-emerald-50 text-emerald-700",
  BATAL_SIAP: "bg-slate-100 text-slate-600",
  BUAT: "bg-emerald-50 text-emerald-700",
  UBAH: "bg-slate-100 text-slate-600",
  CATAT_REALISASI: "bg-slate-100 text-slate-600",
  UNGGAH_BUKTI: "bg-slate-100 text-slate-600",
}

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

export default function LogAktivitasLayar() {
  const { peran, bidangId } = usePeran()
  // PRD §4: admin bidang hanya melihat jejak bidangnya. Batas ini diteruskan
  // ke service, bukan disaring di sini — lihat catatan di log.service.ts.
  const batasBidang = peran === "admin_bidang" ? bidangId : null

  const [baris, setBaris] = React.useState<Baris[]>([])
  const [ringkas, setRingkas] = React.useState({ total: 0, hariIni: 0, pengguna: 0 })
  const [periodes, setPeriodes] = React.useState<Periode[]>([])
  const [cari, setCari] = React.useState("")
  const [aksi, setAksi] = React.useState<AksiLog | "">("")
  const [periodeId, setPeriodeId] = React.useState<number | "">("")
  const [memuat, setMemuat] = React.useState(true)

  React.useEffect(() => { getPeriode().then(setPeriodes).catch(() => {}) }, [])

  React.useEffect(() => {
    let batal = false
    setMemuat(true)
    Promise.all([
      getLog({
        bidangId: batasBidang,
        cari: cari || undefined,
        aksi: aksi || undefined,
        periodeId: periodeId === "" ? undefined : periodeId,
      }),
      getRingkasanLog(batasBidang),
    ])
      .then(([l, r]) => { if (!batal) { setBaris(l); setRingkas(r) } })
      .finally(() => !batal && setMemuat(false))
    return () => { batal = true }
  }, [batasBidang, cari, aksi, periodeId])

  const gaya = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Log Aktivitas</h1>
        <p className="mt-1 max-w-prose text-sm text-slate-500">
          Siapa mengubah apa, dan kapan. Nama pelaku disimpan sebagai salinan beku —
          menonaktifkan atau mengganti nama pengguna tidak mengubah jejak yang sudah ada.
        </p>
      </div>

      {peran === "admin_bidang" && (
        <div className="flex gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Anda melihat jejak bidang Anda sendiri. Kejadian bidang lain dan perubahan data master tidak ditampilkan.</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <KartuKpi label="Kejadian tercatat" nilai={String(ringkas.total)}
          catatan={peran === "admin_bidang" ? "Dalam lingkup bidang Anda" : "Seluruh sistem"} />
        <KartuKpi label="Hari ini" nilai={String(ringkas.hariIni)} />
        <KartuKpi label="Pengguna terlibat" nilai={String(ringkas.pengguna)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari kejadian atau nama pelaku…"
          className="h-9 w-full sm:w-72"
        />
        <select className={gaya} value={aksi} onChange={(e) => setAksi(e.target.value as AksiLog | "")}>
          <option value="">Semua tindakan</option>
          {(Object.keys(LABEL_AKSI) as AksiLog[]).map((a) => (
            <option key={a} value={a}>{LABEL_AKSI[a]}</option>
          ))}
        </select>
        <select
          className={gaya}
          value={periodeId}
          onChange={(e) => setPeriodeId(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">Semua periode</option>
          {periodes.map((p) => <option key={p.id} value={p.id}>{p.namaPeriode}</option>)}
        </select>
        {(cari || aksi || periodeId !== "") && (
          <Button variant="ghost" size="sm"
            onClick={() => { setCari(""); setAksi(""); setPeriodeId("") }}>
            Bersihkan saringan
          </Button>
        )}
      </div>

      <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Waktu</Th><Th>Pelaku</Th><Th>Tindakan</Th><Th>Kejadian</Th><Th>Tabel</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memuat && (
              <tr><td colSpan={5} className="px-6 py-8 text-sm text-center text-slate-400">Memuat…</td></tr>
            )}
            {!memuat && baris.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center">
                <p className="text-sm text-slate-600">
                  {cari || aksi || periodeId !== ""
                    ? "Tidak ada kejadian yang cocok dengan saringan."
                    : "Belum ada kejadian tercatat."}
                </p>
                {!(cari || aksi || periodeId !== "") && (
                  <p className="mt-1 text-xs text-slate-400">
                    Jejak mulai terisi begitu ada yang mengubah master, mengunci periode,
                    atau mencatat realisasi.
                  </p>
                )}
              </td></tr>
            )}
            {!memuat && baris.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-sm whitespace-nowrap tabular text-slate-500">
                  {waktu(l.waktu)}
                </td>
                <td className="px-6 py-3 text-sm whitespace-nowrap">
                  <span className="font-medium text-slate-800">{l.namaPengguna}</span>
                  <p className="text-xs text-slate-400">
                    {l.peran === "admin_aplikasi" ? "Admin aplikasi" : "Admin bidang"}
                  </p>
                </td>
                <td className="px-6 py-3">
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${NADA_AKSI[l.aksi]}`}>
                    {LABEL_AKSI[l.aksi]}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-slate-700">{l.ringkasan}</td>
                <td className="px-6 py-3 font-mono text-xs whitespace-nowrap text-slate-400">
                  {l.entitas}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
