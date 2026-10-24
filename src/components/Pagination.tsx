import { ChevronLeft, ChevronRight } from "lucide-react";

import { PILIHAN_UKURAN, nomorHalaman, type Paginasi } from "@/lib/paginasi";

type KontrolHalamanProps = Pick<
  Paginasi<unknown>,
  "halaman" | "ukuran" | "totalHalaman" | "total" | "dari" | "sampai" | "setHalaman" | "setUkuran"
>;

const tombol =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-40";

/** "Tampilkan N data" + info rentang + navigasi halaman, di kaki tabel daftar. */
export default function KontrolHalaman({
  halaman, ukuran, totalHalaman, total, dari, sampai, setHalaman, setUkuran,
}: KontrolHalamanProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="inline-flex items-center gap-2">
          Tampilkan
          <select
            value={ukuran}
            onChange={(e) => setUkuran(Number(e.target.value))}
            aria-label="Jumlah data per halaman"
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            {PILIHAN_UKURAN.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          data
        </label>
        <p className="tabular">
          Menampilkan {dari}–{sampai} dari {total} data
        </p>
      </div>
      {totalHalaman > 1 && (
        <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
          <button
            type="button"
            className={`${tombol} text-slate-600 hover:bg-slate-100`}
            onClick={() => setHalaman(halaman - 1)}
            disabled={halaman === 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          {nomorHalaman(halaman, totalHalaman).map((n, i) =>
            n === null ? (
              <span key={`elipsis-${i}`} className="px-1 text-slate-400" aria-hidden="true">…</span>
            ) : (
              <button
                key={n}
                type="button"
                className={`${tombol} tabular ${n === halaman ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                onClick={() => setHalaman(n)}
                aria-label={`Halaman ${n}`}
                aria-current={n === halaman ? "page" : undefined}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            className={`${tombol} text-slate-600 hover:bg-slate-100`}
            onClick={() => setHalaman(halaman + 1)}
            disabled={halaman === totalHalaman}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
