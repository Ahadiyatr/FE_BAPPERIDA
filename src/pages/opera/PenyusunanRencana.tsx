import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, ListTree } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow } from '@/components/opera/primitives';
import { getPeriode } from '@/services';
import { apiMessage } from '@/services/api';
import type { Periode } from '@/services';
import { PanelPenunjukan } from './rencana/PanelPenunjukan';
import { PapanKesiapan } from './rencana/PapanKesiapan';

type Tab = 'penunjukan' | 'kesiapan';

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

      {periodes && periodes.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow>Periode</Eyebrow>
          {periodes.map(p => (
            <Button
              key={p.id}
              size="xs"
              variant={p.id === periodeId ? 'secondary' : 'ghost'}
              onClick={() => setPeriodeId(p.id)}
            >
              {p.namaPeriode}
              <span className="ml-1 font-mono text-[11px] tracking-[0.12em] uppercase opacity-60">
                {p.status}
              </span>
            </Button>
          ))}
        </div>
      )}

      {galat && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {galat}
        </p>
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
