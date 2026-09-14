import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ChevronsUpDown, LayoutGrid, ListTree } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow } from '@/components/opera/primitives';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getPeriode } from '@/services';
import { apiMessage } from '@/services/api';
import type { Periode } from '@/services';
import { PanelPenunjukan } from './rencana/PanelPenunjukan';
import { PapanKesiapan } from './rencana/PapanKesiapan';

type Tab = 'penunjukan' | 'kesiapan';

const LABEL_STATUS: Record<Periode['status'], string> = {
  DRAFT: 'Draf',
  OPEN: 'Terbuka',
  LOCKED: 'Terkunci',
};

const WARNA_STATUS: Record<Periode['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  OPEN: 'bg-emerald-50 text-emerald-700',
  LOCKED: 'bg-amber-50 text-amber-700',
};

const tanggalSingkat = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

function PemilihPeriode({
  daftar,
  nilai,
  onPilih,
}: {
  daftar: Periode[];
  nilai: number | null;
  onPilih: (id: number) => void;
}) {
  const [terbuka, setTerbuka] = React.useState(false);
  const terpilih = daftar.find(periode => periode.id === nilai) ?? null;

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <Eyebrow>Periode</Eyebrow>
      <Popover open={terbuka} onOpenChange={setTerbuka}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={terbuka}
            aria-label="Pilih periode penyusunan"
            className="h-9 w-full justify-between gap-3 rounded-xl bg-white px-3 shadow-sm sm:w-80"
          >
            {terpilih ? (
              <span className="min-w-0 truncate text-left font-semibold text-slate-800">
                {terpilih.namaPeriode}
              </span>
            ) : (
              <span className="text-slate-500">Pilih periode</span>
            )}
            <span className="flex shrink-0 items-center gap-2">
              {terpilih && (
                <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', WARNA_STATUS[terpilih.status])}>
                  {LABEL_STATUS[terpilih.status]}
                </span>
              )}
              <ChevronsUpDown className="size-4 text-slate-400" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] p-2">
          <Command>
            <CommandInput placeholder="Cari periode…" aria-label="Cari periode" />
            <CommandList className="mt-2 max-h-72 border-t border-slate-100 pt-2">
              <CommandEmpty>Periode tidak ditemukan.</CommandEmpty>
              {daftar.map(periode => (
                <CommandItem
                  key={periode.id}
                  value={`${periode.namaPeriode} ${LABEL_STATUS[periode.status]} ${periode.tanggalMulai} ${periode.tanggalSelesai}`}
                  onSelect={() => {
                    onPilih(periode.id);
                    setTerbuka(false);
                  }}
                  className="gap-3 px-2.5 py-2.5"
                >
                  <Check className={cn('size-4 shrink-0 text-emerald-600', periode.id === nilai ? 'opacity-100' : 'opacity-0')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{periode.namaPeriode}</span>
                    <span className="block text-xs text-muted-foreground">
                      {tanggalSingkat(periode.tanggalMulai)}–{tanggalSingkat(periode.tanggalSelesai)}
                    </span>
                  </span>
                  <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', WARNA_STATUS[periode.status])}>
                    {LABEL_STATUS[periode.status]}
                  </span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Dua tahap penyusunan rencana, berurutan:
 *
 *  1. Penunjukan — subkegiatan mana jadi tanggung jawab bidang mana.
 *  2. Papan kesiapan — target & aktivitas tiap bidang, lalu buka periode.
 *
 * Tahap 2 hanya menampilkan bidang yang sudah mendapat pembagian, jadi tahap 1
 * yang menjadi pintu masuk untuk periode yang masih kosong.
 */
export default function PenyusunanRencana() {
  const [sp, setSp] = useSearchParams();
  const [periodes, setPeriodes] = React.useState<Periode[] | null>(null);
  const [periodeId, setPeriodeId] = React.useState<number | null>(null);
  const [galat, setGalat] = React.useState<string | null>(null);

  const tab: Tab = sp.get('tab') === 'kesiapan' ? 'kesiapan' : 'penunjukan';
  const pindahTab = (t: Tab) =>
    setSp(
      prev => {
        const baru = new URLSearchParams(prev);
        baru.set('tab', t);
        return baru;
      },
      { replace: true },
    );

  const muatPeriode = React.useCallback(async () => {
    try {
      const daftar = await getPeriode();
      setPeriodes(daftar);
      setPeriodeId(
        id =>
          id ??
          // Penyusunan dikerjakan untuk periode yang belum dibuka.
          (daftar.find(x => x.status === 'DRAFT') ??
            daftar.find(x => x.status === 'OPEN') ??
            daftar[0])?.id ??
          null,
      );
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal memuat periode.'));
    }
  }, []);

  React.useEffect(() => {
    void muatPeriode();
  }, [muatPeriode]);

  const periode = periodes?.find(p => p.id === periodeId) ?? null;

  // Periode tepat sebelum yang dipilih — sumber untuk salin rencana.
  const sumber = React.useMemo(() => {
    if (!periodes || periodeId == null) return null;
    const urut = [...periodes].sort((a, b) => a.id - b.id);
    const i = urut.findIndex(p => p.id === periodeId);
    return i > 0 ? urut[i - 1] : null;
  }, [periodes, periodeId]);

  return (
    <div className="space-y-4">
      <p className="max-w-prose text-sm text-slate-500">
        Tetapkan subkegiatan apa saja yang jadi tanggung jawab tiap bidang,
        beserta aktivitas dan targetnya. Satu subkegiatan hanya boleh dipegang
        satu bidang dalam satu periode.
      </p>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {periodes && periodes.length > 1 && (
          <PemilihPeriode daftar={periodes} nilai={periodeId} onPilih={setPeriodeId} />
        )}

        <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <Button
            size="sm"
            variant={tab === 'penunjukan' ? 'default' : 'ghost'}
            onClick={() => pindahTab('penunjukan')}
          >
            <ListTree className="size-3.5" /> Penunjukan
          </Button>
          <Button
            size="sm"
            variant={tab === 'kesiapan' ? 'default' : 'ghost'}
            onClick={() => pindahTab('kesiapan')}
          >
            <LayoutGrid className="size-3.5" /> Papan Kesiapan
          </Button>
        </div>
      </div>

      {galat && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {galat}
        </p>
      )}

      {!periode && !galat && <Skeleton className="h-64" />}

      {periode && tab === 'penunjukan' && (
        <PanelPenunjukan
          key={periode.id}
          periode={periode}
          sumber={sumber}
          onPerubahan={muatPeriode}
        />
      )}

      {periode && tab === 'kesiapan' && (
        <PapanKesiapan
          key={periode.id}
          periode={periode}
          sumber={sumber}
          onPerubahan={muatPeriode}
        />
      )}
    </div>
  );
}
