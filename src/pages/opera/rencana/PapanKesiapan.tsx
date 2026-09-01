import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Copy, Info, Undo2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow } from '@/components/opera/primitives';
import {
  getPapanKesiapan,
  tandaiKesiapan,
  ubahStatusPeriode,
} from '@/services';
import { apiMessage } from '@/services/api';
import type { KesiapanBidang, Periode } from '@/services';
import { cn } from '@/lib/utils';
import { DialogSalinRencana } from './DialogSalinRencana';

function KartuBidang({
  b,
  dapatKembaliKeDraf,
  sedangMengubah,
  onPilih,
  onKembaliKeDraf,
}: {
  b: KesiapanBidang;
  dapatKembaliKeDraf: boolean;
  sedangMengubah: boolean;
  onPilih: () => void;
  onKembaliKeDraf: () => void;
}) {
  const siap = b.status === 'SIAP';
  const persen = b.jumlahSubkegiatan
    ? (b.jumlahLengkap / b.jumlahSubkegiatan) * 100
    : 0;

  return (
    <div
      className={cn(
        'group flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 text-left shadow-sm transition-colors',
        'hover:border-emerald-600/50',
      )}
    >
      <button
        type="button"
        onClick={onPilih}
        className="text-left focus-visible:outline-none"
      >
        <div className="flex items-start gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-bold">
            {b.namaBidang}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-xl px-1.5 py-0.5 font-mono text-[11px] tracking-[0.12em] uppercase',
              siap ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-600',
            )}
          >
            {siap ? 'Siap' : 'Draf'}
          </span>
        </div>

        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full',
              siap ? 'bg-slate-400' : 'bg-emerald-600',
            )}
            style={{ width: `${persen}%` }}
          />
        </div>

        <div className="tabular mt-2.5 flex items-baseline gap-1 font-mono text-[11px] text-muted-foreground">
          <b className="text-foreground">{b.jumlahLengkap}</b>
          <span>dari</span>
          <b className="text-foreground">{b.jumlahSubkegiatan}</b>
          <span>subkegiatan lengkap</span>
          <ChevronRight className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </button>

      {dapatKembaliKeDraf && (
        <Button
          size="xs"
          variant="outline"
          onClick={onKembaliKeDraf}
          disabled={sedangMengubah}
        >
          <Undo2 className="size-3.5" />
          {sedangMengubah ? 'Mengubah…' : 'Kembali ke Draf'}
        </Button>
      )}
    </div>
  );
}

/**
 * Kesiapan rencana per bidang + gerbang membuka periode.
 *
 * Papan ini hanya memuat bidang yang SUDAH mendapat pembagian (backend
 * `KesiapanRencanaService::papanPeriode` bersumber dari TRANS_SUBKEGIATAN_BIDANG),
 * jadi untuk periode yang masih kosong tab Penunjukan-lah pintu masuknya.
 */
export function PapanKesiapan({
  periode,
  sumber,
  onPerubahan,
}: {
  periode: Periode;
  /** Periode sebelumnya untuk disalin, bila ada. */
  sumber: Periode | null;
  onPerubahan: () => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const [papan, setPapan] = React.useState<KesiapanBidang[] | null>(null);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [bidangDiubah, setBidangDiubah] = React.useState<number | null>(null);
  const [salinTerbuka, setSalinTerbuka] = React.useState(false);

  const muat = React.useCallback(async () => {
    try {
      setPapan(await getPapanKesiapan(periode.id));
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal memuat papan kesiapan.'));
    }
  }, [periode.id]);

  React.useEffect(() => {
    setPapan(null);
    void muat();
  }, [muat]);

  const totalSub = papan?.reduce((a, b) => a + b.jumlahSubkegiatan, 0) ?? 0;
  const totalLengkap = papan?.reduce((a, b) => a + b.jumlahLengkap, 0) ?? 0;
  const semuaSiap = !!papan?.length && papan.every(b => b.status === 'SIAP');

  async function bukaPeriode() {
    setGalat(null);
    try {
      await ubahStatusPeriode(periode.id, 'OPEN');
      await onPerubahan();
      await muat();
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal membuka periode.'));
    }
  }

  async function kembaliKeDraf(bidangId: number) {
    setBidangDiubah(bidangId);
    setGalat(null);
    try {
      await tandaiKesiapan(bidangId, periode.id, 'DRAFT');
      await muat();
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal mengembalikan bidang ke draf.'));
    } finally {
      setBidangDiubah(null);
    }
  }

  return (
    <div className="space-y-4">
      {galat && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {galat}
        </p>
      )}

      {sumber && totalSub === 0 && (
        <div className="flex gap-2.5 rounded-xl border bg-card px-3.5 py-3 text-sm shadow-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <b>Periode ini masih kosong.</b> Salin dari {sumber.namaPeriode}{' '}
            supaya tidak perlu mengetik ulang, lalu sesuaikan target yang
            berubah.
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSalinTerbuka(true)}
          >
            <Copy className="size-3.5" /> Salin dari {sumber.namaPeriode}
          </Button>
        </div>
      )}

      <div className="flex items-baseline gap-3">
        <Eyebrow>Kesiapan per bidang</Eyebrow>
        <span className="tabular ml-auto font-mono text-xs text-muted-foreground">
          {totalLengkap} dari {totalSub} subkegiatan sudah tersusun
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {papan === null &&
          Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        {papan?.length === 0 && (
          <p className="col-span-full rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
            Belum ada bidang yang mendapat pembagian rencana pada periode ini.
            Mulai dari tab <b>Penunjukan</b>.
          </p>
        )}
        {papan?.map(b => (
          <KartuBidang
            key={b.bidangId}
            b={b}
            dapatKembaliKeDraf={
              b.status === 'SIAP' && periode.status === 'DRAFT'
            }
            sedangMengubah={bidangDiubah === b.bidangId}
            onPilih={() => navigate(`/rencana/${b.bidangId}?periode=${periode.id}`)}
            onKembaliKeDraf={() => void kembaliKeDraf(b.bidangId)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          disabled={!semuaSiap || periode.status !== 'DRAFT'}
          onClick={() => void bukaPeriode()}
        >
          Buka periode untuk pencatatan
        </Button>
        <span className="text-xs text-muted-foreground">
          {periode.status === 'OPEN'
            ? 'Periode ini sudah terbuka.'
            : periode.status === 'LOCKED'
              ? 'Periode ini sudah terkunci.'
              : 'Tersedia setelah seluruh bidang berstatus Siap, dan tidak ada periode lain yang terbuka.'}
        </span>
      </div>

      {sumber && (
        <DialogSalinRencana
          terbuka={salinTerbuka}
          onTutup={() => setSalinTerbuka(false)}
          sumber={sumber}
          tujuan={periode}
          adaIsi={totalSub > 0}
          onSelesai={async () => {
            await onPerubahan();
            await muat();
          }}
        />
      )}
    </div>
  );
}
