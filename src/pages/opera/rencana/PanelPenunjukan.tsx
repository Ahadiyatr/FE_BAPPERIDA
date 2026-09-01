import * as React from 'react';
import { Copy, Info, Lock, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow, Kode } from '@/components/opera/primitives';
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
  alasanTerkunci,
  bidangGrup,
  ratakan,
  rencanaAksiKegiatan,
} from '@/lib/aksi-penunjukan';
import { cn } from '@/lib/utils';
import { DialogSalinRencana } from './DialogSalinRencana';

const KELAS_SELECT =
  'h-8 rounded-md border border-input bg-transparent px-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

/** `""` = belum ditugaskan, `"campuran"` = anak kegiatan berbeda bidang. */
function PilihBidang({
  nilai,
  bidang,
  aktif,
  judul,
  campuran,
  onPilih,
  className,
}: {
  nilai: number | null;
  bidang: Bidang[];
  aktif: boolean;
  judul?: string;
  campuran?: boolean;
  onPilih: (bidangId: number | null) => void;
  className?: string;
}) {
  return (
    <select
      className={cn(KELAS_SELECT, className)}
      value={campuran ? 'campuran' : (nilai ?? '')}
      disabled={!aktif}
      title={judul}
      onChange={e =>
        onPilih(e.target.value === '' ? null : Number(e.target.value))
      }
    >
      {campuran && (
        <option value="campuran" disabled>
          — Campuran —
        </option>
      )}
      <option value="">— belum ditugaskan —</option>
      {bidang.map(b => (
        <option key={b.id} value={b.id}>
          {b.namaBidang}
        </option>
      ))}
    </select>
  );
}

/**
 * Penunjukan bidang: memetakan katalog subkegiatan ke bidang penanggung jawab
 * untuk satu periode DRAFT.
 *
 * Aksi utamanya ada di header KEGIATAN, bukan per baris. Di katalog resmi seluruh
 * subkegiatan dalam satu kegiatan selalu dipegang bidang yang sama (0 dari 20
 * kegiatan campur), jadi 20 pilihan cukup untuk memetakan 78 subkegiatan. Pemilih
 * per baris tetap ada untuk penyetelan halus.
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
  const [sibuk, setSibuk] = React.useState(false);
  const [cari, setCari] = React.useState('');
  const [saring, setSaring] = React.useState<number | 'semua' | 'belum'>('semua');
  const [terpilih, setTerpilih] = React.useState<Set<number>>(new Set());
  const [bidangMassal, setBidangMassal] = React.useState<number | null>(null);
  const [salinTerbuka, setSalinTerbuka] = React.useState(false);

  const dapatDisunting = periode.status === 'DRAFT';

  const muat = React.useCallback(async () => {
    try {
      setData(await getPenunjukan(periode.id));
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal memuat data penunjukan.'));
    }
  }, [periode.id]);

  React.useEffect(() => {
    setData(null);
    setTerpilih(new Set());
    void muat();
  }, [muat]);

  React.useEffect(() => {
    getBidang()
      .then(setBidang)
      .catch(e => setGalat(apiMessage(e, 'Gagal memuat daftar bidang.')));
  }, []);

  // Saring dulu, baru buang kegiatan/program yang jadi kosong — supaya heading
  // tidak menggantung tanpa isi.
  const program = React.useMemo(() => {
    if (!data) return [];
    const kata = cari.trim().toLowerCase();
    const cocok = (b: BarisPenunjukan) =>
      (saring === 'semua' ||
        (saring === 'belum' ? b.bidangId === null : b.bidangId === saring)) &&
      (!kata ||
        b.kode.toLowerCase().includes(kata) ||
        b.nama.toLowerCase().includes(kata));

    return data.program
      .map(p => ({
        ...p,
        kegiatan: p.kegiatan
          .map(k => ({ ...k, subkegiatan: k.subkegiatan.filter(cocok) }))
          .filter(k => k.subkegiatan.length),
      }))
      .filter(p => p.kegiatan.length);
  }, [data, cari, saring]);

  const terlihat = React.useMemo(() => ratakan(program), [program]);
  const dipilih = React.useMemo(
    () => terlihat.filter(b => terpilih.has(b.subkegiatanId)),
    [terlihat, terpilih],
  );

  /** Jalankan satu rencana aksi: satu POST bulk + PATCH/DELETE per baris. */
  async function jalankan(rows: BarisPenunjukan[], tujuan: number | null) {
    if (!dapatDisunting || sibuk) return;
    const rencana = rencanaAksiKegiatan(rows, tujuan);
    if (
      !rencana.tugaskanIds.length &&
      !rencana.pindahIds.length &&
      !rencana.cabutIds.length
    ) {
      setCatatan(
        rencana.dilewati.length
          ? `${rencana.dilewati.length} subkegiatan dilewati: ${rencana.dilewati[0].alasan}`
          : null,
      );
      return;
    }

    setSibuk(true);
    setGalat(null);
    setCatatan(null);
    try {
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
      if (rencana.dilewati.length) {
        setCatatan(
          `${rencana.dilewati.length} subkegiatan dilewati: ${rencana.dilewati[0].alasan}`,
        );
      }
      setTerpilih(new Set());
      await muat();
      await onPerubahan();
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal menyimpan penunjukan.'));
    } finally {
      setSibuk(false);
    }
  }

  const ringkasan = data?.ringkasan;

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
        <div className="flex gap-2.5 rounded-xl border bg-card px-3.5 py-3 text-sm shadow-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <b>Periode ini masih kosong.</b> Untuk periode rutin, salin pembagian
            bidang dari {sumber.namaPeriode} lalu sesuaikan yang berubah —
            penunjukan manual hanya perlu untuk periode pertama atau saat
            struktur organisasi berubah.
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

      {galat && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {galat}
        </p>
      )}
      {catatan && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {catatan}
        </p>
      )}

      {/* Progres + beban per bidang */}
      <div className="space-y-2.5 rounded-xl border bg-card p-3.5 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-2">
          <Eyebrow>Progres penunjukan</Eyebrow>
          <span className="tabular ml-auto font-mono text-xs text-muted-foreground">
            {ringkasan ? (
              <>
                <b className="text-foreground">{ringkasan.jumlahDitugaskan}</b>{' '}
                dari{' '}
                <b className="text-foreground">{ringkasan.jumlahSubkegiatan}</b>{' '}
                subkegiatan sudah ditugaskan
              </>
            ) : (
              '…'
            )}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width]"
            style={{
              width: ringkasan?.jumlahSubkegiatan
                ? `${(ringkasan.jumlahDitugaskan / ringkasan.jumlahSubkegiatan) * 100}%`
                : '0%',
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ringkasan?.perBidang.map(b => (
            <span
              key={b.bidangId}
              className="rounded-xl bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {b.namaBidang} <b className="text-foreground">{b.jumlah}</b>
            </span>
          ))}
          {!!ringkasan?.jumlahBelum && (
            <span className="rounded-xl bg-amber-50 px-2 py-0.5 font-mono text-[11px] text-amber-700">
              belum ditugaskan <b>{ringkasan.jumlahBelum}</b>
            </span>
          )}
        </div>
      </div>

      {/* Saringan */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="xs"
          variant={saring === 'semua' ? 'secondary' : 'ghost'}
          onClick={() => setSaring('semua')}
        >
          Semua
        </Button>
        <Button
          size="xs"
          variant={saring === 'belum' ? 'secondary' : 'ghost'}
          onClick={() => setSaring('belum')}
        >
          Belum ditugaskan
        </Button>
        {bidang.map(b => (
          <Button
            key={b.id}
            size="xs"
            variant={saring === b.id ? 'secondary' : 'ghost'}
            onClick={() => setSaring(b.id)}
          >
            {b.namaBidang}
          </Button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 w-56 pl-8"
            placeholder="Cari kode atau nama…"
            value={cari}
            onChange={e => setCari(e.target.value)}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Nama unit mengikuti sheet <b>OPERA INK</b> pada workbook sumber.
      </p>

      {/* Daftar */}
      {data === null && <Skeleton className="h-64" />}

      {data !== null && !program.length && (
        <p className="rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
          Tidak ada subkegiatan yang cocok dengan saringan ini.
        </p>
      )}

      <div className="space-y-5">
        {program.map(p => (
          <div key={p.kode} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <Kode>{p.kode}</Kode>
              <span className="text-sm font-bold">{p.nama}</span>
            </div>

            {p.kegiatan.map(k => {
              const grup = bidangGrup(k.subkegiatan);
              const campuran = grup === 'campuran';
              return (
                <div
                  key={k.kode}
                  className="overflow-hidden rounded-xl border bg-card shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
                    {campuran && (
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-amber-500"
                        title="Subkegiatan di kegiatan ini terbagi ke beberapa bidang"
                      />
                    )}
                    <Kode>{k.kode}</Kode>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                      {k.nama}
                    </span>
                    <span className="tabular font-mono text-[11px] text-muted-foreground">
                      {k.subkegiatan.length} subkeg
                    </span>
                    <PilihBidang
                      nilai={campuran ? null : (grup as number | null)}
                      campuran={campuran}
                      bidang={bidang}
                      aktif={dapatDisunting && !sibuk}
                      judul="Menugaskan seluruh subkegiatan kegiatan ini sekaligus"
                      onPilih={t => void jalankan(k.subkegiatan, t)}
                      className="w-56"
                    />
                  </div>

                  <div className="divide-y">
                    {k.subkegiatan.map(b => {
                      const terkunci = alasanTerkunci(b);
                      return (
                        <div
                          key={b.subkegiatanId}
                          className="flex flex-wrap items-center gap-2.5 px-3 py-2"
                        >
                          <Checkbox
                            className="shrink-0"
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
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Kode>{b.kode}</Kode>
                              {!b.flagActive && (
                                <span className="rounded bg-slate-100 px-1 font-mono text-[10px] text-slate-500">
                                  nonaktif
                                </span>
                              )}
                            </div>
                            <p className="text-[13px] leading-snug">{b.nama}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {b.indikatorKinerja || '—'}
                              {b.targetAnjuran !== null && (
                                <>
                                  {' · target '}
                                  <span className="tabular font-mono">
                                    {b.targetAnjuran.toLocaleString('id-ID')}
                                  </span>
                                  {b.satuan ? ` ${b.satuan}` : ''}
                                </>
                              )}
                            </p>
                          </div>
                          <PilihBidang
                            nilai={b.bidangId}
                            bidang={bidang}
                            aktif={dapatDisunting && !sibuk && !terkunci}
                            judul={terkunci ?? undefined}
                            onPilih={t => void jalankan([b], t)}
                            className="w-56"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bar aksi massal lintas kegiatan */}
      {dapatDisunting && dipilih.length > 0 && (
        <div className="sticky bottom-3 flex flex-wrap items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2.5 shadow-lg">
          <span className="text-sm">
            <b>{dipilih.length}</b> subkegiatan terpilih
          </span>
          <Button size="xs" variant="ghost" onClick={() => setTerpilih(new Set())}>
            Bersihkan
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tugaskan ke</span>
            <select
              className={cn(KELAS_SELECT, 'w-56')}
              value={bidangMassal ?? ''}
              onChange={e =>
                setBidangMassal(
                  e.target.value === '' ? null : Number(e.target.value),
                )
              }
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

      {sumber && (
        <DialogSalinRencana
          terbuka={salinTerbuka}
          onTutup={() => setSalinTerbuka(false)}
          sumber={sumber}
          tujuan={periode}
          adaIsi={(ringkasan?.jumlahDitugaskan ?? 0) > 0}
          onSelesai={async () => {
            await muat();
            await onPerubahan();
          }}
        />
      )}
    </div>
  );
}
