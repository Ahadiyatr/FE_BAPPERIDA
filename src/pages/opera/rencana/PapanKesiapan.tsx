import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, Copy, Info, Lock, Undo2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getPapanKesiapan,
  getPenunjukan,
  tandaiKesiapan,
  ubahStatusPeriode,
} from '@/services';
import { apiMessage } from '@/services/api';
import type { KesiapanBidang, Periode } from '@/services';
import {
  jumlahSubkegiatanKurang,
  pecahButir,
  syaratBukaPeriode,
  tahapKesiapan,
  urutkanKesiapan,
  type TahapKesiapan,
} from '@/lib/kesiapan';
import { cn } from '@/lib/utils';
import { DialogSalinRencana } from './DialogSalinRencana';

const TAHAP: Record<
  TahapKesiapan,
  { label: string; keterangan: string; titik: string; garis: string; teks: string; isi: string }
> = {
  kurang: {
    label: 'Perlu dilengkapi',
    keterangan: 'Ada target atau aktivitas yang belum memenuhi syarat',
    titik: 'bg-red-500',
    garis: 'bg-red-500',
    teks: 'text-red-700',
    isi: 'bg-red-500',
  },
  menunggu: {
    label: 'Menunggu ditandai',
    keterangan: 'Rencana sudah lengkap, tinggal ditinjau dan ditandai',
    titik: 'bg-amber-500',
    garis: 'bg-amber-500',
    teks: 'text-amber-700',
    isi: 'bg-amber-500',
  },
  siap: {
    label: 'Siap',
    keterangan: 'Sudah ditandai siap',
    titik: 'bg-emerald-600',
    garis: 'bg-emerald-600',
    teks: 'text-emerald-700',
    isi: 'bg-emerald-600',
  },
};

const waktuWita = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Makassar',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function Meter({ label, nilai, total, warna }: { label: string; nilai: number; total: number; warna: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <b className="tabular text-foreground">
          {nilai}/{total}
        </b>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-[width]', warna)}
          style={{ width: `${total ? (nilai / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

function BarisBidang({
  b,
  dapatDisunting,
  sibuk,
  onBuka,
  onTandaiSiap,
  onKembaliKeDraf,
}: {
  b: KesiapanBidang;
  dapatDisunting: boolean;
  sibuk: boolean;
  onBuka: () => void;
  onTandaiSiap: () => void;
  onKembaliKeDraf: () => void;
}) {
  const [lihatKurang, setLihatKurang] = React.useState(false);
  const tahap = tahapKesiapan(b);
  const gaya = TAHAP[tahap];
  const nKurang = jumlahSubkegiatanKurang(b);

  return (
    <div className="relative border-b last:border-b-0">
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', gaya.garis)} />
      <div className="grid gap-x-4 gap-y-3 py-3.5 pl-5 pr-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] md:items-center">
        <div className="min-w-0">
          <p className="text-sm font-bold">{b.namaBidang}</p>
          <p className={cn('mt-0.5 text-xs font-semibold', gaya.teks)}>
            {tahap === 'kurang'
              ? `${nKurang} subkegiatan perlu dilengkapi`
              : tahap === 'menunggu'
                ? 'Lengkap, menunggu ditandai'
                : 'Siap'}
            {tahap === 'siap' && b.ditandaiPada && (
              <span className="font-medium text-muted-foreground">
                {' '}· ditandai {waktuWita(b.ditandaiPada)}
              </span>
            )}
          </p>
          {tahap === 'kurang' && (
            <button
              type="button"
              aria-expanded={lihatKurang}
              onClick={() => setLihatKurang(v => !v)}
              className="mt-0.5 text-xs font-semibold text-red-700 underline underline-offset-2"
            >
              {lihatKurang ? 'Sembunyikan kekurangan' : 'Lihat kekurangan'}
            </button>
          )}
        </div>
        <Meter label="Rencana lengkap" nilai={b.jumlahLengkap} total={b.jumlahSubkegiatan} warna={gaya.isi} />
        <Meter label="Teragenda" nilai={b.jumlahTeragenda} total={b.jumlahSubkegiatan} warna="bg-slate-400" />
        <div className="flex flex-wrap gap-1.5 md:justify-end">
          {!dapatDisunting ? (
            <Button size="sm" variant="outline" onClick={onBuka}>
              Lihat rencana <ArrowRight className="size-3.5" />
            </Button>
          ) : tahap === 'kurang' ? (
            <Button size="sm" variant="outline" onClick={onBuka}>
              Lengkapi rencana <ArrowRight className="size-3.5" />
            </Button>
          ) : tahap === 'menunggu' ? (
            <>
              <Button size="sm" variant="ghost" onClick={onBuka}>
                Tinjau rencana
              </Button>
              <Button size="sm" onClick={onTandaiSiap} disabled={sibuk}>
                <Check className="size-3.5" /> Tandai siap
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={onBuka}>
                Lihat rencana
              </Button>
              <Button size="sm" variant="ghost" onClick={onKembaliKeDraf} disabled={sibuk}>
                <Undo2 className="size-3.5" /> Kembali ke draf
              </Button>
            </>
          )}
        </div>
      </div>

      {tahap === 'kurang' && lihatKurang && (
        <div className="pb-3.5 pl-5 pr-4">
          <div className="space-y-1.5 rounded-lg bg-red-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-red-700">
              Yang perlu diperbaiki sebelum bisa ditandai siap:
            </p>
            <ul className="space-y-1">
              {b.butir.map((teks, i) => {
                const k = pecahButir(teks);
                return (
                  <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 text-xs text-slate-700">
                    {k.kode ? (
                      <span className="tabular font-mono text-[11.5px] text-slate-900">{k.kode}</span>
                    ) : (
                      <span aria-hidden>•</span>
                    )}
                    <span>{k.pesan}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Kesiapan rencana per bidang + gerbang membuka periode.
 *
 * Gerbang diletakkan di atas karena membuka periode adalah keputusan utama layar ini;
 * syaratnya dicerminkan dari `PeriodeController::buka` supaya admin tahu apa yang masih
 * kurang sebelum menekan tombol. Server tetap yang menegakkan.
 *
 * Papan hanya memuat bidang yang SUDAH mendapat pembagian (backend
 * `KesiapanRencanaService::papanPeriode` bersumber dari TRANS_SUBKEGIATAN_BIDANG),
 * jadi untuk periode yang masih kosong tab Penunjukan-lah pintu masuknya.
 */
export function PapanKesiapan({
  periode,
  sumber,
  periodeLainTerbuka = null,
  onPerubahan,
}: {
  periode: Periode;
  /** Periode sebelumnya untuk disalin, bila ada. */
  sumber: Periode | null;
  /** Periode OPEN selain yang ini — menghalangi pembukaan. */
  periodeLainTerbuka?: Periode | null;
  onPerubahan: () => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const [papan, setPapan] = React.useState<KesiapanBidang[] | null>(null);
  const [jumlahBelumDitugaskan, setJumlahBelumDitugaskan] = React.useState(0);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [kabar, setKabar] = React.useState<string | null>(null);
  const [bidangDiubah, setBidangDiubah] = React.useState<number | null>(null);
  const [saring, setSaring] = React.useState<TahapKesiapan | null>(null);
  const [konfirmasiBuka, setKonfirmasiBuka] = React.useState(false);
  const [membuka, setMembuka] = React.useState(false);
  const [salinTerbuka, setSalinTerbuka] = React.useState(false);

  const draf = periode.status === 'DRAFT';

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
    // Hanya peringatan lunak; kegagalannya tidak perlu mengganggu papan.
    getPenunjukan(periode.id)
      .then(p => setJumlahBelumDitugaskan(p.ringkasan.jumlahBelum))
      .catch(() => {});
  }, [muat, periode.id]);

  const totalSub = papan?.reduce((a, b) => a + b.jumlahSubkegiatan, 0) ?? 0;
  const hitung = { kurang: 0, menunggu: 0, siap: 0 };
  papan?.forEach(b => hitung[tahapKesiapan(b)]++);
  const syarat = syaratBukaPeriode(papan ?? [], periodeLainTerbuka);
  const syaratKurang = syarat.filter(s => !s.terpenuhi).length;
  const bisaBuka = draf && papan !== null && syaratKurang === 0;
  const tampil = urutkanKesiapan(papan ?? []).filter(b => !saring || tahapKesiapan(b) === saring);

  async function bukaPeriode() {
    setGalat(null);
    setKabar(null);
    setMembuka(true);
    try {
      await ubahStatusPeriode(periode.id, 'OPEN');
      setKonfirmasiBuka(false);
      setKabar(`${periode.namaPeriode} dibuka. Admin bidang sudah bisa mencatat realisasi.`);
      await onPerubahan();
      await muat();
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal membuka periode.'));
    } finally {
      setMembuka(false);
    }
  }

  async function ubahKesiapan(b: KesiapanBidang, status: 'SIAP' | 'DRAFT') {
    setBidangDiubah(b.bidangId);
    setGalat(null);
    setKabar(null);
    try {
      await tandaiKesiapan(b.bidangId, periode.id, status);
      setKabar(
        status === 'SIAP'
          ? `${b.namaBidang} ditandai siap.`
          : `${b.namaBidang} dikembalikan ke draf.`,
      );
      await muat();
    } catch (e) {
      setGalat(
        apiMessage(
          e,
          status === 'SIAP' ? 'Gagal menandai bidang siap.' : 'Gagal mengembalikan bidang ke draf.',
        ),
      );
      await muat();
    } finally {
      setBidangDiubah(null);
    }
  }

  return (
    <div className="space-y-4">
      {sumber && papan !== null && totalSub === 0 && draf && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900">
          <Info className="size-4 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1 basis-72">
            <b>Periode ini masih kosong.</b> Salin dari {sumber.namaPeriode}{' '}
            supaya tidak perlu mengetik ulang, lalu sesuaikan target yang
            berubah.
          </div>
          <Button size="sm" onClick={() => setSalinTerbuka(true)}>
            <Copy className="size-3.5" /> Salin dari {sumber.namaPeriode}
          </Button>
        </div>
      )}

      {galat && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{galat}</p>}
      {kabar && (
        <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {kabar}
        </p>
      )}

      {/* Gerbang pembukaan periode */}
      <section
        aria-label="Pembukaan periode"
        className="grid overflow-hidden rounded-xl border bg-card shadow-sm lg:grid-cols-[minmax(0,1fr)_19rem]"
      >
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold">{periode.namaPeriode}</h3>
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                draf
                  ? 'bg-amber-50 text-amber-700'
                  : periode.status === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600',
              )}
            >
              {draf ? 'Draf' : periode.status === 'OPEN' ? 'Terbuka' : 'Terkunci'}
            </span>
          </div>

          {draf ? (
            <ul className="space-y-2.5">
              {syarat.map(s => (
                <li key={s.kunci} className="grid grid-cols-[1.375rem_minmax(0,1fr)_auto] items-start gap-2.5">
                  <span
                    className={cn(
                      'grid size-5.5 place-items-center rounded-full',
                      s.terpenuhi ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                    )}
                    aria-label={s.terpenuhi ? 'Terpenuhi' : 'Belum terpenuhi'}
                  >
                    {s.terpenuhi ? <Check className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{s.judul}</p>
                    <p className="text-xs text-muted-foreground">{s.keterangan}</p>
                  </div>
                  {s.hitungan && (
                    <span className="tabular whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {s.hitungan}
                    </span>
                  )}
                </li>
              ))}
              {jumlahBelumDitugaskan > 0 && (
                <li className="grid grid-cols-[1.375rem_minmax(0,1fr)] items-start gap-2.5">
                  <Info className="mx-auto mt-0.5 size-4 text-slate-400" />
                  <p className="text-xs text-muted-foreground">
                    {jumlahBelumDitugaskan} subkegiatan belum ditugaskan ke bidang mana pun dan tidak
                    akan ikut dipantau di periode ini. Ini tidak menghalangi pembukaan.
                  </p>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {periode.status === 'OPEN'
                ? 'Periode sudah dibuka dan admin bidang sedang mencatat realisasi. Rencana sudah dibekukan, jadi papan ini hanya untuk dilihat.'
                : 'Periode sudah dikunci. Papan ini hanya untuk dilihat.'}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2.5 border-t bg-muted/40 p-4 lg:border-l lg:border-t-0">
          {!draf ? (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              Status kesiapan tidak bisa diubah setelah periode dibuka.
            </p>
          ) : konfirmasiBuka ? (
            <>
              <p className="text-xs text-slate-700">
                <b>Buka {periode.namaPeriode}?</b> Admin bidang bisa mulai mencatat realisasi.
                Target dan aktivitas tidak bisa diubah lagi setelah periode dibuka.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void bukaPeriode()} disabled={membuka}>
                  {membuka ? 'Membuka…' : 'Ya, buka periode'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setKonfirmasiBuka(false)} disabled={membuka}>
                  Batal
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button disabled={!bisaBuka} onClick={() => setKonfirmasiBuka(true)}>
                Buka periode untuk pencatatan
              </Button>
              <p className="text-xs text-muted-foreground">
                {papan === null
                  ? 'Memeriksa syarat…'
                  : bisaBuka
                    ? 'Semua syarat terpenuhi.'
                    : `${syaratKurang} syarat belum terpenuhi.`}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Tahap */}
      <div role="group" aria-label="Saring menurut tahap" className="grid gap-2.5 sm:grid-cols-3">
        {(Object.keys(TAHAP) as TahapKesiapan[]).map(k => {
          const aktif = saring === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={aktif}
              onClick={() => setSaring(aktif ? null : k)}
              className={cn(
                'grid gap-0.5 rounded-xl border bg-card px-3.5 py-3 text-left shadow-sm transition-colors hover:border-slate-400',
                aktif && 'border-slate-900 ring-1 ring-slate-900',
              )}
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className={cn('size-2 rounded-full', TAHAP[k].titik)} />
                {TAHAP[k].label}
              </span>
              <span className="tabular text-2xl font-bold leading-tight">{papan ? hitung[k] : '–'}</span>
              <span className="text-xs text-muted-foreground">{TAHAP[k].keterangan}</span>
            </button>
          );
        })}
      </div>

      {/* Daftar bidang */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 text-xs text-muted-foreground">
        <span>
          {saring ? (
            <>
              <b className="text-foreground">{tampil.length}</b> bidang ·{' '}
              <button
                type="button"
                className="font-semibold text-emerald-700 hover:underline"
                onClick={() => setSaring(null)}
              >
                tampilkan semua {papan?.length ?? 0}
              </button>
            </>
          ) : (
            <>
              <b className="text-foreground">{papan?.length ?? 0}</b> bidang · {totalSub} subkegiatan
            </>
          )}
        </span>
        <span>Yang perlu ditindaklanjuti di atas</span>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {papan === null && (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        )}
        {papan?.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Belum ada bidang yang mendapat pembagian rencana pada periode ini. Mulai dari tab{' '}
            <b>Penunjukan</b>.
          </p>
        )}
        {papan !== null && papan.length > 0 && !tampil.length && (
          <p className="px-4 py-6 text-sm text-muted-foreground">Tidak ada bidang pada tahap ini.</p>
        )}
        {tampil.map(b => (
          <BarisBidang
            key={b.bidangId}
            b={b}
            dapatDisunting={draf}
            sibuk={bidangDiubah === b.bidangId}
            onBuka={() => navigate(`/rencana/${b.bidangId}?periode=${periode.id}`)}
            onTandaiSiap={() => void ubahKesiapan(b, 'SIAP')}
            onKembaliKeDraf={() => void ubahKesiapan(b, 'DRAFT')}
          />
        ))}
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        Agenda kalender tidak menghalangi pembukaan periode, dan tetap bisa diisi setelah periode dibuka.
      </p>

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
