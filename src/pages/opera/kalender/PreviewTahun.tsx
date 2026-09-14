import { NAMA_HARI, kunciDariBulan, labelBulan, susunGridBulan, type Bulan } from '@/lib/kalender';
import type { KalenderBulan, Periode } from '@/services';

export function PreviewTahun({
  tahun,
  periode,
  bulanPeriode,
  data,
  memuat,
  onPilih,
}: {
  tahun: number;
  periode: Periode;
  bulanPeriode: Bulan[];
  data: Map<string, KalenderBulan>;
  memuat: boolean;
  onPilih: (bulan: Bulan) => void;
}) {
  const bulanDitampilkan = bulanPeriode.filter((bulan) => bulan.tahun === tahun);

  return (
    <div>
      {memuat && (
        <p className="mb-3 text-xs text-slate-400">Memuat ringkasan kalender tahunan…</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {bulanDitampilkan.map((bulan) => {
          const kunci = kunciDariBulan(bulan);
          const isi = data.get(kunci);
          const sel = susunGridBulan({
            bulan,
            agenda: isi?.agenda ?? [],
            realisasi: isi?.realisasi ?? [],
            periodeMulai: periode.tanggalMulai,
            periodeSelesai: periode.tanggalSelesai,
          }).flat();

          return (
            <button
              key={kunci}
              type="button"
              onClick={() => onPilih(bulan)}
              aria-label={`Buka ${labelBulan(bulan)}`}
              className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:shadow-sm"
            >
              <span className="mb-2 flex items-center justify-between gap-2">
                <strong className="text-sm text-slate-800">
                  {labelBulan(bulan).replace(` ${tahun}`, '')}
                </strong>
                {isi && (
                  <span className="text-[10px] tabular text-slate-400">
                    {isi.ringkasan.jumlahAgenda} agenda
                  </span>
                )}
              </span>
              <span className="grid grid-cols-7 gap-0.5">
                {NAMA_HARI.map((hari) => (
                  <span key={hari} className="pb-1 text-center text-[8px] font-medium text-slate-400">
                    {hari.slice(0, 1)}
                  </span>
                ))}
                {sel.map((hari) => (
                  <span
                    key={hari.kunci}
                    className={`relative grid aspect-square place-items-center rounded text-[9px] tabular ${
                      hari.bulanIni ? 'text-slate-600' : 'text-transparent'
                    } ${hari.hariIni ? 'bg-emerald-600 text-white' : ''}`}
                  >
                    {hari.tanggal}
                    {hari.bulanIni && (hari.agenda.length > 0 || hari.realisasi.length > 0) && (
                      <span className="absolute bottom-0.5 flex gap-0.5" aria-hidden="true">
                        {hari.agenda.length > 0 && <i className="size-1 rounded-full bg-emerald-500" />}
                        {hari.realisasi.length > 0 && <i className="size-1 rounded-[1px] bg-sky-500" />}
                      </span>
                    )}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-emerald-500" /> Rencana</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-[2px] bg-sky-500" /> Realisasi</span>
      </div>
    </div>
  );
}
