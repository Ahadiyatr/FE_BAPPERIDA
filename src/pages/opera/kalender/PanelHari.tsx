import { CalendarPlus, MapPin, Paperclip, Pencil, Trash2 } from "lucide-react"

import { Kode, StatusBadge, type Nada } from "@/components/opera/primitives"
import { Button } from "@/components/ui/button"
import { dariKunci, type SelKalender } from "@/lib/kalender"
import { Panel } from "@/pages/opera/bagian/ui"
import type { AgendaKegiatan } from "@/services"

const tanggalPanjang = (kunci: string) =>
  dariKunci(kunci).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

function nadaAgenda(agenda: AgendaKegiatan): { nada: Nada; label: string } {
  if (agenda.status === "SELESAI") return { nada: "baik", label: "Selesai" }
  if (agenda.status === "BATAL") return { nada: "buruk", label: "Batal" }
  if (agenda.terlewat) return { nada: "sedang", label: "Terlewat" }
  return { nada: "netral", label: "Rencana" }
}

export function PanelHari({
  sel,
  bolehTulis,
  onTambah,
  onUbah,
  onHapus,
}: {
  sel: SelKalender | null
  bolehTulis: boolean
  onTambah: (kunci: string) => void
  onUbah: (agenda: AgendaKegiatan) => void
  onHapus: (agenda: AgendaKegiatan) => void
}) {
  if (!sel) {
    return (
      <Panel judul="Rincian hari">
        <p className="p-4 text-sm text-slate-500">
          Pilih tanggal di kalender untuk melihat agenda dan realisasi hari itu.
        </p>
      </Panel>
    )
  }

  // Sel di luar periode tetap tergambar karena baris pekan selalu utuh, tapi tidak boleh
  // menerima agenda — backend akan menolaknya dengan 422 yang sulit dijelaskan pengguna.
  const bolehTambah = bolehTulis && sel.dalamPeriode

  return (
    <Panel
      judul={tanggalPanjang(sel.kunci)}
      aksi={
        bolehTambah ? (
          <Button size="xs" onClick={() => onTambah(sel.kunci)}>
            <CalendarPlus className="size-3.5" /> Agenda
          </Button>
        ) : undefined
      }
    >
      <div className="p-4 space-y-5">
        <section>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Rencana ({sel.agenda.length})
          </h3>

          {sel.agenda.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              {sel.dalamPeriode
                ? "Belum ada agenda di tanggal ini."
                : "Tanggal ini di luar rentang periode."}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {/* Key pada id: agenda multi-hari adalah objek yang sama di beberapa sel. */}
              {sel.agenda.map((agenda) => {
                const { nada, label } = nadaAgenda(agenda)
                return (
                  <li
                    key={agenda.id}
                    className="p-3 border rounded-xl border-slate-200 bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{agenda.judulAgenda}</p>
                        {agenda.konteks && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            <Kode>{agenda.konteks.kodeSubkegiatan}</Kode> · {agenda.konteks.namaAktifitas}
                          </p>
                        )}
                        {agenda.tanggalSelesai !== agenda.tanggalMulai && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {agenda.tanggalMulai} s/d {agenda.tanggalSelesai}
                          </p>
                        )}
                        {agenda.lokasi && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="size-3" /> {agenda.lokasi}
                          </p>
                        )}
                        {agenda.keterangan && (
                          <p className="mt-1 text-xs text-slate-600">{agenda.keterangan}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <StatusBadge nada={nada}>{label}</StatusBadge>
                        {bolehTulis && (
                          <>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label="Ubah agenda"
                              onClick={() => onUbah(agenda)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label="Hapus agenda"
                              onClick={() => onHapus(agenda)}
                            >
                              <Trash2 className="size-3.5 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Rencana {agenda.jumlahRencana}
                      {agenda.konteks?.satuan ? ` ${agenda.konteks.satuan}` : ""} · disusun{" "}
                      {agenda.logEntryName}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Realisasi tercatat ({sel.realisasi.length})
          </h3>

          {sel.realisasi.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Belum ada realisasi di tanggal ini.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {sel.realisasi.map((baris) => (
                <li key={baris.id} className="p-3 border rounded-xl border-sky-200 bg-sky-50/40">
                  <p className="text-sm font-medium text-slate-800">
                    {baris.konteks?.namaAktifitas ?? "Aktivitas"}
                  </p>
                  {baris.konteks && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      <Kode>{baris.konteks.kodeSubkegiatan}</Kode> · {baris.konteks.namaSubkegiatan}
                    </p>
                  )}
                  {baris.keterangan && (
                    <p className="mt-1 text-xs text-slate-600">{baris.keterangan}</p>
                  )}
                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span className="tabular">
                      {baris.jumlahRealisasi}
                      {baris.konteks?.satuan ? ` ${baris.konteks.satuan}` : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Paperclip className="size-3" /> {baris.jumlahLampiran}
                    </span>
                    <span>· dicatat {baris.logEntryName}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Panel>
  )
}
