import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  ChartBar,
  ChartColumn,
  ChartPie,
  List,
  ListChecks,
  Pentagon,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KerangkaPublik } from './publik/KerangkaPublik';
import { apiMessage } from '../services/api';
import { persen1 } from '../lib/format-angka';
import {
  getLandingPublik,
  type LandingPublik,
  type SebaranCapaianPublik,
} from '../services/public-dashboard.service';

// Palet hijau–emas tema Tabalong; kecerahan berselang-seling supaya potongan donut
// yang bersebelahan tetap terbedakan. Nilainya hidup di landing.css.
const WARNA_BIDANG = [
  'var(--lp-c1)',
  'var(--lp-c2)',
  'var(--lp-c3)',
  'var(--lp-c4)',
  'var(--lp-c5)',
  'var(--lp-c6)',
  'var(--lp-c7)',
];
const BULAN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const RENTANG: Record<
  SebaranCapaianPublik['rentang'],
  { label: string; deskripsi: string }
> = {
  '0': { label: '0%', deskripsi: 'Belum dimulai' },
  '1-24': { label: '1–24', deskripsi: 'Capaian 1–24%' },
  '25-49': { label: '25–49', deskripsi: 'Capaian 25–49%' },
  '50-74': { label: '50–74', deskripsi: 'Capaian 50–74%' },
  '75-99': { label: '75–99', deskripsi: 'Capaian 75–99%' },
  '100': { label: '100%', deskripsi: 'Tuntas' },
};
const TEKS_SUMBU = { fontSize: 11, fill: 'var(--lp-fg-3)', fontWeight: 500 };

const angka = (n: number) => n.toLocaleString('id-ID');
// Nama program di katalog ditulis kapital semua; tampilkan sebagai huruf judul, kata sambung tetap kecil.
const KATA_SAMBUNG = new Set([
  'dan',
  'atau',
  'di',
  'ke',
  'dari',
  'untuk',
  'yang',
]);
const hurufJudul = (teks: string) =>
  teks
    .toLowerCase()
    .split(' ')
    .map((kata, i) =>
      i > 0 && KATA_SAMBUNG.has(kata)
        ? kata
        : kata.replace(
            /(^|\/)(\p{L})/gu,
            (_, awal: string, huruf: string) => awal + huruf.toUpperCase(),
          ),
    )
    .join(' ');
// Batang hitungan bernilai 0 tidak digambar; batang bernilai kecil tetap terlihat.
const tinggiMinimal = (nilai: number | null | undefined) =>
  Number(nilai) > 0 ? 3 : 0;

/** Skala sumbu Y yang bulat: empat langkah sama besar, minimal 0–4. */
function skalaBulat(nilaiMaks: number) {
  if (nilaiMaks <= 4) return { maks: 4, ticks: [0, 1, 2, 3, 4] };
  const pangkat = 10 ** Math.floor(Math.log10(nilaiMaks / 4));
  const langkah =
    [1, 2, 2.5, 5, 10].map(x => x * pangkat).find(x => x * 4 >= nilaiMaks) ??
    pangkat * 10;
  return { maks: langkah * 4, ticks: [0, 1, 2, 3, 4].map(i => i * langkah) };
}

type BidangTampil = {
  id: number;
  nama: string;
  jumlahSubkegiatan: number;
  capaian: number;
  porsi: number;
  warna: string;
};

function KepalaBagian({
  ikon,
  eyebrow,
  judul,
  keterangan,
  id,
}: {
  ikon: ReactNode;
  eyebrow: string;
  judul: string;
  keterangan: string;
  id: string;
}) {
  return (
    <div className="lp-sec-head">
      <div>
        <p className="lp-eyebrow">
          {ikon}
          {eyebrow}
        </p>
        <h2 id={id}>{judul}</h2>
        <p className="lp-sub">{keterangan}</p>
      </div>
    </div>
  );
}

function KotakTooltip({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div className="lp-tip">
      <b>{judul}</b>
      {isi}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LandingPublik | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aktif, setAktif] = useState<number | null>(null);

  useEffect(() => {
    getLandingPublik()
      .then(setData)
      .catch(err => {
        console.error('Failed to fetch dashboard data', err);
        setError(apiMessage(err, 'Gagal memuat dashboard publik.'));
      })
      .finally(() => setLoading(false));
  }, []);

  const bidang = useMemo<BidangTampil[]>(() => {
    if (!data) return [];
    const porsi = new Map(
      data.distribusi.map(d => [d.bidang_id, d.persentase]),
    );
    return data.bidang.map((b, i) => ({
      id: b.bidang_id,
      nama: b.nama_bidang,
      jumlahSubkegiatan: b.jumlah_subkegiatan,
      capaian: Number(b.capaian_bidang),
      porsi: Number(porsi.get(b.bidang_id) ?? 0),
      warna: WARNA_BIDANG[i % WARNA_BIDANG.length],
    }));
  }, [data]);

  const program = useMemo(
    () =>
      (data?.program ?? []).map(p => ({
        kode: p.kode_program,
        nama: hurufJudul(p.nama_program),
        jumlahSubkegiatan: p.jumlah_subkegiatan,
        capaian: Number(p.capaian),
      })),
    [data],
  );

  const realisasi = useMemo(() => {
    const baris = (data?.realisasi_bulanan ?? []).map(b => {
      const [tahun, bulan] = b.bulan.split('-');
      const i = Number(bulan) - 1;
      return {
        label: BULAN[i],
        nama: `${NAMA_BULAN[i]} ${tahun}`,
        jumlah: b.jumlah,
        berjalan: b.sudah_berjalan,
      };
    });
    const berjalan = baris.filter(b => b.berjalan);
    const total = berjalan.reduce((t, b) => t + b.jumlah, 0);
    const puncak = berjalan.reduce<(typeof baris)[number] | null>(
      (p, b) => (b.jumlah > (p?.jumlah ?? 0) ? b : p),
      null,
    );
    const skala = skalaBulat(Math.max(0, ...berjalan.map(b => b.jumlah)));
    // Bulan yang belum berjalan digambar setinggi sumbu dengan arsiran, bukan batang nol.
    const grafik = baris.map(b => ({
      ...b,
      tinggi: b.berjalan ? b.jumlah : skala.maks,
      puncak: b === puncak,
    }));
    return { baris, grafik, berjalan: berjalan.length, total, puncak, skala };
  }, [data]);

  const sebaran = useMemo(() => {
    const baris = (data?.sebaran_capaian ?? []).map(s => ({
      ...s,
      ...RENTANG[s.rentang],
    }));
    const jumlah = (r: SebaranCapaianPublik['rentang']) =>
      baris.find(b => b.rentang === r)?.jumlah ?? 0;
    return {
      baris,
      skala: skalaBulat(Math.max(0, ...baris.map(b => b.jumlah))),
      belum: jumlah('0'),
      tuntas: jumlah('100'),
      berjalan: baris
        .filter(b => b.rentang !== '0' && b.rentang !== '100')
        .reduce((t, b) => t + b.jumlah, 0),
    };
  }, [data]);

  const periode = data?.periode ?? null;
  const summary = data?.summary ?? null;
  const bidangAktif = aktif !== null ? bidang[aktif] : null;
  const catatanRealisasi =
    realisasi.berjalan === 0
      ? 'Belum ada bulan dalam periode ini yang sudah berjalan, jadi belum ada realisasi yang bisa dihitung.'
      : realisasi.total === 0
        ? 'Belum ada laporan realisasi pada bulan-bulan yang sudah berjalan.'
        : `Kolom emas menandai bulan dengan laporan terbanyak.${realisasi.berjalan < realisasi.baris.length ? ' Kolom berarsir adalah bulan yang belum berjalan.' : ''}`;

  return (
    <KerangkaPublik
      nav={
        periode && (
          <ul>
            <li>
              <a href="#ringkasan">Ringkasan</a>
            </li>
            <li>
              <a href="#porsi">Porsi Bidang</a>
            </li>
            <li>
              <a href="#capaian">Capaian</a>
            </li>
            {program.length > 0 && (
              <li>
                <a href="#program">Program</a>
              </li>
            )}
            {realisasi.baris.length > 0 && (
              <li>
                <a href="#realisasi">Realisasi</a>
              </li>
            )}
            <li>
              <a href="#profil">Profil Kinerja</a>
            </li>
            {sebaran.baris.length > 0 && (
              <li>
                <a href="#sebaran">Sebaran</a>
              </li>
            )}
            <li>
              <a href="#bidang">Bidang</a>
            </li>
          </ul>
        )
      }
    >
        {loading ? (
          <div className="lp-container lp-empty">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="lp-container lp-empty">
            <p role="alert" style={{ color: '#b91c1c' }}>
              {error}
            </p>
          </div>
        ) : !periode || !summary ? (
          // Backend hanya mempublikasikan periode OPEN/LOCKED. Tanpa itu jangan
          // gambar grafik kosong dan "0,0%" — angka nol terbaca sebagai kinerja nol.
          <div className="lp-container lp-empty">
            <CalendarClock
              className="mx-auto"
              size={40}
              color="var(--lp-primary-text)"
            />
            <h2 style={{ marginTop: 20 }}>
              Belum ada periode kinerja yang dipublikasikan
            </h2>
            <p>
              Capaian kinerja Bapperrida akan tampil di halaman ini setelah
              periode pelaksanaan dibuka. Periode yang masih dalam tahap
              penyusunan rencana belum ditampilkan untuk publik.
            </p>
          </div>
        ) : (
          <>
            {/* Pembuka */}
            <section
              className="lp-hero"
              id="ringkasan"
              aria-labelledby="lp-h-hero"
            >
              <div className="lp-container lp-hero-grid">
                <div>
                  <p className="lp-welcome">Capaian kinerja perangkat daerah</p>
                  <p
                    className="lp-big num"
                    aria-label={`Capaian keseluruhan ${persen1(Number(summary.capaian_pd))}`}
                  >
                    {persen1(Number(summary.capaian_pd)).replace('%', '')}
                    <small>%</small>
                  </p>
                  <h1 id="lp-h-hero">
                    Capaian Keseluruhan <span>{periode.nama_periode}</span>
                  </h1>
                  <div className="lp-hero-meta">
                    <span className="lp-badge">
                      {periode.status === 'OPEN'
                        ? 'Sedang berjalan'
                        : 'Sudah dikunci'}
                    </span>
                    <span>Rata-rata capaian seluruh subkegiatan</span>
                  </div>
                </div>
                <ul className="lp-facts num">
                  {[
                    [summary.jumlah_bidang, 'Bidang'],
                    [summary.jumlah_program, 'Program'],
                    [summary.jumlah_subkegiatan, 'Subkegiatan'],
                    ...(summary.jumlah_aktifitas !== undefined
                      ? [[summary.jumlah_aktifitas, 'Aktivitas'] as const]
                      : []),
                  ].map(([n, label]) => (
                    <li key={label}>
                      <b>{angka(Number(n))}</b>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Porsi subkegiatan per bidang */}
            <section
              className="lp-band lp-sec"
              id="porsi"
              aria-labelledby="lp-h-porsi"
            >
              <div className="lp-container">
                <KepalaBagian
                  id="lp-h-porsi"
                  ikon={<ChartPie size={12} />}
                  eyebrow="Sebaran subkegiatan"
                  judul="Porsi Subkegiatan Tiap Bidang"
                  keterangan={`${summary.jumlah_bidang} bidang memegang ${angka(summary.jumlah_subkegiatan)} subkegiatan pada periode ini. Arahkan kursor ke potongan untuk melihat rinciannya.`}
                />
                <div className="lp-donut-grid">
                  <div className="lp-donut">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 380, height: 380 }}
                    >
                      <PieChart>
                        <Pie
                          data={bidang}
                          dataKey="porsi"
                          nameKey="nama"
                          innerRadius="71%"
                          outerRadius="100%"
                          paddingAngle={1.5}
                          stroke="none"
                          isAnimationActive={false}
                          onMouseEnter={(_, i) => setAktif(i)}
                          onMouseLeave={() => setAktif(null)}
                        >
                          {bidang.map((b, i) => (
                            <Cell
                              key={b.id}
                              fill={b.warna}
                              opacity={aktif === null || aktif === i ? 1 : 0.3}
                              style={{
                                cursor: 'pointer',
                                transition: 'opacity .25s',
                              }}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="lp-donut-mid">
                      {bidangAktif ? (
                        <>
                          <b className="num">{persen1(bidangAktif.porsi)}</b>
                          <span>
                            {bidangAktif.nama} · {bidangAktif.jumlahSubkegiatan}{' '}
                            subkegiatan
                          </span>
                        </>
                      ) : (
                        <>
                          <b className="num">
                            {angka(summary.jumlah_subkegiatan)}
                          </b>
                          <span>
                            subkegiatan di {summary.jumlah_bidang} bidang
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ul
                    className={`lp-legend num${aktif !== null ? ' lp-hovering' : ''}`}
                  >
                    {bidang.map((b, i) => (
                      <li
                        key={b.id}
                        className={aktif === i ? 'lp-on' : undefined}
                        onMouseEnter={() => setAktif(i)}
                        onMouseLeave={() => setAktif(null)}
                      >
                        <i style={{ background: b.warna }} />
                        <span className="lp-nm">{b.nama}</span>
                        <span className="lp-sk">
                          {b.jumlahSubkegiatan} subkegiatan
                        </span>
                        <span className="lp-pc">{persen1(b.porsi)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Capaian per bidang */}
            <section
              className="lp-sec"
              id="capaian"
              aria-labelledby="lp-h-capaian"
            >
              <div className="lp-container">
                <KepalaBagian
                  id="lp-h-capaian"
                  ikon={<ChartBar size={12} />}
                  eyebrow="Capaian per bidang"
                  judul="Capaian Per Bidang"
                  keterangan="Persentase capaian terhadap target tahunan, dalam skala 0 sampai 100."
                />
                <div
                  className="lp-chart"
                  style={{ height: Math.max(240, bidang.length * 52 + 40) }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    initialDimension={{ width: 900, height: 400 }}
                  >
                    <BarChart
                      data={bidang}
                      layout="vertical"
                      margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke="var(--lp-hair)"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={TEKS_SUMBU}
                      />
                      <YAxis
                        type="category"
                        dataKey="nama"
                        width={150}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          ...TEKS_SUMBU,
                          fontSize: 13,
                          fontWeight: 600,
                          fill: 'var(--lp-fg)',
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--lp-base-200)', opacity: 0.7 }}
                        content={({ active, payload }) => {
                          const b = payload?.[0]?.payload as
                            | BidangTampil
                            | undefined;
                          return active && b ? (
                            <KotakTooltip
                              judul={b.nama}
                              isi={`Capaian ${persen1(b.capaian)} · ${b.jumlahSubkegiatan} subkegiatan`}
                            />
                          ) : null;
                        }}
                      />
                      <Bar
                        dataKey="capaian"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={26}
                        minPointSize={3}
                      >
                        {bidang.map(b => (
                          <Cell key={b.id} fill={b.warna} />
                        ))}
                        <LabelList
                          dataKey="capaian"
                          position="right"
                          formatter={v => persen1(Number(v))}
                          style={{
                            fontFamily: 'var(--lp-font-display)',
                            fontSize: 15,
                            fontWeight: 700,
                            fill: 'var(--lp-fg)',
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Capaian per program */}
            {program.length > 0 && (
              <section
                className="lp-sec lp-tint"
                id="program"
                aria-labelledby="lp-h-program"
              >
                <div className="lp-container">
                  <KepalaBagian
                    id="lp-h-program"
                    ikon={<ListChecks size={12} />}
                    eyebrow="Capaian per program"
                    judul="Capaian Per Program"
                    keterangan="Rata-rata capaian subkegiatan di setiap program, dalam skala 0 sampai 100."
                  />
                  <div className="num">
                    {program.map(p => (
                      <div className="lp-prog" key={p.kode}>
                        <div>
                          <h3>
                            {p.nama}
                            {p.capaian >= 100 ? (
                              <span className="lp-badge lp-tuntas">Tuntas</span>
                            ) : p.capaian > 0 ? (
                              <span className="lp-badge">Berjalan</span>
                            ) : null}
                          </h3>
                          <div className="lp-row-meta">
                            {p.jumlahSubkegiatan} subkegiatan
                          </div>
                        </div>
                        <div
                          className="lp-line lp-line-grad"
                          aria-hidden="true"
                        >
                          <b
                            style={{ width: `${Math.min(100, p.capaian)}%` }}
                          />
                        </div>
                        <div
                          className={`lp-pct${p.capaian > 0 ? '' : ' lp-zero'}`}
                        >
                          {persen1(p.capaian)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="lp-prog-skala num" aria-hidden="true">
                    <span />
                    <div>
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                    <span />
                  </div>
                </div>
              </section>
            )}

            {/* Realisasi per bulan */}
            {realisasi.baris.length > 0 && (
              <section
                className="lp-sec"
                id="realisasi"
                aria-labelledby="lp-h-realisasi"
              >
                <div className="lp-container">
                  <KepalaBagian
                    id="lp-h-realisasi"
                    ikon={<CalendarDays size={12} />}
                    eyebrow="Realisasi per bulan"
                    judul="Ritme Kerja Sepanjang Tahun"
                    keterangan="Jumlah laporan realisasi yang masuk, dikelompokkan menurut tanggal kegiatan."
                  />
                  <div className="lp-chart" style={{ height: 300 }}>
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 900, height: 300 }}
                    >
                      <BarChart
                        data={realisasi.grafik}
                        margin={{ top: 24, right: 8, left: -12, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="lp-hijau"
                            x1="0"
                            y1="1"
                            x2="0"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="var(--lp-primary)" />
                            <stop
                              offset="100%"
                              stopColor="var(--lp-green-light)"
                            />
                          </linearGradient>
                          <linearGradient
                            id="lp-emas"
                            x1="0"
                            y1="1"
                            x2="0"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="var(--lp-gold-dim)" />
                            <stop offset="100%" stopColor="var(--lp-gold)" />
                          </linearGradient>
                          <pattern
                            id="lp-arsir"
                            width="7"
                            height="7"
                            patternUnits="userSpaceOnUse"
                            patternTransform="rotate(45)"
                          >
                            <rect
                              width="7"
                              height="7"
                              fill="var(--lp-base-100)"
                              fillOpacity={0.4}
                            />
                            <line
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="7"
                              stroke="var(--lp-base-300)"
                              strokeWidth={1.5}
                            />
                          </pattern>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--lp-hair)"
                        />
                        <XAxis
                          dataKey="label"
                          axisLine={{ stroke: 'var(--lp-base-300)' }}
                          tickLine={false}
                          tick={TEKS_SUMBU}
                          interval={0}
                        />
                        <YAxis
                          domain={[0, realisasi.skala.maks]}
                          ticks={realisasi.skala.ticks}
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={TEKS_SUMBU}
                        />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            const b = payload?.[0]?.payload as
                              | (typeof realisasi.grafik)[number]
                              | undefined;
                            if (!active || !b) return null;
                            return (
                              <KotakTooltip
                                judul={b.nama}
                                isi={
                                  b.berjalan
                                    ? `${angka(b.jumlah)} laporan realisasi`
                                    : 'Bulan belum berjalan'
                                }
                              />
                            );
                          }}
                        />
                        <Bar
                          dataKey="tinggi"
                          radius={[6, 6, 2, 2]}
                          maxBarSize={52}
                          minPointSize={tinggiMinimal}
                        >
                          {realisasi.grafik.map(b => (
                            <Cell
                              key={b.label}
                              fill={
                                !b.berjalan
                                  ? 'url(#lp-arsir)'
                                  : b.puncak
                                    ? 'url(#lp-emas)'
                                    : 'url(#lp-hijau)'
                              }
                            />
                          ))}
                          <LabelList
                            dataKey="tinggi"
                            position="top"
                            content={({ x, y, width, index }) => {
                              const b = realisasi.grafik[Number(index)];
                              if (!b?.berjalan) return null;
                              return (
                                <text
                                  x={Number(x) + Number(width) / 2}
                                  y={Number(y) - 6}
                                  textAnchor="middle"
                                  fontSize={12}
                                  fontWeight={600}
                                  fill={
                                    b.jumlah ? 'var(--lp-fg)' : 'var(--lp-fg-3)'
                                  }
                                >
                                  {angka(b.jumlah)}
                                </text>
                              );
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    className="lp-foot-facts num"
                    aria-label="Ringkasan realisasi per bulan"
                  >
                    <div>
                      <b>{angka(realisasi.total)}</b>
                      <span>Laporan realisasi</span>
                    </div>
                    <div>
                      <b>{realisasi.puncak ? realisasi.puncak.nama : '–'}</b>
                      <span>Bulan tersibuk</span>
                    </div>
                    <div>
                      <b>
                        {realisasi.berjalan}/{realisasi.baris.length}
                      </b>
                      <span>Bulan berjalan</span>
                    </div>
                  </div>
                  <p className="lp-note">{catatanRealisasi}</p>
                </div>
              </section>
            )}

            {/* Profil kinerja */}
            <section
              className="lp-sec lp-tint"
              id="profil"
              aria-labelledby="lp-h-profil"
            >
              <div className="lp-container">
                <KepalaBagian
                  id="lp-h-profil"
                  ikon={<Pentagon size={12} />}
                  eyebrow="Profil kinerja"
                  judul="Profil Kinerja Antarbidang"
                  keterangan="Semakin bulat dan lebar bentuknya, semakin merata capaian antarbidang. Cincin menandai 25, 50, 75, dan 100 persen."
                />
                <div className="lp-radar-wrap">
                  <div className="lp-chart" style={{ height: 420 }}>
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 640, height: 420 }}
                    >
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="72%"
                        data={bidang}
                      >
                        <defs>
                          <linearGradient
                            id="lp-radar"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--lp-primary)"
                              stopOpacity={0.55}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--lp-gold)"
                              stopOpacity={0.35}
                            />
                          </linearGradient>
                        </defs>
                        <PolarGrid stroke="var(--lp-base-300)" />
                        <PolarAngleAxis
                          dataKey="nama"
                          tick={{
                            ...TEKS_SUMBU,
                            fontSize: 13,
                            fontWeight: 600,
                            fill: 'var(--lp-fg)',
                          }}
                        />
                        {/* Sumbu angka di celah antara dua bidang pertama, supaya tidak menimpa label di puncak. */}
                        <PolarRadiusAxis
                          angle={90 - 180 / Math.max(bidang.length, 1)}
                          domain={[0, 100]}
                          tickCount={5}
                          tick={{ ...TEKS_SUMBU, fontSize: 10 }}
                          axisLine={false}
                        />
                        <Radar
                          name="Capaian"
                          dataKey="capaian"
                          stroke="var(--lp-primary)"
                          strokeWidth={3}
                          fill="url(#lp-radar)"
                          fillOpacity={1}
                          dot={{
                            r: 4,
                            fill: 'var(--lp-gold-dim)',
                            stroke: 'var(--lp-base-100)',
                            strokeWidth: 2,
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            const b = payload?.[0]?.payload as
                              | BidangTampil
                              | undefined;
                            return active && b ? (
                              <KotakTooltip
                                judul={b.nama}
                                isi={`Capaian ${persen1(b.capaian)}`}
                              />
                            ) : null;
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="lp-radar-read num">
                    {bidang.map(b => (
                      <li key={b.id}>
                        <span>{b.nama}</span>
                        <b className={b.capaian === 0 ? 'lp-zero' : undefined}>
                          {persen1(b.capaian)}
                        </b>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Sebaran capaian subkegiatan */}
            {sebaran.baris.length > 0 && (
              <section
                className="lp-sec"
                id="sebaran"
                aria-labelledby="lp-h-sebaran"
              >
                <div className="lp-container">
                  <KepalaBagian
                    id="lp-h-sebaran"
                    ikon={<ChartColumn size={12} />}
                    eyebrow="Sebaran capaian"
                    judul="Sebaran Capaian Subkegiatan"
                    keterangan="Berapa subkegiatan yang berada di tiap rentang capaian. Kolom abu menandai subkegiatan yang belum dimulai."
                  />
                  <div className="lp-chart" style={{ height: 300 }}>
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 900, height: 300 }}
                    >
                      <BarChart
                        data={sebaran.baris}
                        margin={{ top: 24, right: 8, left: -12, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="lp-hijau-2"
                            x1="0"
                            y1="1"
                            x2="0"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="var(--lp-primary)" />
                            <stop
                              offset="100%"
                              stopColor="var(--lp-green-light)"
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--lp-hair)"
                        />
                        <XAxis
                          dataKey="label"
                          axisLine={{ stroke: 'var(--lp-base-300)' }}
                          tickLine={false}
                          tick={TEKS_SUMBU}
                          interval={0}
                        />
                        <YAxis
                          domain={[0, sebaran.skala.maks]}
                          ticks={sebaran.skala.ticks}
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={TEKS_SUMBU}
                        />
                        <Tooltip
                          cursor={{ fill: 'var(--lp-base-200)', opacity: 0.7 }}
                          content={({ active, payload }) => {
                            const b = payload?.[0]?.payload as
                              | (typeof sebaran.baris)[number]
                              | undefined;
                            return active && b ? (
                              <KotakTooltip
                                judul={b.deskripsi}
                                isi={`${angka(b.jumlah)} subkegiatan`}
                              />
                            ) : null;
                          }}
                        />
                        <Bar
                          dataKey="jumlah"
                          radius={[6, 6, 2, 2]}
                          maxBarSize={64}
                          minPointSize={tinggiMinimal}
                        >
                          {sebaran.baris.map(b => (
                            <Cell
                              key={b.rentang}
                              fill={
                                b.rentang === '0'
                                  ? 'var(--lp-base-300)'
                                  : 'url(#lp-hijau-2)'
                              }
                            />
                          ))}
                          <LabelList
                            dataKey="jumlah"
                            position="top"
                            formatter={v => angka(Number(v))}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              fill: 'var(--lp-fg)',
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    className="lp-foot-facts num"
                    aria-label="Ringkasan sebaran capaian"
                  >
                    <div>
                      <b>{angka(sebaran.belum)}</b>
                      <span>Belum dimulai</span>
                    </div>
                    <div>
                      <b>{angka(sebaran.berjalan)}</b>
                      <span>Berjalan</span>
                    </div>
                    <div>
                      <b>{angka(sebaran.tuntas)}</b>
                      <span>Tuntas</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Daftar bidang */}
            <section
              className="lp-sec lp-tint"
              id="bidang"
              aria-labelledby="lp-h-bidang"
            >
              <div className="lp-container">
                <KepalaBagian
                  id="lp-h-bidang"
                  ikon={<List size={12} />}
                  eyebrow="Bidang"
                  judul={`Rincian ${bidang.length} Bidang`}
                  keterangan="Pilih bidang untuk melihat capaian setiap subkegiatannya."
                />
                <div className="num">
                  {bidang.map(b => (
                    <div className="lp-row" key={b.id}>
                      <div>
                        <h3>
                          {b.nama}
                          {b.capaian >= 100 ? (
                            <span className="lp-badge lp-tuntas">Tuntas</span>
                          ) : b.capaian > 0 ? (
                            <span className="lp-badge">Berjalan</span>
                          ) : (
                            <span className="lp-badge lp-quiet">
                              Belum dimulai
                            </span>
                          )}
                        </h3>
                        <div className="lp-row-meta">
                          {b.jumlahSubkegiatan} subkegiatan · {persen1(b.porsi)}{' '}
                          dari total
                        </div>
                      </div>
                      <div className="lp-line" aria-hidden="true">
                        <b
                          style={{
                            width: `${Math.min(100, b.capaian)}%`,
                            background: b.warna,
                          }}
                        />
                      </div>
                      <div
                        className={`lp-pct${b.capaian > 0 ? '' : ' lp-zero'}`}
                      >
                        {persen1(b.capaian)}
                      </div>
                      <button
                        type="button"
                        className="lp-go"
                        onClick={() => navigate(`/detail?bidang=${b.id}`)}
                        aria-label={`Lihat detail ${b.nama}`}
                      >
                        Lihat detail <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
    </KerangkaPublik>
  );
}
