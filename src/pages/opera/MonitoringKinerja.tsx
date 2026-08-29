import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';

import { getMonitoringKinerja, getPeriode } from '@/services';
import type {
  MonitoringKegiatan,
  MonitoringKinerja,
  MonitoringProgram,
  MonitoringSubkegiatan,
  Periode,
} from '@/services';
import { usePeran } from '@/lib/peran';
import {
  BarCapaian,
  KartuKpi,
  Panel,
  PilihPeriode,
  Th,
  persen1,
  warnaCapaian,
} from './bagian/ui';

const angka = (n: number) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const cocok = (teks: string, q: string) => teks.toLowerCase().includes(q);

/** Saring pohon monitoring menurut kata kunci & bidang, sambil menyisakan
 * seluruh leluhur dari baris yang cocok (perilaku "filter Excel"). */
function saring(
  data: MonitoringProgram[],
  q: string,
  bidang: string,
): MonitoringProgram[] {
  if (!q && !bidang) return data;
  const hasil: MonitoringProgram[] = [];
  for (const p of data) {
    const pCocok = q
      ? cocok(p.kodeProgram, q) || cocok(p.namaProgram, q)
      : false;
    const kegiatanBaru: MonitoringKegiatan[] = [];
    for (const k of p.kegiatan) {
      const kCocok = q
        ? cocok(k.kodeKegiatan, q) || cocok(k.namaKegiatan, q)
        : false;
      const subBaru: MonitoringSubkegiatan[] = [];
      for (const s of k.subkegiatan) {
        if (bidang && s.namaBidang !== bidang) continue;
        const sCocok =
          !q ||
          pCocok ||
          kCocok ||
          cocok(s.kodeSubkegiatan, q) ||
          cocok(s.namaSubkegiatan, q) ||
          cocok(s.indikatorKinerja, q) ||
          s.aktifitas.some(a => cocok(a.namaAktifitas, q));
        if (sCocok) subBaru.push(s);
      }
      if (subBaru.length) kegiatanBaru.push({ ...k, subkegiatan: subBaru });
    }
    if (kegiatanBaru.length) hasil.push({ ...p, kegiatan: kegiatanBaru });
  }
  return hasil;
}

function toggle<T>(set: Set<T>, key: T): Set<T> {
  const s = new Set(set);
  if (s.has(key)) s.delete(key);
  else s.add(key);
  return s;
}

function Chevron({ terbuka }: { terbuka: boolean }) {
  return terbuka ? (
    <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
  ) : (
    <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
  );
}

export default function MonitoringKinerja() {
  const { peran, bidangId: bidangSaya } = usePeran();

  const [periodes, setPeriodes] = React.useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = React.useState<number | null>(null);
  const [data, setData] = React.useState<MonitoringKinerja | null>(null);
  const [memuat, setMemuat] = React.useState(true);
  const [galat, setGalat] = React.useState<string | null>(null);

  const [cari, setCari] = React.useState('');
  const [bidangPilih, setBidangPilih] = React.useState('');
  // Bawaan: semua lipat — hanya baris program yang tampil. Isi set = yang dibuka.
  const [programBuka, setProgramBuka] = React.useState<Set<string>>(new Set());
  const [kegiatanBuka, setKegiatanBuka] = React.useState<Set<string>>(
    new Set(),
  );
  const [subBuka, setSubBuka] = React.useState<Set<number>>(new Set());
  const [semuaAktifitas, setSemuaAktifitas] = React.useState(false);

  React.useEffect(() => {
    getPeriode()
      .then(p => {
        setPeriodes(p);
        const awal =
          p.find(x => x.status === 'OPEN') ??
          p.find(x => x.status === 'LOCKED') ??
          p[0];
        setPeriodeId(awal?.id ?? null);
        if (!awal) setMemuat(false);
      })
      .catch(() => {
        setGalat('Gagal memuat daftar periode.');
        setMemuat(false);
      });
  }, []);

  React.useEffect(() => {
    if (periodeId == null) return;
    let batal = false;
    setMemuat(true);
    getMonitoringKinerja(periodeId)
      .then(d => {
        if (batal) return;
        setData(d);
        setGalat(null);
      })
      .catch(() => !batal && setGalat('Gagal memuat data monitoring kinerja.'))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [periodeId]);

  const daftarBidang = React.useMemo(() => {
    const set = new Set<string>();
    data?.program.forEach(p =>
      p.kegiatan.forEach(k =>
        k.subkegiatan.forEach(s => s.namaBidang && set.add(s.namaBidang)),
      ),
    );
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const q = cari.trim().toLowerCase();
  const memfilter = q !== '' || bidangPilih !== '';
  const terlihat = React.useMemo(
    () => saring(data?.program ?? [], q, bidangPilih),
    [data, q, bidangPilih],
  );

  const bukaSemua = () => {
    const prog = new Set<string>();
    const keg = new Set<string>();
    (data?.program ?? []).forEach(p => {
      prog.add(p.kodeProgram);
      p.kegiatan.forEach(k => keg.add(k.kodeKegiatan));
    });
    setProgramBuka(prog);
    setKegiatanBuka(keg);
  };
  const tutupSemua = () => {
    setProgramBuka(new Set());
    setKegiatanBuka(new Set());
    setSubBuka(new Set());
    setSemuaAktifitas(false);
  };

  const r = data?.ringkasan;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Monitoring Kinerja
          </h1>
        </div>
        <PilihPeriode
          periodes={periodes}
          nilai={periodeId}
          onPilih={setPeriodeId}
        />
      </div>

      {galat && (
        <div className="p-4 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">
          {galat}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {memuat && !r ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[104px] bg-white border border-slate-200 rounded-2xl animate-pulse"
            />
          ))
        ) : (
          <>
            <KartuKpi
              label="Program"
              nilai={String(r?.jumlahProgram ?? 0)}
              catatan={`${r?.jumlahKegiatan ?? 0} kegiatan`}
            />
            <KartuKpi
              label="Subkegiatan"
              nilai={String(r?.jumlahSubkegiatan ?? 0)}
              catatan="Tersusun pada periode ini"
            />
            <KartuKpi
              label="Aktifitas"
              nilai={String(r?.jumlahAktifitas ?? 0)}
              catatan="Utama & pendukung"
            />
            <KartuKpi
              label="Rata capaian subkegiatan"
              nilai={persen1(r?.rataCapaianSubkegiatan ?? 0)}
              catatan="Rata-rata seluruh subkegiatan"
            />
          </>
        )}
      </div>

      <Panel
        judul="Rincian program → kegiatan → subkegiatan → aktifitas"
        aksi={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={bukaSemua}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Buka semua
            </button>
            <button
              onClick={tutupSemua}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Tutup semua
            </button>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={semuaAktifitas}
                onChange={e => setSemuaAktifitas(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Tampilkan aktifitas
            </label>
          </div>
        }
      >
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-slate-400" />
            <input
              value={cari}
              onChange={e => setCari(e.target.value)}
              placeholder="Cari program, kegiatan, subkegiatan, atau aktifitas…"
              className="w-full py-2 pr-3 text-sm border rounded-xl border-slate-200 pl-9 text-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <select
            value={bidangPilih}
            onChange={e => setBidangPilih(e.target.value)}
            className="px-3 py-2 text-sm bg-white border rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Semua bidang</option>
            {daftarBidang.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Kode</Th>
                <Th>Uraian</Th>
                <Th>Bidang</Th>
                <Th kanan>Target</Th>
                <Th kanan>Realisasi</Th>
                <Th kanan>Bobot target</Th>
                <Th kanan>Bobot real.</Th>
                <Th kanan>Capaian</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terlihat.map(p => {
                const pTerbuka = memfilter || programBuka.has(p.kodeProgram);
                return (
                  <React.Fragment key={p.kodeProgram}>
                    <tr
                      className={`bg-slate-50/70 ${memfilter ? '' : 'cursor-pointer hover:bg-slate-100'}`}
                      onClick={() =>
                        !memfilter &&
                        setProgramBuka(s => toggle(s, p.kodeProgram))
                      }
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-500">
                        {p.kodeProgram}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Chevron terbuka={pTerbuka} />
                          <span className="text-sm font-bold text-slate-800">
                            {p.namaProgram}
                          </span>
                          <span className="text-xs whitespace-nowrap text-slate-400">
                            · {p.kegiatan.length} kegiatan
                          </span>
                        </div>
                      </td>
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <span
                          className={`text-sm font-bold tabular ${warnaCapaian(p.capaian)}`}
                        >
                          {persen1(p.capaian)}
                        </span>
                        <div className="w-20 mt-1 ml-auto">
                          <BarCapaian persen={p.capaian} />
                        </div>
                      </td>
                    </tr>

                    {pTerbuka &&
                      p.kegiatan.map(k => {
                        const kTerbuka =
                          memfilter || kegiatanBuka.has(k.kodeKegiatan);
                        return (
                          <React.Fragment key={k.kodeKegiatan}>
                            <tr
                              className={
                                memfilter
                                  ? ''
                                  : 'cursor-pointer hover:bg-slate-50'
                              }
                              onClick={() =>
                                !memfilter &&
                                setKegiatanBuka(s => toggle(s, k.kodeKegiatan))
                              }
                            >
                              <td className="px-4 py-2 font-mono text-xs whitespace-nowrap text-slate-400">
                                {k.kodeKegiatan}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2 pl-5">
                                  <Chevron terbuka={kTerbuka} />
                                  <span className="text-sm font-semibold text-slate-700">
                                    {k.namaKegiatan}
                                  </span>
                                  <span className="text-xs whitespace-nowrap text-slate-400">
                                    · {k.subkegiatan.length} subkeg
                                  </span>
                                </div>
                              </td>
                              <td />
                              <td />
                              <td />
                              <td />
                              <td />
                              <td className="px-4 py-2 text-right whitespace-nowrap">
                                <span
                                  className={`text-sm font-semibold tabular ${warnaCapaian(k.capaian)}`}
                                >
                                  {persen1(k.capaian)}
                                </span>
                              </td>
                            </tr>

                            {kTerbuka &&
                              k.subkegiatan.map(s => {
                                const aktBuka =
                                  semuaAktifitas ||
                                  subBuka.has(s.id) ||
                                  (q !== '' &&
                                    s.aktifitas.some(a =>
                                      cocok(a.namaAktifitas, q),
                                    ));
                                const saya =
                                  bidangSaya != null &&
                                  s.bidangId === bidangSaya;
                                return (
                                  <React.Fragment key={s.id}>
                                    <tr
                                      className={`cursor-pointer ${
                                        saya
                                          ? 'bg-emerald-50/50 hover:bg-emerald-50'
                                          : 'hover:bg-slate-50'
                                      }`}
                                      onClick={() =>
                                        setSubBuka(set => toggle(set, s.id))
                                      }
                                    >
                                      <td className="px-4 py-2 font-mono text-xs whitespace-nowrap text-slate-400">
                                        {s.kodeSubkegiatan}
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="flex items-start gap-2 pl-10">
                                          <span className="mt-0.5">
                                            <Chevron terbuka={aktBuka} />
                                          </span>
                                          <span className="min-w-0">
                                            <span className="text-sm text-slate-700">
                                              {s.namaSubkegiatan}
                                            </span>
                                            {s.indikatorKinerja && (
                                              <span className="mt-0.5 block text-xs text-slate-400">
                                                {s.indikatorKinerja}
                                              </span>
                                            )}
                                            {s.outputKinerja && (
                                              <span className="mt-0.5 block text-xs text-slate-500">
                                                Output: {s.outputKinerja}
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-sm whitespace-nowrap text-slate-600">
                                        {s.namaBidang ?? (
                                          <span className="text-slate-400">
                                            —
                                          </span>
                                        )}
                                        {saya && (
                                          <span className="ml-1 text-xs font-medium text-emerald-700">
                                            ◀ Anda
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-right whitespace-nowrap tabular text-slate-600">
                                        {s.target
                                          ? `${angka(s.target)} ${s.satuan}`.trim()
                                          : '—'}
                                      </td>
                                      <td className="px-4 py-2 text-right whitespace-nowrap">
                                        {peran === 'admin_aplikasi' && (
                                          <Link
                                            to={`/monitoring/subkegiatan/${s.id}`}
                                            onClick={e => e.stopPropagation()}
                                            className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 hover:underline"
                                          >
                                            Detail{' '}
                                            <ArrowUpRight className="w-3 h-3" />
                                          </Link>
                                        )}
                                      </td>
                                      <td />
                                      <td />
                                      <td className="px-4 py-2 text-right whitespace-nowrap">
                                        <span
                                          className={`text-sm font-semibold tabular ${warnaCapaian(s.capaian)}`}
                                        >
                                          {persen1(s.capaian)}
                                        </span>
                                        <div className="w-16 mt-1 ml-auto">
                                          <BarCapaian persen={s.capaian} />
                                        </div>
                                      </td>
                                    </tr>

                                    {aktBuka &&
                                      s.aktifitas.map(a => (
                                        <tr
                                          key={a.id}
                                          className="text-xs bg-white"
                                        >
                                          <td className="px-4 py-1.5 text-center font-mono text-slate-300">
                                            {a.urutan}
                                          </td>
                                          <td className="px-4 py-1.5">
                                            <div className="flex items-center gap-2 pl-16">
                                              <span
                                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                                  a.tipeAktifitas === 'UTAMA'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-600'
                                                }`}
                                              >
                                                {a.tipeAktifitas === 'UTAMA'
                                                  ? 'Utama'
                                                  : 'Pendukung'}
                                              </span>
                                              <span className="text-slate-600">
                                                {a.namaAktifitas}
                                              </span>
                                              {a.flagAdhoc && (
                                                <span className="text-[10px] text-amber-600">
                                                  ad-hoc
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td />
                                          <td className="whitespace-nowrap px-4 py-1.5 text-right tabular text-slate-500">
                                            {`${angka(a.target)}${a.satuan ? ` ${a.satuan}` : ''}`}
                                          </td>
                                          <td className="whitespace-nowrap px-4 py-1.5 text-right tabular text-slate-500">
                                            {angka(a.realisasi)}
                                          </td>
                                          <td className="whitespace-nowrap px-4 py-1.5 text-right tabular text-slate-500">
                                            {persen1(a.bobotTarget)}
                                          </td>
                                          <td className="whitespace-nowrap px-4 py-1.5 text-right font-medium tabular text-slate-700">
                                            {persen1(a.bobotRealisasi)}
                                          </td>
                                          <td />
                                        </tr>
                                      ))}
                                  </React.Fragment>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })}

              {!memuat && terlihat.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-sm text-center text-slate-500"
                  >
                    {memfilter
                      ? 'Tidak ada yang cocok dengan filter.'
                      : 'Belum ada rencana tersusun pada periode ini.'}
                  </td>
                </tr>
              )}

              {memuat && !data && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-sm text-center text-slate-400"
                  >
                    Memuat data monitoring…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
