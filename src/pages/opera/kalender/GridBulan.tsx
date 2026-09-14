import { NAMA_HARI, ringkasSel, type SelKalender } from "@/lib/kalender"

/* Grid bulan hand-rolled — tanpa pustaka tanggal, sesuai konvensi proyek.

   Penanda rencana dan realisasi sengaja berbeda BENTUK sekaligus warna (titik vs kotak),
   supaya tetap terbaca saat buta warna atau dicetak abu-abu. */

const MAKS_PENANDA = 3

function Penanda({ sel }: { sel: SelKalender }) {
  const { jumlahAgenda, jumlahRealisasi, adaTerlewat } = ringkasSel(sel)
  const total = jumlahAgenda + jumlahRealisasi
  if (total === 0) return null

  const titik = Math.min(jumlahAgenda, MAKS_PENANDA)
  const kotak = Math.min(jumlahRealisasi, Math.max(0, MAKS_PENANDA - titik))
  const sisa = total - titik - kotak

  return (
    <div className="flex items-center gap-1 mt-auto">
      {Array.from({ length: titik }).map((_, i) => (
        <span
          key={`a${i}`}
          className={`size-1.5 rounded-full ${adaTerlewat ? "bg-amber-500" : "bg-emerald-500"}`}
        />
      ))}
      {Array.from({ length: kotak }).map((_, i) => (
        <span key={`r${i}`} className="size-1.5 rounded-[2px] bg-sky-500" />
      ))}
      {sisa > 0 && <span className="text-[10px] leading-none text-slate-400">+{sisa}</span>}
    </div>
  )
}

export function GridBulan({
  baris,
  terpilih,
  onPilih,
}: {
  baris: SelKalender[][]
  terpilih: string | null
  onPilih: (kunci: string) => void
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {NAMA_HARI.map((hari) => (
          <div
            key={hari}
            className="py-2 text-xs font-semibold tracking-wider text-center uppercase text-slate-500"
          >
            {hari}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {baris.flat().map((sel) => {
          const { jumlahAgenda, jumlahRealisasi } = ringkasSel(sel)
          const aktif = sel.kunci === terpilih

          return (
            <button
              key={sel.kunci}
              type="button"
              onClick={() => onPilih(sel.kunci)}
              aria-pressed={aktif}
              aria-label={`${sel.kunci}: ${jumlahAgenda} agenda, ${jumlahRealisasi} realisasi`}
              className={[
                "flex min-h-16 flex-col items-start gap-1 rounded-xl border p-2 text-left transition",
                aktif
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50",
                sel.akhirPekan && !aktif ? "bg-slate-50/60" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "text-xs font-semibold tabular",
                  !sel.bulanIni ? "text-slate-300" : "text-slate-700",
                  // Sel di luar periode tetap tergambar (baris pekan selalu utuh) tapi
                  // diredupkan dan dicoret — aksi tambah agenda dimatikan di sana.
                  !sel.dalamPeriode ? "text-slate-300 line-through" : "",
                  sel.hariIni ? "rounded-md bg-emerald-600 px-1.5 py-0.5 text-white" : "",
                ].join(" ")}
              >
                {sel.tanggal}
              </span>
              <Penanda sel={sel} />
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Rencana
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-500" /> Terlewat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-[2px] bg-sky-500" /> Realisasi tercatat
        </span>
      </div>
    </div>
  )
}
