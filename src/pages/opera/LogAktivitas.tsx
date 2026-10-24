import * as React from 'react';
import {
  AlertTriangle,
  ArrowUpFromLine,
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  Lock,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RotateCcw,
  Scale,
  ShieldCheck,
  Trash2,
  Undo2,
  Unlock,
  X,
  type LucideIcon,
} from 'lucide-react';

import KontrolHalaman from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/opera/search-input';
import { getBidang, getLog, getPeriode, getRingkasanLog, getUsers } from '@/services';
import type {
  AksiLog,
  GrupLog,
  LogAktivitas as Baris,
  Periode,
  RingkasanLog,
  SaringLog,
} from '@/services';
import { usePeran } from '@/lib/peran';
import {
  LABEL_GRUP,
  META_AKSI,
  jamWita,
  judulHari,
  kalimatRangkaian,
  kelompokkanPerHari,
  labelEntitas,
  lipatBeruntun,
  pecahRingkasan,
  tanggalWita,
  type NadaAksi,
} from './bagian/log-aktivitas';


const IKON_AKSI: Record<AksiLog, LucideIcon> = {
  BUAT: Plus,
  UBAH: Pencil,
  HAPUS: Trash2,
  NONAKTIFKAN: PowerOff,
  AKTIFKAN: Power,
  PULIHKAN: RotateCcw,
  BUKA_PERIODE: Unlock,
  KUNCI_PERIODE: Lock,
  UBAH_BOBOT: Scale,
  SALIN_RENCANA: Copy,
  TANDAI_SIAP: Check,
  BATAL_SIAP: Undo2,
  CATAT_REALISASI: BarChart3,
  UNGGAH_BUKTI: ArrowUpFromLine,
  LOGIN: LogIn,
  GAGAL_LOGIN: AlertTriangle,
  LOGOUT: LogOut,
};

const KELAS_NADA: Record<NadaAksi, string> = {
  positif: 'bg-emerald-50 text-emerald-700',
  netral: 'bg-slate-100 text-slate-600',
  info: 'bg-sky-50 text-sky-700',
  waspada: 'bg-amber-50 text-amber-700',
  kritis: 'bg-red-50 text-red-600',
};

const RINGKASAN_KOSONG: RingkasanLog = {
  total: 0,
  hariIni: 0,
  pengguna: 0,
  perhatian: 0,
  perHari: [],
  perGrup: { master: 0, rencana: 0, pelaksanaan: 0, sesi: 0 },
};

const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .slice(0, 2)
    .map(k => k[0] ?? '')
    .join('')
    .toUpperCase();

function LencanaAksi({ aksi }: { aksi: AksiLog }) {
  const meta = META_AKSI[aksi];
  const Ikon = IKON_AKSI[aksi];
  // Aksi baru dari backend yang belum dikenal FE tetap tampil, bukan hilang diam-diam.
  if (!meta) {
    return (
      <span className="inline-flex h-6 items-center rounded-md bg-slate-100 px-2 text-xs font-semibold text-slate-600">
        {aksi}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md pl-1.5 pr-2 text-xs font-semibold ${KELAS_NADA[meta.nada]}`}
    >
      <Ikon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}

function TeksRingkasan({ teks }: { teks: string }) {
  return (
    <>
      {pecahRingkasan(teks).map((p, i) =>
        p.jenis === 'kode' ? (
          <code
            key={i}
            className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[12.5px] text-slate-600"
          >
            {p.isi}
          </code>
        ) : p.jenis === 'nama' ? (
          <span key={i} className="font-semibold text-slate-900">
            {p.isi}
          </span>
        ) : (
          <React.Fragment key={i}>{p.isi}</React.Fragment>
        ),
      )}
    </>
  );
}

function Pelaku({ l, namaBidang }: { l: Baris; namaBidang: string | null }) {
  const bidang = l.peran === 'admin_bidang';
  return (
    // Hanya <span>: komponen ini dirender di dalam <button>.
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
          bidang ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'
        }`}
        aria-hidden
      >
        {inisial(l.namaPengguna)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-800">
          {l.namaPengguna}
        </span>
        <span className="block truncate text-xs text-slate-400">
          {bidang ? `Admin bidang${namaBidang ? ` · ${namaBidang}` : ''}` : 'Admin aplikasi'}
        </span>
      </span>
    </span>
  );
}

const garisBerat = (aksi: AksiLog) => {
  const berat = META_AKSI[aksi]?.berat ?? 0;
  return berat === 2
    ? 'before:bg-red-500'
    : berat === 1
      ? 'before:bg-amber-500'
      : 'before:bg-transparent';
};

const KELAS_BARIS =
  'relative grid w-full cursor-pointer items-center gap-x-4 gap-y-1 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r sm:px-6 ' +
  'grid-cols-[3rem_minmax(0,1fr)_1rem] lg:grid-cols-[3.5rem_13rem_minmax(0,1fr)_1rem] xl:grid-cols-[3.5rem_13rem_9.5rem_minmax(0,1fr)_1rem]';

export default function LogAktivitasLayar() {
  const { peran, bidangId } = usePeran();
  // PRD §4: admin bidang hanya melihat jejak bidangnya. Batas ini diteruskan
  // ke service, bukan disaring di sini — lihat catatan di log.service.ts.
  const batasBidang = peran === 'admin_bidang' ? bidangId : null;

  const [baris, setBaris] = React.useState<Baris[]>([]);
  const [ringkas, setRingkas] = React.useState<RingkasanLog>(RINGKASAN_KOSONG);
  const [periodes, setPeriodes] = React.useState<Periode[]>([]);
  const [namaBidang, setNamaBidang] = React.useState<Map<number, string>>(new Map());
  const [pelakuOpsi, setPelakuOpsi] = React.useState<{ id: number; nama: string }[]>([]);

  const [cari, setCari] = React.useState('');
  const [aksi, setAksi] = React.useState<AksiLog | ''>('');
  const [grup, setGrup] = React.useState<GrupLog | ''>('');
  const [perhatian, setPerhatian] = React.useState(false);
  const [userId, setUserId] = React.useState<number | ''>('');
  const [periodeId, setPeriodeId] = React.useState<number | ''>('');
  const [riwayat, setRiwayat] = React.useState<{ entitas: string; entitasId: number } | null>(
    null,
  );

  const [memuat, setMemuat] = React.useState(true);
  const [galat, setGalat] = React.useState(false);
  const [halaman, setHalaman] = React.useState(1);
  const [ukuran, setUkuran] = React.useState(25);
  const [terbuka, setTerbuka] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    getPeriode()
      .then(setPeriodes)
      .catch(() => {});
    getBidang({ termasukNonaktif: true })
      .then(bs => setNamaBidang(new Map(bs.map(b => [b.id, b.namaBidang]))))
      .catch(() => {});
    getUsers({ termasukNonaktif: true })
      .then(us => setPelakuOpsi(us.map(u => ({ id: u.id, nama: u.name }))))
      .catch(() => {});
  }, []);

  const saring: SaringLog = React.useMemo(
    () => ({
      bidangId: batasBidang,
      cari: cari || undefined,
      aksi: aksi || undefined,
      grup: grup || undefined,
      perhatian: perhatian || undefined,
      userId: userId === '' ? undefined : userId,
      periodeId: periodeId === '' ? undefined : periodeId,
      entitas: riwayat?.entitas,
      entitasId: riwayat?.entitasId,
    }),
    [batasBidang, cari, aksi, grup, perhatian, userId, periodeId, riwayat],
  );

  // Saringan baru → kembali ke halaman 1, di render yang sama supaya tidak ada
  // permintaan sia-sia untuk halaman lama dengan saringan baru.
  const [saringTerakhir, setSaringTerakhir] = React.useState(saring);
  if (saring !== saringTerakhir) {
    setSaringTerakhir(saring);
    setHalaman(1);
  }

  // Ringkasan tidak bergantung pada halaman; `total`-nya sekaligus menjadi
  // jumlah baris untuk pagination daftar.
  React.useEffect(() => {
    let batal = false;
    getRingkasanLog(saring)
      .then(r => !batal && setRingkas(r))
      .catch(() => !batal && setGalat(true));
    return () => {
      batal = true;
    };
  }, [saring]);

  React.useEffect(() => {
    let batal = false;
    setMemuat(true);
    setGalat(false);
    getLog({ ...saring, batas: ukuran, halaman })
      .then(l => !batal && setBaris(l))
      .catch(() => !batal && setGalat(true))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [saring, halaman, ukuran]);

  const totalHalaman = Math.max(1, Math.ceil(ringkas.total / ukuran));
  const dari = ringkas.total === 0 ? 0 : (halaman - 1) * ukuran + 1;

  const adaSaringan =
    !!cari || !!aksi || !!grup || perhatian || userId !== '' || periodeId !== '' || !!riwayat;

  const bersihkan = () => {
    setCari('');
    setAksi('');
    setGrup('');
    setPerhatian(false);
    setUserId('');
    setPeriodeId('');
    setRiwayat(null);
  };

  const alih = (kunci: string) =>
    setTerbuka(s => {
      const baru = new Set(s);
      if (baru.has(kunci)) baru.delete(kunci);
      else baru.add(kunci);
      return baru;
    });

  const hariIni = tanggalWita(new Date());
  const maksHarian = Math.max(1, ...ringkas.perHari.map(h => h.jumlah));
  const hari = kelompokkanPerHari(baris);
  const bidangDari = (l: Baris) => (l.bidangId ? (namaBidang.get(l.bidangId) ?? null) : null);
  const namaPeriode = (id: number | null) =>
    id ? (periodes.find(p => p.id === id)?.namaPeriode ?? `Periode #${id}`) : null;

  const gaya =
    'h-9 max-w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none';

  const rincian = (l: Baris) => (
    <div className="border-b border-slate-100 bg-slate-50/70 px-4 pb-4 sm:px-6 lg:pl-24">
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-x-6 gap-y-3 pt-3">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Waktu tepat
          </dt>
          <dd className="mt-0.5 font-mono text-[13px] text-slate-700">
            {new Date(l.waktu).toLocaleString('id-ID', {
              timeZone: 'Asia/Makassar',
              dateStyle: 'long',
              timeStyle: 'medium',
            })}{' '}
            WITA
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Data yang disentuh
          </dt>
          <dd className="mt-0.5 break-all font-mono text-[13px] text-slate-700">
            {l.entitas}
            {l.entitasId !== null && ` #${l.entitasId}`}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Periode
          </dt>
          <dd className="mt-0.5 text-[13px] text-slate-700">
            {namaPeriode(l.periodeId) ?? 'Tidak terkait periode'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Bidang
          </dt>
          <dd className="mt-0.5 text-[13px] text-slate-700">
            {bidangDari(l) ?? 'Lintas bidang'}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {l.userId !== null && userId !== l.userId && (
          <Button variant="outline" size="sm" onClick={() => setUserId(l.userId!)}>
            Semua kejadian oleh {l.namaPengguna.split(' ')[0]}
          </Button>
        )}
        {l.entitasId !== null && !riwayat && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRiwayat({ entitas: l.entitas, entitasId: l.entitasId! })}
          >
            Riwayat data ini
          </Button>
        )}
      </div>
    </div>
  );

  const barisTunggal = (l: Baris) => {
    const kunci = String(l.id);
    const buka = terbuka.has(kunci);
    return (
      <React.Fragment key={kunci}>
        <button
          type="button"
          className={`${KELAS_BARIS} ${garisBerat(l.aksi)}`}
          aria-expanded={buka}
          onClick={() => alih(kunci)}
        >
          <span className="self-start pt-1.5 font-mono text-[13px] tabular text-slate-500 lg:self-center lg:pt-0">
            {jamWita(l.waktu)}
          </span>
          <span className="lg:contents">
            <Pelaku l={l} namaBidang={bidangDari(l)} />
            <span className="hidden xl:block">
              <LencanaAksi aksi={l.aksi} />
            </span>
            <span className="mt-1.5 block min-w-0 lg:mt-0">
              <span className="mb-1 block xl:hidden">
                <LencanaAksi aksi={l.aksi} />
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {labelEntitas(l.entitas)}
              </span>
              <span className="block break-words text-sm text-slate-700">
                <TeksRingkasan teks={l.ringkasan} />
              </span>
            </span>
          </span>
          <ChevronRight
            className={`h-4 w-4 self-center justify-self-end text-slate-400 transition-transform ${buka ? 'rotate-90' : ''}`}
            aria-hidden
          />
        </button>
        {buka && rincian(l)}
      </React.Fragment>
    );
  };

  const barisRangkaian = (rs: Baris[]) => {
    const pertama = rs[0];
    const kunci = `r${pertama.id}`;
    const buka = terbuka.has(kunci);
    return (
      <React.Fragment key={kunci}>
        <button
          type="button"
          className={`${KELAS_BARIS} ${garisBerat(pertama.aksi)}`}
          aria-expanded={buka}
          onClick={() => alih(kunci)}
        >
          <span className="self-start pt-1.5 font-mono text-[13px] tabular text-slate-500 lg:self-center lg:pt-0">
            {jamWita(pertama.waktu)}
          </span>
          <span className="lg:contents">
            <Pelaku l={pertama} namaBidang={bidangDari(pertama)} />
            <span className="hidden xl:block">
              <LencanaAksi aksi={pertama.aksi} />
            </span>
            <span className="mt-1.5 block min-w-0 lg:mt-0">
              <span className="mb-1 block xl:hidden">
                <LencanaAksi aksi={pertama.aksi} />
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {labelEntitas(pertama.entitas)} · {rs.length} kejadian beruntun
              </span>
              <span className="block text-sm text-slate-700">
                {kalimatRangkaian(rs)} antara {jamWita(rs[rs.length - 1].waktu)}–
                {jamWita(pertama.waktu)}.{' '}
                <span className="font-semibold text-emerald-700">
                  {buka ? 'Sembunyikan' : 'Lihat rinciannya'}
                </span>
              </span>
            </span>
          </span>
          <ChevronRight
            className={`h-4 w-4 self-center justify-self-end text-slate-400 transition-transform ${buka ? 'rotate-90' : ''}`}
            aria-hidden
          />
        </button>
        {buka &&
          rs.map(l => {
            const k = String(l.id);
            const bukaAnak = terbuka.has(k);
            return (
              <React.Fragment key={k}>
                <button
                  type="button"
                  className="grid w-full grid-cols-[3rem_minmax(0,1fr)_1rem] items-center gap-4 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-left hover:bg-slate-100/70 focus-visible:outline-none sm:px-6 lg:grid-cols-[3.5rem_minmax(0,1fr)_1rem] lg:pl-24"
                  aria-expanded={bukaAnak}
                  onClick={() => alih(k)}
                >
                  <span className="font-mono text-[13px] tabular text-slate-400">
                    {jamWita(l.waktu)}
                  </span>
                  <span className="min-w-0 break-words text-sm text-slate-700">
                    <TeksRingkasan teks={l.ringkasan} />
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 justify-self-end text-slate-400 transition-transform ${bukaAnak ? 'rotate-90' : ''}`}
                    aria-hidden
                  />
                </button>
                {bukaAnak && rincian(l)}
              </React.Fragment>
            );
          })}
      </React.Fragment>
    );
  };

  const statLabel = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const statNilai = 'mt-1 text-2xl font-bold tabular text-slate-900';

  return (
    <div className="space-y-4">
      {peran === 'admin_bidang' && (
        <div className="flex gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Anda melihat jejak bidang Anda sendiri. Kejadian bidang lain dan
            perubahan data master tidak ditampilkan.
          </span>
        </div>
      )}

      <section
        aria-label="Ringkasan"
        className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.5fr_1fr_1fr_1fr]"
      >
        <div className="col-span-2 flex items-end justify-between gap-4 border-b border-slate-100 p-4 lg:col-span-1 lg:border-b-0 lg:px-5">
          <div>
            <p className={statLabel}>Kejadian tercatat</p>
            <p className={statNilai}>{ringkas.total}</p>
            <p className="text-xs text-slate-500">
              {adaSaringan
                ? 'Sesuai saringan'
                : peran === 'admin_bidang'
                  ? 'Dalam lingkup bidang Anda'
                  : 'Seluruh sistem'}
            </p>
          </div>
          {ringkas.perHari.length > 0 && (
            <div aria-label="Kejadian per hari, tujuh hari terakhir">
              <div className="flex h-10 items-end gap-1">
                {ringkas.perHari.map(h => (
                  <span
                    key={h.tanggal}
                    title={`${judulHari(h.tanggal, hariIni).utama}: ${h.jumlah} kejadian`}
                    className={`w-2.5 rounded-t-[3px] rounded-b-[1px] ${
                      h.tanggal === hariIni ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                    style={{ height: `${Math.max(3, (h.jumlah / maksHarian) * 40)}px` }}
                  />
                ))}
              </div>
              <p className="mt-1 text-right text-[10px] text-slate-400">7 hari terakhir</p>
            </div>
          )}
        </div>
        <div className="p-4 lg:border-l lg:border-slate-100 lg:px-5">
          <p className={statLabel}>Hari ini</p>
          <p className={statNilai}>{ringkas.hariIni}</p>
        </div>
        <div className="border-l border-slate-100 p-4 lg:px-5">
          <p className={statLabel}>Pengguna terlibat</p>
          <p className={statNilai}>{ringkas.pengguna}</p>
        </div>
        <div className="col-span-2 border-t border-slate-100 p-4 lg:col-span-1 lg:border-l lg:border-t-0 lg:px-5">
          <p className={statLabel}>Perlu perhatian</p>
          <p className={`${statNilai} ${ringkas.perhatian ? 'text-red-600' : ''}`}>
            {ringkas.perhatian}
          </p>
          <p className="text-xs text-slate-500">
            Hapus, nonaktifkan, siklus periode, bobot
            {ringkas.perhatian > 0 && !perhatian && (
              <>
                {' · '}
                <button
                  type="button"
                  className="font-semibold text-emerald-700 hover:underline"
                  onClick={() => setPerhatian(true)}
                >
                  Tampilkan
                </button>
              </>
            )}
          </p>
        </div>
      </section>

      <section
        aria-label="Saringan"
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={cari}
            onValueChange={setCari}
            placeholder="Cari kejadian, kode, atau nama pelaku…"
            aria-label="Cari log aktivitas"
            className="min-w-0 flex-1 basis-64"
          />
          <select
            className={gaya}
            value={aksi}
            aria-label="Tindakan"
            onChange={e => setAksi(e.target.value as AksiLog | '')}
          >
            <option value="">Semua tindakan</option>
            {(Object.keys(META_AKSI) as AksiLog[]).map(a => (
              <option key={a} value={a}>
                {META_AKSI[a].label}
              </option>
            ))}
          </select>
          {pelakuOpsi.length > 0 && (
            <select
              className={gaya}
              value={userId}
              aria-label="Pelaku"
              onChange={e => setUserId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Semua pelaku</option>
              {pelakuOpsi.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nama}
                </option>
              ))}
            </select>
          )}
          <select
            className={gaya}
            value={periodeId}
            aria-label="Periode"
            onChange={e => setPeriodeId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Semua periode</option>
            {periodes.map(p => (
              <option key={p.id} value={p.id}>
                {p.namaPeriode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Kelompok tindakan" className="flex flex-wrap gap-1.5">
            {([['', 'Semua'], ...Object.entries(LABEL_GRUP)] as [GrupLog | '', string][]).map(
              ([k, label]) => {
                const n = k
                  ? ringkas.perGrup[k]
                  : Object.values(ringkas.perGrup).reduce((a, b) => a + b, 0);
                const aktif = grup === k;
                return (
                  <button
                    key={k || 'semua'}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => setGrup(k)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
                      aktif
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {label}
                    <span className="text-[11px] tabular opacity-70">{n}</span>
                  </button>
                );
              },
            )}
          </div>
          <label className="ml-auto inline-flex cursor-pointer select-none items-center gap-2 text-[13px] text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-red-600"
              checked={perhatian}
              onChange={e => setPerhatian(e.target.checked)}
            />
            Hanya yang perlu perhatian
          </label>
        </div>
        {(riwayat || adaSaringan) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            {riwayat && (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-50 pl-3 pr-1 text-[13px] text-emerald-800">
                Riwayat {labelEntitas(riwayat.entitas).toLowerCase()} #{riwayat.entitasId}
                <button
                  type="button"
                  aria-label="Hapus saringan riwayat"
                  className="grid h-5 w-5 place-items-center rounded-full hover:bg-emerald-100"
                  onClick={() => setRiwayat(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {adaSaringan && (
              <Button variant="ghost" size="sm" onClick={bersihkan}>
                Bersihkan saringan
              </Button>
            )}
          </div>
        )}
      </section>

      <section
        aria-label="Daftar kejadian"
        // overflow-clip, bukan hidden: hidden menjadikan kartu wadah gulir sehingga judul hari tidak menempel.
        className="overflow-clip rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-[13px] text-slate-500 sm:px-6">
          <span>
            <strong className="font-semibold text-slate-800">{ringkas.total}</strong> kejadian
            {adaSaringan ? ' cocok dengan saringan' : ''}
          </span>
          <span>Terbaru di atas</span>
        </div>

        {memuat && <p className="px-6 py-10 text-center text-sm text-slate-400">Memuat…</p>}

        {!memuat && galat && (
          <p className="px-6 py-10 text-center text-sm text-red-600">
            Log tidak bisa dimuat. Periksa koneksi lalu muat ulang halaman.
          </p>
        )}

        {!memuat && !galat && baris.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-600">
              {adaSaringan
                ? 'Tidak ada kejadian yang cocok dengan saringan.'
                : 'Belum ada kejadian tercatat.'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {adaSaringan
                ? 'Coba hapus salah satu saringan atau ganti kata kunci.'
                : 'Jejak mulai terisi begitu ada yang mengubah master, mengunci periode, atau mencatat realisasi.'}
            </p>
          </div>
        )}

        {!memuat &&
          !galat &&
          hari.map(h => {
            const judul = judulHari(h.tanggal, hariIni);
            return (
              <div key={h.tanggal}>
                <div className="sticky top-0 z-10 flex items-baseline gap-2.5 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs sm:px-6">
                  <b className="font-bold text-slate-800">{judul.utama}</b>
                  <span className="text-slate-400">
                    {judul.sekunder ? `${judul.sekunder} · ` : ''}
                    {h.isi.length} kejadian
                  </span>
                </div>
                {lipatBeruntun(h.isi).map(b =>
                  b.jenis === 'rangkaian' ? barisRangkaian(b.baris) : barisTunggal(b.baris),
                )}
              </div>
            );
          })}

        {!memuat && !galat && (
          <KontrolHalaman
            halaman={halaman}
            ukuran={ukuran}
            totalHalaman={totalHalaman}
            total={ringkas.total}
            dari={dari}
            sampai={Math.min(halaman * ukuran, ringkas.total)}
            setHalaman={setHalaman}
            setUkuran={u => {
              setUkuran(u);
              setHalaman(1);
            }}
          />
        )}
      </section>
    </div>
  );
}
