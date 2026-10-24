import * as React from 'react';
import { ChevronRight, Copy, Info, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow, Kode } from '@/components/opera/primitives';
import { SearchInput } from '@/components/opera/search-input';
import {
  cabutSubkegiatanDariRencana,
  getBidang,
  getPenunjukan,
  pindahBidangSubkegiatan,
  tugaskanSubkegiatan,
} from '@/services';
import { apiMessage } from '@/services/api';
import type { Bidang, BarisPenunjukan, PenunjukanPeriode, Periode } from '@/services';
import {
  aksiPenunjukan,
  alasanTerkunci,
  bidangGrup,
  ratakan,
  rencanaAksiKegiatan,
  type RencanaAksiKegiatan,
} from '@/lib/aksi-penunjukan';
import { cn } from '@/lib/utils';
import { teksSatuanKinerja } from '@/lib/metadata-kinerja';
import { warnaBidang } from '@/lib/warna-bidang';
import { DialogSalinRencana } from './DialogSalinRencana';

const KELAS_SELECT =
  'h-9 w-full rounded-lg border border-input bg-background pl-7 pr-2 text-[13px] font-medium focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

type Saringan = 'semua' | 'belum' | 'sudah';

/** Perubahan terakhir yang bisa diurungkan: bidang tiap baris sebelum diubah. */
interface Jejak {
  pesan: string;
  sebelum: { subkegiatanId: number; bidangId: number | null }[];
}

/** `""` = belum ditugaskan, `"campuran"` = anak kegiatan berbeda bidang. */
function PilihBidang({
  nilai,
  bidang,
  aktif,
  judul,
  label,
  campuran,
  onPilih,
  className,
}: {
  nilai: number | null;
  bidang: Bidang[];
  aktif: boolean;
  judul?: string;
  label: string;
  campuran?: boolean;
  onPilih: (bidangId: number | null) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-2.5 top-1/2 size-2.5 -translate-y-1/2 rounded-[3px]',
          campuran
            ? 'bg-amber-500'
            : nilai !== null
              ? warnaBidang(bidang, nilai)
              : 'border border-dashed border-slate-400',
        )}
      />
      <select
        className={cn(KELAS_SELECT, nilai === null && !campuran && 'border-dashed text-muted-foreground')}
        value={campuran ? 'campuran' : (nilai ?? '')}
        disabled={!aktif}
        title={judul}
        aria-label={label}
        onChange={e => onPilih(e.target.value === '' ? null : Number(e.target.value))}
      >
        {campuran && (
          <option value="campuran" disabled>
            Campuran
          </option>
        )}
        <option value="">— belum ditugaskan —</option>
        {bidang.map(b => (
          <option key={b.id} value={b.id}>
            {b.namaBidang}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Penunjukan bidang: memetakan katalog subkegiatan ke bidang penanggung jawab
 * untuk satu periode DRAFT.
 *
 * Aksi utamanya ada di baris KEGIATAN, dan subkegiatan disembunyikan sampai
 * kegiatannya dibuka. Di katalog resmi seluruh subkegiatan dalam satu kegiatan
 * selalu dipegang bidang yang sama (0 dari 20 kegiatan campur), jadi 20 pilihan
 * cukup untuk memetakan 78 subkegiatan. Kegiatan yang isinya campuran selalu
 * terbuka supaya perbedaannya terlihat.
 *
 * Sengaja TIDAK ada aksi setara di header program: 2 dari 5 program memang lintas
 * bidang, jadi tombol itu justru akan menyeragamkan yang seharusnya berbeda.
 */
export function PanelPenunjukan({
  periode,
  sumber,
  onPerubahan,
}: {
  periode: Periode;
  sumber: Periode | null;
  onPerubahan: () => void | Promise<void>;
}) {
  const [data, setData] = React.useState<PenunjukanPeriode | null>(null);
  const [bidang, setBidang] = React.useState<Bidang[]>([]);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [catatan, setCatatan] = React.useState<string | null>(null);
  const [jejak, setJejak] = React.useState<Jejak | null>(null);
  const [sibuk, setSibuk] = React.useState(false);
  const [cari, setCari] = React.useState('');
  const [saring, setSaring] = React.useState<Saringan>('semua');
  const [saringBidang, setSaringBidang] = React.useState<number | null>(null);
  const [terbuka, setTerbuka] = React.useState<Set<string>>(new Set());
  const [terpilih, setTerpilih] = React.useState<Set<number>>(new Set());
  const [bidangMassal, setBidangMassal] = React.useState<number | null>(null);
  const [salinTerbuka, setSalinTerbuka] = React.useState(false);

  const dapatDisunting = periode.status === 'DRAFT';

  const muat = React.useCallback(async () => {
    try {
      const baru = await getPenunjukan(periode.id);
      setData(baru);
      return baru;
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal memuat data penunjukan.'));
      return null;
    }
  }, [periode.id]);

  React.useEffect(() => {
    setData(null);
    setTerpilih(new Set());
    setJejak(null);
    void muat();
  }, [muat]);

  React.useEffect(() => {
    getBidang()
      .then(setBidang)
      .catch(e => setGalat(apiMessage(e, 'Gagal memuat daftar bidang.')));
  }, []);

  const semua = React.useMemo(() => (data ? ratakan(data.program) : []), [data]);
  const namaBidang = (id: number) => bidang.find(b => b.id === id)?.namaBidang ?? `Bidang #${id}`;

  /** Beban dihitung dari baris, bukan dari ringkasan, supaya bidang tanpa tugas tetap tampil. */
  const beban = React.useMemo(
    () =>
      bidang.map(b => {
        const milik = semua.filter(s => s.bidangId === b.id);
        const kegiatan = new Set(
          data?.program.flatMap(p =>
            p.kegiatan.filter(k => k.subkegiatan.some(s => s.bidangId === b.id)).map(k => k.kode),
          ),
        );
        return { ...b, jumlah: milik.length, jumlahKegiatan: kegiatan.size };
      }),
    [bidang, semua, data],
  );
  const jumlahBelum = semua.filter(s => s.bidangId === null).length;
  const bebanMaks = Math.max(1, ...beban.map(b => b.jumlah));

  // Saring dulu, baru buang kegiatan/program yang jadi kosong — supaya heading
  // tidak menggantung tanpa isi.
  const program = React.useMemo(() => {
    if (!data) return [];
    const kata = cari.trim().toLowerCase();
    const cocok = (b: BarisPenunjukan) =>
      (saring === 'semua' || (saring === 'belum' ? b.bidangId === null : b.bidangId !== null)) &&
      (saringBidang === null || b.bidangId === saringBidang) &&
      (!kata || b.kode.toLowerCase().includes(kata) || b.nama.toLowerCase().includes(kata));

    return data.program
      .map(p => ({
        ...p,
        kegiatan: p.kegiatan
          .map(k => ({ ...k, semua: k.subkegiatan, subkegiatan: k.subkegiatan.filter(cocok) }))
          .filter(k => k.subkegiatan.length),
      }))
      .filter(p => p.kegiatan.length);
  }, [data, cari, saring, saringBidang]);

  const terlihat = React.useMemo(() => ratakan(program), [program]);
  const dipilih = React.useMemo(
    () => terlihat.filter(b => terpilih.has(b.subkegiatanId)),
    [terlihat, terpilih],
  );

  async function eksekusi(rencana: RencanaAksiKegiatan, tujuan: number | null) {
    if (rencana.tugaskanIds.length && tujuan !== null) {
      await tugaskanSubkegiatan({
        bidangId: tujuan,
        periodeId: periode.id,
        subkegiatanIds: rencana.tugaskanIds,
      });
    }
    for (const rencanaId of rencana.pindahIds) {
      if (tujuan !== null) await pindahBidangSubkegiatan(rencanaId, tujuan);
    }
    for (const rencanaId of rencana.cabutIds) {
      await cabutSubkegiatanDariRencana(rencanaId);
    }
  }

  const kosong = (r: RencanaAksiKegiatan) =>
    !r.tugaskanIds.length && !r.pindahIds.length && !r.cabutIds.length;

  /** Jalankan satu rencana aksi: satu POST bulk + PATCH/DELETE per baris. */
  async function jalankan(rows: BarisPenunjukan[], tujuan: number | null) {
    if (!dapatDisunting || sibuk) return;
    const rencana = rencanaAksiKegiatan(rows, tujuan);
    const pesanDilewati = rencana.dilewati.length
      ? `${rencana.dilewati.length} subkegiatan dilewati: ${rencana.dilewati[0].alasan}`
      : null;
    if (kosong(rencana)) {
      setCatatan(pesanDilewati);
      return;
    }

    const disentuh = rows.filter(
      b => aksiPenunjukan(b, tujuan) !== 'noop' && !alasanTerkunci(b),
    );
    const subjek =
      disentuh.length === 1 ? disentuh[0].kode : `${disentuh.length} subkegiatan`;

    setSibuk(true);
    setGalat(null);
    setCatatan(null);
    setJejak(null);
    try {
      await eksekusi(rencana, tujuan);
      setCatatan(pesanDilewati);
      setJejak({
        pesan:
          tujuan === null
            ? `Penugasan ${subjek} dilepas.`
            : `${subjek} ditugaskan ke ${namaBidang(tujuan)}.`,
        sebelum: disentuh.map(b => ({ subkegiatanId: b.subkegiatanId, bidangId: b.bidangId })),
      });
      setTerpilih(new Set());
      await muat();
      await onPerubahan();
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal menyimpan penunjukan.'));
      await muat();
    } finally {
      setSibuk(false);
    }
  }

  /** Kembalikan tiap baris ke bidang sebelumnya, dikelompokkan per bidang asal. */
  async function urungkan() {
    if (!jejak || !data || sibuk) return;
    const peta = new Map(semua.map(b => [b.subkegiatanId, b]));
    const perTujuan = new Map<number | null, BarisPenunjukan[]>();
    for (const s of jejak.sebelum) {
      const b = peta.get(s.subkegiatanId);
      if (b) perTujuan.set(s.bidangId, [...(perTujuan.get(s.bidangId) ?? []), b]);
    }

    setSibuk(true);
    setGalat(null);
    try {
      for (const [tujuan, rows] of perTujuan) {
        const rencana = rencanaAksiKegiatan(rows, tujuan);
        if (!kosong(rencana)) await eksekusi(rencana, tujuan);
      }
      setJejak(null);
      setCatatan(null);
      await muat();
      await onPerubahan();
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal mengurungkan perubahan.'));
      await muat();
    } finally {
      setSibuk(false);
    }
  }

  const alihBuka = (kode: string) =>
    setTerbuka(s => {
      const baru = new Set(s);
      if (baru.has(kode)) baru.delete(kode);
      else baru.add(kode);
      return baru;
    });
  const semuaKodeKegiatan = data?.program.flatMap(p => p.kegiatan.map(k => k.kode)) ?? [];

  const ringkasan = data?.ringkasan;
  const adaSaringan = saring !== 'semua' || saringBidang !== null || !!cari.trim();

  const panelBeban = (
    <div className="rounded-xl border bg-card p-3.5 shadow-sm">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <Eyebrow>Beban per bidang</Eyebrow>
        {saringBidang !== null && (
          <button
            type="button"
            className="text-xs font-semibold text-emerald-700 hover:underline"
            onClick={() => setSaringBidang(null)}
          >
            Tampilkan semua
          </button>
        )}
      </div>
      <div className="grid gap-1">
        {beban.map(b => {
          const aktif = saringBidang === b.id;
          return (
            <button
              key={b.id}
              type="button"
              aria-pressed={aktif}
              aria-label={`Saring bidang ${b.namaBidang}`}
              onClick={() => setSaringBidang(aktif ? null : b.id)}
              className={cn(
                'grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted',
                aktif && 'bg-muted ring-1 ring-slate-300',
              )}
            >
              <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
                <span className={cn('size-2.5 shrink-0 rounded-[3px]', warnaBidang(bidang, b.id))} />
                <span className="truncate">{b.namaBidang}</span>
              </span>
              <span className="tabular text-xs text-muted-foreground">
                <b className="text-foreground">{b.jumlah}</b> subkeg · {b.jumlahKegiatan} keg
              </span>
              <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn('block h-full rounded-full transition-[width]', warnaBidang(bidang, b.id))}
                  style={{ width: `${(b.jumlah / bebanMaks) * 100}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Nama unit mengikuti sheet <b>OPERA INK</b> pada workbook sumber.
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {!dapatDisunting && (
        <div className="flex gap-2.5 rounded-xl border bg-slate-50 px-3.5 py-3 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <div>
            <b>Penunjukan terkunci.</b> Pembagian bidang hanya dapat diubah saat
            periode berstatus DRAFT — periode ini sudah{' '}
            {periode.status === 'OPEN' ? 'dibuka' : 'terkunci'}.
          </div>
        </div>
      )}

      {dapatDisunting && sumber && ringkasan?.jumlahDitugaskan === 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900">
          <Info className="size-4 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1 basis-72">
            <b>Periode ini masih kosong.</b> Untuk periode rutin, salin pembagian
            bidang dari {sumber.namaPeriode} lalu sesuaikan yang berubah —
            penunjukan manual hanya perlu untuk periode pertama atau saat
            struktur organisasi berubah.
          </div>
          <Button size="sm" onClick={() => setSalinTerbuka(true)}>
            <Copy className="size-3.5" /> Salin dari {sumber.namaPeriode}
          </Button>
        </div>
      )}

      {galat && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{galat}</p>
      )}
      {catatan && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{catatan}</p>
      )}

      {/* Progres: satu segmen per bidang, sisanya belum ditugaskan */}
      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <Eyebrow>Progres penunjukan</Eyebrow>
          <span className="ml-auto flex items-baseline gap-1.5 text-sm text-muted-foreground">
            {ringkasan ? (
              <>
                <b className="tabular text-2xl font-bold leading-none text-foreground">
                  {ringkasan.jumlahDitugaskan}
                </b>
                dari <b className="tabular text-foreground">{ringkasan.jumlahSubkegiatan}</b>{' '}
                subkegiatan sudah ditugaskan
              </>
            ) : (
              '…'
            )}
          </span>
        </div>
        <div
          className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`${ringkasan?.jumlahDitugaskan ?? 0} dari ${ringkasan?.jumlahSubkegiatan ?? 0} subkegiatan sudah ditugaskan`}
        >
          {beban
            .filter(b => b.jumlah)
            .map(b => (
              <span
                key={b.id}
                title={`${b.namaBidang}: ${b.jumlah}`}
                className={cn('h-full transition-[flex-grow]', warnaBidang(bidang, b.id))}
                style={{ flexGrow: b.jumlah }}
              />
            ))}
          {jumlahBelum > 0 && <span className="h-full" style={{ flexGrow: jumlahBelum }} />}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {beban
            .filter(b => b.jumlah)
            .map(b => (
              <span key={b.id} className="inline-flex items-center gap-1.5">
                <span className={cn('size-2 rounded-[2px]', warnaBidang(bidang, b.id))} />
                {b.namaBidang} <b className="tabular text-foreground">{b.jumlah}</b>
              </span>
            ))}
          {jumlahBelum > 0 && (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <span className="size-2 rounded-[2px] border border-dashed border-amber-600" />
              belum ditugaskan <b className="tabular">{jumlahBelum}</b>
            </span>
          )}
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <aside className="xl:sticky xl:top-4 xl:order-2">{panelBeban}</aside>

        <div className="min-w-0 space-y-4 xl:order-1">
          {/* Saringan */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Status penugasan"
              className="inline-flex gap-0.5 rounded-lg border bg-card p-0.5"
            >
              {(
                [
                  ['semua', 'Semua', semua.length],
                  ['belum', 'Belum ditugaskan', jumlahBelum],
                  ['sudah', 'Sudah ditugaskan', semua.length - jumlahBelum],
                ] as const
              ).map(([k, label, n]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={saring === k}
                  onClick={() => setSaring(k)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors',
                    saring === k
                      ? 'bg-slate-900 text-white'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                  <span aria-hidden className="tabular text-[11px] opacity-70">
                    {n}
                  </span>
                </button>
              ))}
            </div>
            <SearchInput
              className="min-w-0 flex-1 basis-56"
              placeholder="Cari kode atau nama…"
              aria-label="Cari penugasan subkegiatan"
              value={cari}
              onValueChange={setCari}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setTerbuka(terbuka.size ? new Set() : new Set(semuaKodeKegiatan))
              }
            >
              {terbuka.size ? 'Tutup semua' : 'Buka semua'}
            </Button>
          </div>

          {/* Daftar */}
          {data === null && <Skeleton className="h-64" />}

          {data !== null && !program.length && (
            <div className="rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
              Tidak ada subkegiatan yang cocok dengan saringan ini.{' '}
              {adaSaringan && (
                <button
                  type="button"
                  className="font-semibold text-emerald-700 hover:underline"
                  onClick={() => {
                    setSaring('semua');
                    setSaringBidang(null);
                    setCari('');
                  }}
                >
                  Hapus saringan
                </button>
              )}
            </div>
          )}

          <div className="space-y-5">
            {program.map(p => {
              const bidangProgram = [
                ...new Set(
                  p.kegiatan.flatMap(k =>
                    k.semua.map(s => s.bidangId).filter((x): x is number => x !== null),
                  ),
                ),
              ];
              return (
                <section key={p.kode} className="space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-1">
                    <Kode>{p.kode}</Kode>
                    <h3 className="min-w-0 flex-1 text-sm font-bold">{p.nama}</h3>
                    {bidangProgram.length > 1 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {bidangProgram.map(id => (
                          <span
                            key={id}
                            title={namaBidang(id)}
                            className={cn('size-2 rounded-[2px]', warnaBidang(bidang, id))}
                          />
                        ))}
                        {bidangProgram.length} bidang
                      </span>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    {p.kegiatan.map(k => {
                      const grup = bidangGrup(k.semua);
                      const campuran = grup === 'campuran';
                      const buka = terbuka.has(k.kode) || campuran || !!cari.trim();
                      const jumlahTerkunci = k.semua.filter(s => alasanTerkunci(s)).length;
                      return (
                        <div key={k.kode} className="relative border-b last:border-b-0">
                          <span
                            aria-hidden
                            className={cn(
                              'absolute inset-y-0 left-0 w-1',
                              campuran
                                ? 'bg-amber-500'
                                : grup !== null
                                  ? warnaBidang(bidang, grup)
                                  : 'bg-transparent',
                            )}
                          />
                          <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-3 pl-3 pr-4 md:grid-cols-[1.5rem_minmax(0,1fr)_auto_14rem]">
                            <button
                              type="button"
                              aria-expanded={buka}
                              aria-label={`${buka ? 'Tutup' : 'Buka'} subkegiatan ${k.kode}`}
                              onClick={() => alihBuka(k.kode)}
                              disabled={campuran || !!cari.trim()}
                              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                            >
                              <ChevronRight
                                className={cn('size-4 transition-transform', buka && 'rotate-90')}
                              />
                            </button>
                            <div className="min-w-0">
                              <Kode>{k.kode}</Kode>
                              <p className="text-[13.5px] font-semibold leading-snug">{k.nama}</p>
                            </div>
                            <div className="col-start-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground md:col-start-auto md:flex-col md:items-end md:gap-0.5">
                              <span className="tabular">{k.semua.length} subkeg</span>
                              {campuran ? (
                                <span className="font-semibold text-amber-700">
                                  Terbagi ke beberapa bidang
                                </span>
                              ) : grup === null ? (
                                <span className="text-amber-700">Belum ditugaskan</span>
                              ) : null}
                              {jumlahTerkunci > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Lock className="size-3" /> {jumlahTerkunci} terkunci
                                </span>
                              )}
                            </div>
                            <PilihBidang
                              nilai={campuran ? null : (grup as number | null)}
                              campuran={campuran}
                              bidang={bidang}
                              aktif={dapatDisunting && !sibuk}
                              label={`Bidang untuk kegiatan ${k.kode}`}
                              judul="Menugaskan seluruh subkegiatan kegiatan ini sekaligus"
                              onPilih={t => void jalankan(k.semua, t)}
                              className="col-start-2 md:col-start-auto"
                            />
                          </div>

                          {buka && (
                            <div className="divide-y border-t bg-muted/30">
                              {k.subkegiatan.map(b => {
                                const terkunci = alasanTerkunci(b);
                                return (
                                  <div
                                    key={b.subkegiatanId}
                                    className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-2.5 pl-3 pr-4 md:grid-cols-[1.5rem_minmax(0,1fr)_12.5rem] md:pl-12"
                                  >
                                    <Checkbox
                                      className="justify-self-center"
                                      checked={terpilih.has(b.subkegiatanId)}
                                      disabled={!dapatDisunting || !!terkunci}
                                      aria-label={`Pilih ${b.kode}`}
                                      onCheckedChange={v =>
                                        setTerpilih(s => {
                                          const baru = new Set(s);
                                          if (v === true) baru.add(b.subkegiatanId);
                                          else baru.delete(b.subkegiatanId);
                                          return baru;
                                        })
                                      }
                                    />
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <Kode>{b.kode}</Kode>
                                        {!b.flagActive && (
                                          <span className="rounded bg-slate-100 px-1 font-mono text-[10px] text-slate-500">
                                            nonaktif
                                          </span>
                                        )}
                                        {terkunci && (
                                          <span
                                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 text-[10.5px] font-medium text-slate-600"
                                            title={terkunci}
                                          >
                                            <Lock className="size-2.5" />
                                            {b.adaRealisasi ? 'ada realisasi' : 'katalog belum lengkap'}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[13px] font-medium leading-snug">{b.nama}</p>
                                      <p className="break-words text-xs text-muted-foreground">
                                        {b.indikatorKinerja || '—'}
                                        {b.targetAnjuran !== null && (
                                          <>
                                            {' · target '}
                                            <span className="tabular font-mono">
                                              {b.targetAnjuran.toLocaleString('id-ID')}
                                            </span>
                                            {' · '}
                                            {teksSatuanKinerja(b.satuan)}
                                          </>
                                        )}
                                        {` · ${b.jumlahAktifitasUtama} utama, ${b.jumlahAktifitasPendukung} pendukung`}
                                      </p>
                                    </div>
                                    <PilihBidang
                                      nilai={b.bidangId}
                                      bidang={bidang}
                                      aktif={dapatDisunting && !sibuk && !terkunci}
                                      judul={terkunci ?? undefined}
                                      label={`Bidang untuk ${b.kode}`}
                                      onPilih={t => void jalankan([b], t)}
                                      className="col-start-2 md:col-start-auto"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bar aksi massal lintas kegiatan */}
      {dapatDisunting && dipilih.length > 0 && (
        <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-2.5 text-white shadow-lg">
          <span className="text-sm">
            <b>{dipilih.length}</b> subkegiatan terpilih
          </span>
          <Button
            size="xs"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setTerpilih(new Set())}
          >
            Bersihkan
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300">Tugaskan ke</span>
            <select
              className="h-8 w-52 rounded-md border-0 bg-white px-2 text-xs text-slate-900 focus-visible:ring-3 focus-visible:ring-emerald-400/60 focus-visible:outline-none"
              value={bidangMassal ?? ''}
              aria-label="Bidang tujuan untuk subkegiatan terpilih"
              onChange={e => setBidangMassal(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">— pilih bidang —</option>
              {bidang.map(b => (
                <option key={b.id} value={b.id}>
                  {b.namaBidang}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={bidangMassal === null || sibuk}
              onClick={() => void jalankan(dipilih, bidangMassal)}
            >
              {sibuk ? 'Menyimpan…' : 'Terapkan'}
            </Button>
          </div>
        </div>
      )}

      {/* Konfirmasi perubahan terakhir, dengan jalan kembali */}
      {jejak && !dipilih.length && (
        <div
          role="status"
          className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg"
        >
          <span className="min-w-0 flex-1">{jejak.pesan}</span>
          <button
            type="button"
            disabled={sibuk}
            onClick={() => void urungkan()}
            className="font-semibold text-emerald-300 hover:underline disabled:opacity-50"
          >
            Urungkan
          </button>
          <button
            type="button"
            aria-label="Tutup pemberitahuan"
            onClick={() => setJejak(null)}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {sumber && (
        <DialogSalinRencana
          terbuka={salinTerbuka}
          onTutup={() => setSalinTerbuka(false)}
          sumber={sumber}
          tujuan={periode}
          adaIsi={(ringkasan?.jumlahDitugaskan ?? 0) > 0}
          onSelesai={async () => {
            setJejak(null);
            await muat();
            await onPerubahan();
          }}
        />
      )}
    </div>
  );
}
