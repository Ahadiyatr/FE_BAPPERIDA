import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Search, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AuthedImage } from '@/components/AuthedMedia';
import {
  getBidang,
  getBuktiByBidang,
  getPeriode,
  hapusLampiran,
  uploadLampiran,
} from '@/services';
import type {
  Bidang,
  CatatanBukti,
  Periode,
  RealisasiLampiran,
} from '@/services';
import { apiMessage } from '@/services/api';
import { usePeran } from '@/lib/peran';
import { Toast } from '@/utils/toast';
import {
  ekstensiBerkas,
  GaleriLampiran,
  PratinjauLampiran,
} from '@/components/opera/pratinjau-lampiran';
import { Panel, PilihPeriode } from './bagian/ui';

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const hari = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit' });

const bulan = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { month: 'short' });

type Saringan = 'semua' | 'belum' | 'ada';

const adaBukti = (c: CatatanBukti) => c.lampirans.length > 0;

/** Maksimal tiga lampiran tampil sebagai thumbnail di baris; sisanya "+n". */
const SLOT_THUMBNAIL = 3;

function Ringkasan({
  catatan,
  onPilihBelum,
}: {
  catatan: CatatanBukti[];
  onPilihBelum: () => void;
}) {
  const berbukti = catatan.filter(adaBukti).length;
  const foto = catatan.reduce(
    (a, c) => a + c.lampirans.filter(l => l.tipeBerkas === 'FOTO').length,
    0,
  );
  const dokumen = catatan.reduce((a, c) => a + c.lampirans.length, 0) - foto;
  const subkegiatan = new Set(catatan.map(c => c.kodeSubkegiatan)).size;
  const persen = Math.round((berbukti / catatan.length) * 100);
  const belum = catatan.length - berbukti;

  return (
    <section
      aria-label="Ringkasan bukti"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <div className="p-4 bg-white border rounded-2xl border-slate-200">
        <p className="text-xs font-medium text-slate-500">Catatan realisasi</p>
        <p className="mt-1 text-2xl font-bold tabular text-slate-800">
          {catatan.length}
        </p>
        <p className="text-xs text-slate-500">di {subkegiatan} subkegiatan</p>
      </div>
      <div className="p-4 bg-white border rounded-2xl border-slate-200">
        <p className="text-xs font-medium text-slate-500">Berkas bukti</p>
        <p className="mt-1 text-2xl font-bold tabular text-slate-800">
          {foto + dokumen}
        </p>
        <p className="text-xs text-slate-500">
          {foto} foto · {dokumen} dokumen
        </p>
      </div>
      <div className="p-4 bg-white border rounded-2xl border-slate-200">
        <p className="text-xs font-medium text-slate-500">Kelengkapan bukti</p>
        <p className="mt-1 text-2xl font-bold tabular text-emerald-700">
          {persen}%
        </p>
        <div className="h-1.5 mt-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-emerald-600"
            style={{ width: `${persen}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onPilihBelum}
        disabled={belum === 0}
        className="p-4 text-left border rounded-2xl border-amber-200 bg-amber-50 enabled:hover:bg-amber-100 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <p className="text-xs font-semibold text-amber-800">Belum ada bukti</p>
        <p className="mt-1 text-2xl font-bold tabular text-amber-700">
          {belum}
        </p>
        <p className="text-xs font-medium text-amber-800">
          {belum === 0 ? 'Semua catatan berbukti' : 'Lihat catatan ini →'}
        </p>
      </button>
    </section>
  );
}

function ThumbnailBaris({ lampiran }: { lampiran: RealisasiLampiran[] }) {
  const tampil = lampiran.slice(0, SLOT_THUMBNAIL);
  const sisa = lampiran.length - tampil.length;
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {tampil.map(l =>
        l.tipeBerkas === 'FOTO' ? (
          <div
            key={l.id}
            className="overflow-hidden rounded-lg size-10 bg-slate-100"
          >
            <AuthedImage
              lampiranId={l.id}
              alt={l.namaBerkas}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <span
            key={l.id}
            title={l.namaBerkas}
            className="flex items-center justify-center h-10 px-1.5 text-[10px] font-bold uppercase rounded-lg min-w-10 bg-blue-50 text-blue-700"
          >
            {ekstensiBerkas(l.namaBerkas) || 'DOK'}
          </span>
        ),
      )}
      {sisa > 0 && (
        <span className="flex items-center justify-center h-10 px-1.5 text-xs font-semibold rounded-lg min-w-10 bg-slate-100 text-slate-600 tabular">
          +{sisa}
        </span>
      )}
    </div>
  );
}

function BarisCatatan({
  c,
  aktif,
  onPilih,
}: {
  c: CatatanBukti;
  aktif: boolean;
  onPilih: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPilih}
      aria-pressed={aktif}
      className={`flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${
        aktif
          ? 'bg-emerald-50 shadow-[inset_3px_0_0_var(--color-emerald-600)]'
          : 'bg-white hover:bg-slate-50'
      }`}
    >
      <div className="w-10 text-center shrink-0">
        <p className="text-lg font-bold leading-none tabular text-slate-800">
          {hari(c.tanggalKegiatan)}
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase text-slate-500">
          {bulan(c.tanggalKegiatan)}
        </p>
      </div>
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm font-semibold leading-snug text-slate-800">
          {c.namaAktifitas}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {c.jumlahRealisasi} tercatat · {c.logEntryName}
        </p>
      </div>
      {adaBukti(c) ? (
        <ThumbnailBaris lampiran={c.lampirans} />
      ) : (
        <span className="inline-flex items-center h-7 gap-1.5 px-2.5 text-xs font-semibold border rounded-full shrink-0 border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="size-3.5" /> Belum ada bukti
        </span>
      )}
    </button>
  );
}

function PanelDetail({
  c,
  sedangUnggah,
  onUnggah,
  onHapus,
  onPratinjau,
}: {
  c: CatatanBukti | null;
  sedangUnggah: boolean;
  onUnggah?: (f: FileList) => void;
  onHapus?: (l: RealisasiLampiran) => void;
  onPratinjau: (l: RealisasiLampiran) => void;
}) {
  const [diseret, setDiseret] = React.useState(false);

  if (!c)
    return (
      <aside
        aria-label="Detail bukti"
        className="p-8 text-sm text-center bg-white border border-dashed rounded-2xl border-slate-300 text-slate-500"
      >
        Pilih catatan untuk melihat dan mengelola buktinya.
      </aside>
    );

  return (
    <aside
      aria-label="Detail bukti"
      className="overflow-hidden bg-white border rounded-2xl border-slate-200"
    >
      <div className="p-5 border-b border-slate-100">
        <p className="font-mono text-xs text-slate-500">{c.kodeSubkegiatan}</p>
        <h2 className="mt-1 text-base font-bold leading-snug text-slate-800">
          {c.namaAktifitas}
        </h2>
        <dl className="grid grid-cols-2 mt-4 text-sm gap-x-4 gap-y-3">
          <div>
            <dt className="text-[11px] font-semibold text-slate-500">
              Tanggal
            </dt>
            <dd className="font-medium text-slate-700">
              {tanggal(c.tanggalKegiatan)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-slate-500">
              Realisasi tercatat
            </dt>
            <dd className="font-medium text-slate-700 tabular">
              {c.jumlahRealisasi} kali
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[11px] font-semibold text-slate-500">
              Dicatat oleh
            </dt>
            <dd className="font-medium text-slate-700">{c.logEntryName}</dd>
          </div>
          {c.keterangan && (
            <div className="col-span-2">
              <dt className="text-[11px] font-semibold text-slate-500">
                Keterangan
              </dt>
              <dd className="text-slate-600">{c.keterangan}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="p-5 space-y-4">
        {adaBukti(c) ? (
          <GaleriLampiran
            lampiran={c.lampirans}
            onPratinjau={onPratinjau}
            onHapus={c.lampirans.length > 1 ? onHapus : undefined}
          />
        ) : (
          <div className="p-4 border rounded-xl border-amber-200 bg-amber-50">
            <p className="text-sm font-semibold text-amber-800">
              Catatan ini belum punya bukti
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {onUnggah
                ? 'Unggah foto atau dokumen di bawah agar realisasi ini bisa diverifikasi.'
                : 'Admin bidang perlu mengunggah foto atau dokumen pendukung.'}
            </p>
          </div>
        )}

        {onUnggah && (
          <label
            onDragOver={e => {
              e.preventDefault();
              setDiseret(true);
            }}
            onDragLeave={() => setDiseret(false)}
            onDrop={e => {
              e.preventDefault();
              setDiseret(false);
              if (!sedangUnggah && e.dataTransfer.files.length)
                onUnggah(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center gap-1 rounded-xl border-[1.5px] border-dashed px-4 py-5 text-center transition ${
              sedangUnggah ? 'cursor-wait opacity-70' : 'cursor-pointer'
            } ${
              diseret
                ? 'border-emerald-500 bg-emerald-100'
                : 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50'
            } focus-within:ring-2 focus-within:ring-emerald-500`}
          >
            {sedangUnggah ? (
              <span className="inline-block size-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            ) : (
              <Upload className="size-5 text-emerald-700" />
            )}
            <span className="text-sm font-semibold text-emerald-700">
              {sedangUnggah ? 'Mengunggah…' : 'Tambah bukti'}
            </span>
            <span className="text-xs text-slate-600">
              Seret berkas ke sini atau klik untuk memilih · Foto, PDF, Word,
              Excel
            </span>
            <input
              type="file"
              multiple
              disabled={sedangUnggah}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="sr-only"
              onChange={e => {
                if (e.target.files?.length) onUnggah(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
    </aside>
  );
}

export default function BuktiKegiatan() {
  const [searchParams] = useSearchParams();
  const periodeTautan = Number(searchParams.get('periode'));
  const { peran, bidangId: bidangPeran } = usePeran();
  const [periodes, setPeriodes] = React.useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = React.useState<number | null>(null);
  const [bidangs, setBidangs] = React.useState<Bidang[]>([]);
  const [bidangId, setBidangId] = React.useState<number | null>(bidangPeran);
  const [catatan, setCatatan] = React.useState<CatatanBukti[]>([]);
  const [saringan, setSaringan] = React.useState<Saringan>('semua');
  const [cari, setCari] = React.useState('');
  const [dipilih, setDipilih] = React.useState<number | null>(null);
  const [memuat, setMemuat] = React.useState(true);
  const [galatMuat, setGalatMuat] = React.useState<string | null>(null);
  const [mengunggah, setMengunggah] = React.useState<number | null>(null);
  const [menghapus, setMenghapus] = React.useState<number | null>(null);
  const [pratinjau, setPratinjau] = React.useState<RealisasiLampiran | null>(
    null,
  );
  const urutanMuat = React.useRef(0);

  const muatAwal = React.useCallback(async () => {
    setGalatMuat(null);
    setMemuat(true);
    const sumberBidang =
      peran === 'admin_aplikasi' ? getBidang() : Promise.resolve<Bidang[]>([]);
    try {
      const [p, b] = await Promise.all([getPeriode(), sumberBidang]);
      const periodeBerikut =
        (
          p.find(x => x.id === periodeTautan) ??
          p.find(x => x.status === 'OPEN') ??
          p[0]
        )?.id ?? null;
      setPeriodes(p);
      setPeriodeId(periodeBerikut);
      setBidangs(b);
      if (peran === 'admin_aplikasi')
        setBidangId(v =>
          b.some(bidang => bidang.id === v) ? v : (b[0]?.id ?? null),
        );
      if (
        periodeBerikut == null ||
        (peran === 'admin_aplikasi' ? b.length === 0 : bidangPeran == null)
      )
        setMemuat(false);
    } catch (e) {
      setGalatMuat(apiMessage(e, 'Gagal memuat periode atau bidang.'));
      setMemuat(false);
    }
  }, [bidangPeran, peran, periodeTautan]);
  React.useEffect(() => {
    void muatAwal();
  }, [muatAwal]);

  const muat = React.useCallback(async () => {
    const urutan = ++urutanMuat.current;
    if (periodeId == null || bidangId == null) return;
    setMemuat(true);
    setGalatMuat(null);
    try {
      const hasil = await getBuktiByBidang(
        bidangId,
        periodeId,
        peran === 'admin_aplikasi',
      );
      if (urutan === urutanMuat.current) setCatatan(hasil);
    } catch (e) {
      if (urutan === urutanMuat.current) {
        setCatatan([]);
        setGalatMuat(apiMessage(e, 'Gagal memuat bukti kegiatan.'));
      }
    } finally {
      if (urutan === urutanMuat.current) setMemuat(false);
    }
  }, [bidangId, peran, periodeId]);

  React.useEffect(() => {
    void muat();
  }, [muat]);

  const kataCari = cari.trim().toLowerCase();
  const cocokCari = (c: CatatanBukti) =>
    !kataCari ||
    `${c.namaAktifitas} ${c.kodeSubkegiatan} ${c.namaSubkegiatan}`
      .toLowerCase()
      .includes(kataCari);
  const tercari = catatan.filter(cocokCari);
  const jumlahBerbukti = tercari.filter(adaBukti).length;
  const terlihat = tercari.filter(c =>
    saringan === 'semua' ? true : (saringan === 'ada') === adaBukti(c),
  );

  // Kelompok per subkegiatan, urutan mengikuti kemunculan pertama di respons;
  // meter berbukti dihitung dari seluruh catatan subkegiatan, bukan hasil saring.
  const grup = React.useMemo(() => {
    const peta = new Map<
      string,
      { kode: string; nama: string; semua: CatatanBukti[] }
    >();
    for (const c of catatan) {
      const g = peta.get(c.kodeSubkegiatan) ?? {
        kode: c.kodeSubkegiatan,
        nama: c.namaSubkegiatan,
        semua: [],
      };
      g.semua.push(c);
      peta.set(c.kodeSubkegiatan, g);
    }
    return [...peta.values()];
  }, [catatan]);
  const idTerlihat = new Set(terlihat.map(c => c.realisasiId));
  const grupTerlihat = grup
    .map(g => ({
      ...g,
      berbukti: g.semua.filter(adaBukti).length,
      items: g.semua.filter(c => idTerlihat.has(c.realisasiId)),
    }))
    .filter(g => g.items.length > 0);

  const terpilih = catatan.find(c => c.realisasiId === dipilih) ?? null;
  const belumAdaPeriode = !memuat && !galatMuat && periodeId == null;
  const belumAdaBidang =
    !memuat && !galatMuat && periodeId != null && bidangId == null;
  const siap = !memuat && !galatMuat;

  async function unggah(realisasiId: number, files: FileList) {
    const sebelum =
      catatan.find(c => c.realisasiId === realisasiId)?.lampirans.length ?? 0;
    setMengunggah(realisasiId);
    try {
      const lampiranBaru = await uploadLampiran(realisasiId, Array.from(files));
      setCatatan(prev =>
        prev.map(c =>
          c.realisasiId === realisasiId ? { ...c, lampirans: lampiranBaru } : c,
        ),
      );
      const n = Math.max(lampiranBaru.length - sebelum, 1);
      Toast.fire({ icon: 'success', title: `${n} bukti ditambahkan.` });
    } catch (e) {
      Toast.fire({
        icon: 'error',
        title: apiMessage(e, 'Gagal menambah bukti.'),
      });
    } finally {
      setMengunggah(null);
    }
  }

  async function hapus(lampiran: RealisasiLampiran) {
    if (!window.confirm(`Hapus bukti “${lampiran.namaBerkas}”?`)) return;
    setMenghapus(lampiran.id);
    try {
      await hapusLampiran(lampiran.id);
      setCatatan(prev =>
        prev.map(c =>
          c.realisasiId === lampiran.realisasiId
            ? { ...c, lampirans: c.lampirans.filter(x => x.id !== lampiran.id) }
            : c,
        ),
      );
      if (pratinjau?.id === lampiran.id) setPratinjau(null);
      Toast.fire({ icon: 'success', title: 'Bukti dihapus.' });
    } catch (e) {
      Toast.fire({
        icon: 'error',
        title: apiMessage(e, 'Gagal menghapus bukti.'),
      });
    } finally {
      setMenghapus(null);
    }
  }

  const tab: { id: Saringan; label: string; n: number }[] = [
    { id: 'semua', label: 'Semua', n: tercari.length },
    {
      id: 'belum',
      label: 'Belum ada bukti',
      n: tercari.length - jumlahBerbukti,
    },
    { id: 'ada', label: 'Sudah ada bukti', n: jumlahBerbukti },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Foto dan dokumen pendukung tiap catatan realisasi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {peran === 'admin_aplikasi' && (
            <select
              aria-label="Bidang"
              value={bidangId ?? ''}
              onChange={e => setBidangId(Number(e.target.value))}
              className="px-3 py-2 text-sm bg-white border rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              {bidangs.map(b => (
                <option key={b.id} value={b.id}>
                  {b.namaBidang}
                </option>
              ))}
            </select>
          )}
          <PilihPeriode
            periodes={periodes}
            nilai={periodeId}
            onPilih={setPeriodeId}
          />
        </div>
      </div>

      {memuat && (
        <Panel>
          <p className="p-8 text-sm text-center text-slate-400">Memuat…</p>
        </Panel>
      )}

      {galatMuat && (
        <Panel>
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{galatMuat}</p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => {
                if (periodeId == null) void muatAwal();
                else void muat();
              }}
            >
              <RefreshCw className="size-3.5" /> Coba lagi
            </Button>
          </div>
        </Panel>
      )}

      {siap && catatan.length === 0 && (
        <Panel>
          <p className="p-8 text-sm text-center text-slate-500">
            {belumAdaPeriode
              ? 'Belum ada periode yang dapat ditampilkan.'
              : belumAdaBidang
                ? 'Akun ini belum ditempatkan pada bidang. Hubungi admin aplikasi untuk menetapkan bidang Anda.'
                : 'Belum ada catatan realisasi pada periode ini.'}
          </p>
        </Panel>
      )}

      {siap && catatan.length > 0 && (
        <>
          <Ringkasan
            catatan={catatan}
            onPilihBelum={() => {
              setCari('');
              setSaringan('belum');
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Saring catatan"
              className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-200/70"
            >
              {tab.map(t => {
                const aktif = saringan === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => setSaringan(t.id)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      aktif
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                    <span
                      className={`rounded-full px-1.5 text-[11px] tabular ${
                        t.id === 'belum'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.n}
                    </span>
                  </button>
                );
              })}
            </div>
            <label className="relative w-full sm:ml-auto sm:w-72">
              <span className="sr-only">Cari aktivitas</span>
              <Search className="absolute -translate-y-1/2 pointer-events-none size-4 left-3 top-1/2 text-slate-400" />
              <input
                type="search"
                value={cari}
                onChange={e => setCari(e.target.value)}
                placeholder="Cari aktivitas atau kode…"
                className="w-full py-2 pr-3 text-sm bg-white border pl-9 rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
            <section aria-label="Catatan realisasi" className="space-y-4">
              {grupTerlihat.length === 0 && (
                <Panel>
                  <p className="p-8 text-sm text-center text-slate-500">
                    Tidak ada catatan pada saringan ini.
                  </p>
                </Panel>
              )}
              {grupTerlihat.map(g => (
                <div
                  key={g.kode}
                  className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200"
                >
                  <div className="flex flex-wrap items-center px-4 py-3 gap-x-3 gap-y-2 bg-slate-50">
                    <span className="px-1.5 py-0.5 font-mono text-xs bg-white border rounded-md border-slate-200 text-slate-600">
                      {g.kode}
                    </span>
                    <h2 className="flex-1 min-w-0 text-sm font-semibold basis-60 text-slate-800">
                      {g.nama}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-600 tabular">
                      <div className="w-16 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-emerald-600"
                          style={{
                            width: `${Math.round((g.berbukti / g.semua.length) * 100)}%`,
                          }}
                        />
                      </div>
                      {g.berbukti}/{g.semua.length} berbukti
                    </div>
                  </div>
                  {g.items.map(c => (
                    <BarisCatatan
                      key={c.realisasiId}
                      c={c}
                      aktif={dipilih === c.realisasiId}
                      onPilih={() => setDipilih(c.realisasiId)}
                    />
                  ))}
                </div>
              ))}
            </section>

            <div className="lg:sticky lg:top-4">
              <PanelDetail
                c={terpilih}
                sedangUnggah={mengunggah === terpilih?.realisasiId}
                onUnggah={
                  peran === 'admin_bidang' && terpilih
                    ? f => void unggah(terpilih.realisasiId, f)
                    : undefined
                }
                onHapus={
                  peran === 'admin_bidang'
                    ? l => {
                        if (menghapus == null) void hapus(l);
                      }
                    : undefined
                }
                onPratinjau={setPratinjau}
              />
            </div>
          </div>
        </>
      )}

      {pratinjau && (
        <PratinjauLampiran
          lampiran={pratinjau}
          daftar={
            catatan.find(c => c.realisasiId === pratinjau.realisasiId)
              ?.lampirans
          }
          onGanti={setPratinjau}
          onTutup={() => setPratinjau(null)}
        />
      )}
    </div>
  );
}
