import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import {
  getCapaianProgram,
  getPeriode,
  getRincianKegiatan,
  getRingkasanDashboard,
} from '@/services';
import type {
  Periode,
  ProgramBerurusan,
  RincianKegiatanProgram,
  SubkegiatanRinci,
} from '@/services';
import { BobotMeter } from '@/components/opera/bobot-meter';
import { usePeran } from '@/lib/peran';
import {
  BarCapaian,
  KartuKpi,
  Panel,
  PilihPeriode,
  persen1,
  warnaCapaian,
} from './bagian/ui';

const angka = (n: number) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: 2 });

/** Satu subkegiatan beserta aktifitasnya — dasar hirarki, tempat 70/30 terlihat. */
function KartuSubkegiatan({
  s,
  bidangSaya,
}: {
  s: SubkegiatanRinci;
  bidangSaya: number | null;
}) {
  const utama = s.aktifitas.find(a => a.tipeAktifitas === 'UTAMA');
  const pendukung = s.aktifitas.filter(a => a.tipeAktifitas === 'PENDUKUNG');
  const saya = s.bidangId === bidangSaya;

  return (
    <div
      className={`rounded-xl border p-4 ${saya ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-slate-400">{s.kode}</p>
          <p className="text-sm font-medium text-slate-800">{s.nama}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {s.namaBidang}
            {saya && (
              <span className="ml-1 font-medium text-emerald-700">
                ◀ Bidang Anda
              </span>
            )}
            {' · '}target {angka(s.target)} {s.satuan}
            {' · '}
            {s.indikatorKinerja}
            {s.outputKinerja && ` · Output: ${s.outputKinerja}`}
          </p>
        </div>
        <div className="w-24 text-right shrink-0">
          <span
            className={`text-base font-bold tabular ${warnaCapaian(s.capaian)}`}
          >
            {persen1(s.capaian)}
          </span>
        </div>
      </div>

      {utama && (
        <div className="mt-3">
          <BobotMeter
            tinggi={10}
            utama={{
              nama: utama.namaAktifitas,
              target: utama.target,
              realisasi: utama.realisasi,
              bobotTarget: utama.bobotTarget,
            }}
            pendukung={pendukung.map(a => ({
              nama: a.namaAktifitas,
              target: a.target,
              realisasi: a.realisasi,
              bobotTarget: a.bobotTarget,
            }))}
          />
        </div>
      )}
      {!utama && (
        <p className="px-3 py-2 mt-3 text-xs text-red-600 rounded-lg bg-red-50">
          Tanpa aktifitas utama — tidak ada pemegang bobot 70%.
        </p>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="py-1.5 pr-3 text-left font-medium uppercase tracking-wider">
                Aktifitas
              </th>
              <th className="py-1.5 px-2 text-right font-medium uppercase tracking-wider whitespace-nowrap">
                Bobot
              </th>
              <th className="py-1.5 px-2 text-right font-medium uppercase tracking-wider whitespace-nowrap">
                Realisasi
              </th>
              <th className="py-1.5 pl-2 text-right font-medium uppercase tracking-wider whitespace-nowrap">
                Bobot real.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {s.aktifitas.map(a => (
              <tr key={a.indikatorBidangId}>
                <td className="py-1.5 pr-3">
                  <span
                    className={`mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      a.tipeAktifitas === 'UTAMA'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {a.tipeAktifitas === 'UTAMA' ? 'Utama' : 'Pendukung'}
                  </span>
                  <span className="text-slate-700">{a.namaAktifitas}</span>
                  {a.jumlahCatatan === 0 && (
                    <span className="ml-1.5 text-[11px] text-amber-600">
                      belum dicatat
                    </span>
                  )}
                </td>
                <td className="py-1.5 px-2 text-right tabular text-slate-500">
                  {persen1(a.bobotTarget)}
                </td>
                <td className="py-1.5 px-2 text-right tabular whitespace-nowrap text-slate-600">
                  {angka(a.realisasi)} / {angka(a.target)}
                </td>
                <td className="py-1.5 pl-2 text-right font-medium tabular text-slate-700">
                  {persen1(a.bobotRealisasi)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Baris kegiatan yang bisa dibuka sampai aktifitas. Rinciannya dimuat
 * saat dibuka, bukan di awal — satu program bisa punya 8 kegiatan. */
function BarisKegiatan({
  k,
  periodeId,
  bidangSaya,
}: {
  k: RincianKegiatanProgram;
  periodeId: number;
  bidangSaya: number | null;
}) {
  const [buka, setBuka] = React.useState(false);
  const [rinci, setRinci] = React.useState<SubkegiatanRinci[] | null>(null);

  React.useEffect(() => {
    if (!buka || rinci) return;
    let batal = false;
    getRincianKegiatan(k.kegiatanId, periodeId).then(
      d => !batal && setRinci(d),
    );
    return () => {
      batal = true;
    };
  }, [buka, rinci, k.kegiatanId, periodeId]);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setBuka(v => !v)}
        aria-expanded={buka}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
      >
        {buka ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[11px] text-slate-400">
            {k.kodeKegiatan}
          </p>
          <p className="text-sm text-slate-700 line-clamp-1">
            {k.namaKegiatan}
          </p>
        </div>
        <span className="text-xs shrink-0 tabular text-slate-400">
          {k.jumlahSubkegiatan} subkeg
        </span>
        <span
          className={`w-16 shrink-0 text-right text-sm font-semibold tabular ${warnaCapaian(k.capaian)}`}
        >
          {persen1(k.capaian)}
        </span>
      </button>

      {buka && (
        <div className="px-4 pb-4 pl-10 space-y-3">
          {!rinci && (
            <p className="py-3 text-xs text-slate-400">Memuat rincian…</p>
          )}
          {rinci?.length === 0 && (
            <p className="py-3 text-xs text-slate-500">
              Kegiatan ini belum punya subkegiatan tersusun pada periode ini.
            </p>
          )}
          {rinci?.map(s => (
            <KartuSubkegiatan
              key={s.subkegiatanBidangId}
              s={s}
              bidangSaya={bidangSaya}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Satu program: ringkasan yang bisa dibuka jadi rincian bidang + kegiatan. */
function BarisProgram({
  p,
  periodeId,
  bidangSaya,
}: {
  p: ProgramBerurusan;
  periodeId: number;
  bidangSaya: number | null;
}) {
  const [buka, setBuka] = React.useState(false);
  const punyaBidangSaya =
    bidangSaya != null && p.perBidang.some(b => b.bidangId === bidangSaya);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setBuka(v => !v)}
        aria-expanded={buka}
        className="flex items-center w-full gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50"
      >
        {buka ? (
          <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-slate-400">{p.kodeProgram}</p>
          <p className="text-sm font-medium text-slate-800 line-clamp-2">
            {p.namaProgram}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {p.jumlahSubkegiatan} subkegiatan · {p.perKegiatan.length} kegiatan
            · {p.perBidang.length} bidang
            {punyaBidangSaya && (
              <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                bidang Anda terlibat
              </span>
            )}
          </p>
        </div>

        <div className="text-right w-28 shrink-0">
          <span
            className={`text-lg font-bold tabular ${warnaCapaian(p.capaian)}`}
          >
            {persen1(p.capaian)}
          </span>
          <div className="mt-1.5">
            <BarCapaian persen={p.capaian} />
          </div>
        </div>
      </button>

      {buka && (
        <div className="px-6 pb-5 space-y-4 bg-slate-50/40">
          <div className="overflow-hidden bg-white border border-slate-200 rounded-xl">
            <p className="px-4 py-2 text-xs font-semibold tracking-wider uppercase border-b border-slate-100 text-slate-500">
              Per bidang
            </p>
            <table className="min-w-full">
              <tbody className="divide-y divide-slate-100">
                {p.perBidang.map(b => {
                  const saya = b.bidangId === bidangSaya;
                  return (
                    <tr
                      key={b.bidangId}
                      className={saya ? 'bg-emerald-50/60' : undefined}
                    >
                      <td className="px-4 py-2 text-sm text-slate-700">
                        {b.namaBidang}
                        {saya && (
                          <span className="ml-1.5 text-xs font-medium text-emerald-700">
                            ◀ Bidang Anda
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-right tabular text-slate-400">
                        {b.jumlahSubkegiatan} subkeg
                      </td>
                      <td
                        className={`px-4 py-2 text-right text-sm font-semibold tabular ${warnaCapaian(b.capaian)}`}
                      >
                        {persen1(b.capaian)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden bg-white border border-slate-200 rounded-xl">
            <p className="px-4 py-2 text-xs font-semibold tracking-wider uppercase border-b border-slate-100 text-slate-500">
              Per kegiatan — buka untuk melihat subkegiatan dan aktifitasnya
            </p>
            {p.perKegiatan.map(k => (
              <BarisKegiatan
                key={k.kegiatanId}
                k={k}
                periodeId={periodeId}
                bidangSaya={bidangSaya}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CapaianProgram() {
  const { bidangId } = usePeran();
  const [periodes, setPeriodes] = React.useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = React.useState<number | null>(null);
  const [programs, setPrograms] = React.useState<ProgramBerurusan[]>([]);
  const [jumlahSubkegiatan, setJumlahSubkegiatan] = React.useState(0);
  const [memuat, setMemuat] = React.useState(true);
  const [galat, setGalat] = React.useState<string | null>(null);

  React.useEffect(() => {
    getPeriode()
      .then(p => {
        setPeriodes(p);
        setPeriodeId((p.find(x => x.status === 'OPEN') ?? p[0])?.id ?? null);
      })
      .catch(() => setGalat('Gagal memuat periode.'));
  }, []);

  React.useEffect(() => {
    if (periodeId == null) return;
    let batal = false;
    setMemuat(true);
    Promise.all([
      getCapaianProgram(periodeId),
      getRingkasanDashboard(periodeId),
    ])
      .then(([cp, ring]) => {
        if (batal) return;
        setPrograms(cp);
        setJumlahSubkegiatan(ring?.jumlahSubkegiatan ?? 0);
      })
      .catch(() => !batal && setGalat('Gagal memuat capaian program.'))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [periodeId]);

  const terurut = [...programs].sort((a, b) => b.capaian - a.capaian);
  const tertinggi = terurut[0];
  const terendah = terurut[terurut.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Capaian Program</h1>
          <p className="mt-1 text-sm text-slate-500">
            Capaian tiap program pada periode terpilih. Buka satu baris untuk
            melihat rinciannya per bidang dan per kegiatan.
          </p>
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
        {memuat ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[104px] bg-white border border-slate-200 rounded-2xl animate-pulse"
            />
          ))
        ) : (
          <>
            <KartuKpi
              label="Program aktif"
              nilai={String(programs.length)}
              catatan="Pada periode terpilih"
            />
            <KartuKpi
              label="Subkegiatan tersusun"
              nilai={String(jumlahSubkegiatan)}
              catatan="Pada periode terpilih"
            />
            <KartuKpi
              label="Capaian tertinggi"
              nilai={tertinggi ? persen1(tertinggi.capaian) : '—'}
              catatan={tertinggi?.kodeProgram}
            />
            <KartuKpi
              label="Capaian terendah"
              nilai={terendah ? persen1(terendah.capaian) : '—'}
              catatan={terendah?.kodeProgram}
            />
          </>
        )}
      </div>

      {!memuat && programs.length > 0 && (
        <Panel
          judul="Program"
          aksi={
            <span className="text-xs text-slate-500">
              {programs.length} program · {jumlahSubkegiatan} subkegiatan
            </span>
          }
        >
          <div>
            {programs.map(p => (
              <BarisProgram
                key={`${p.kodeProgram}-${p.programId}`}
                p={p}
                periodeId={periodeId!}
                bidangSaya={bidangId}
              />
            ))}
          </div>
        </Panel>
      )}

      {!memuat && programs.length === 0 && (
        <Panel>
          <p className="p-8 text-sm text-center text-slate-500">
            Belum ada program tersusun pada periode ini.
          </p>
        </Panel>
      )}
    </div>
  );
}
