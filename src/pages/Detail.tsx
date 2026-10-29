import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ListChecks } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { KerangkaPublik } from './publik/KerangkaPublik';
import { apiMessage } from '../services/api';
import { persen1 } from '../lib/format-angka';
import {
  getDetailBidangPublik,
  type DetailBidangPublik,
} from '../services/public-dashboard.service';

const angka = (n: number) => n.toLocaleString('id-ID');

function BadgeStatus({ capaian }: { capaian: number }) {
  if (capaian >= 100) return <span className="lp-badge lp-tuntas">Tuntas</span>;
  if (capaian > 0) return <span className="lp-badge">Berjalan</span>;
  return <span className="lp-badge lp-quiet">Belum dimulai</span>;
}

export default function Detail() {
  const bidangId = new URLSearchParams(useLocation().search).get('bidang');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DetailBidangPublik | null>(null);

  useEffect(() => {
    if (!bidangId) {
      setError('Bidang tidak ditentukan.');
      setLoading(false);
      return;
    }

    getDetailBidangPublik(bidangId)
      .then(setData)
      .catch((err) => setError(apiMessage(err, 'Gagal memuat data bidang.')))
      .finally(() => setLoading(false));
  }, [bidangId]);

  const status = useMemo(() => {
    const rincian = data?.rincian ?? [];
    const tuntas = rincian.filter((s) => s.capaian >= 100).length;
    const belum = rincian.filter((s) => s.capaian <= 0).length;
    return { belum, berjalan: rincian.length - tuntas - belum, tuntas };
  }, [data]);

  const kembali = (
    <Link to="/" className="lp-back">
      <ArrowLeft size={14} aria-hidden="true" /> Kembali ke dashboard
    </Link>
  );

  if (loading || error || !data) {
    return (
      <KerangkaPublik nav={kembali}>
        <div className="lp-container lp-empty">
          {loading ? (
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          ) : (
            <p role="alert" style={{ color: '#b91c1c' }}>
              {error ?? 'Data tidak ditemukan.'}
            </p>
          )}
        </div>
      </KerangkaPublik>
    );
  }

  const { header, periode, rincian } = data;
  const capaian = Number(header.capaian_bidang);

  return (
    <KerangkaPublik nav={kembali}>
      {/* Pembuka */}
      <section className="lp-hero" aria-labelledby="lp-h-bidang">
        <div className="lp-container lp-hero-grid">
          <div>
            <p className="lp-welcome">Capaian bidang</p>
            <p className="lp-big num" aria-label={`Capaian bidang ${persen1(capaian)}`}>
              {persen1(capaian).replace('%', '')}
              <small>%</small>
            </p>
            <h1 id="lp-h-bidang">
              {header.nama_bidang}
              {periode && <span>{periode.nama_periode}</span>}
            </h1>
            <div className="lp-hero-meta">
              <BadgeStatus capaian={capaian} />
              <span>Rata-rata capaian seluruh subkegiatan bidang ini</span>
            </div>
          </div>
          <ul className="lp-facts num" aria-label="Ringkasan status subkegiatan">
            {[
              [header.jumlah_subkegiatan, 'Subkegiatan'],
              [status.belum, 'Belum dimulai'],
              [status.berjalan, 'Berjalan'],
              [status.tuntas, 'Tuntas'],
            ].map(([n, label]) => (
              <li key={label}>
                <b>{angka(Number(n))}</b>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Rincian subkegiatan */}
      <section className="lp-sec lp-tint" aria-labelledby="lp-h-rincian">
        <div className="lp-container">
          <div className="lp-sec-head">
            <div>
              <p className="lp-eyebrow">
                <ListChecks size={12} />
                Rincian subkegiatan
              </p>
              <h2 id="lp-h-rincian">Capaian Tiap Subkegiatan</h2>
              <p className="lp-sub">
                Persentase capaian terhadap target tahunan, dalam skala 0 sampai 100.
              </p>
            </div>
          </div>
          <div className="num">
            {rincian.map((s) => (
              <div className="lp-prog" key={s.id}>
                <div>
                  <h3>
                    {s.nama_subkegiatan}
                    {s.capaian > 0 && <BadgeStatus capaian={s.capaian} />}
                  </h3>
                  {s.indikator_kinerja && (
                    <div className="lp-row-meta">{s.indikator_kinerja}</div>
                  )}
                </div>
                <div className="lp-line lp-line-grad" aria-hidden="true">
                  <b style={{ width: `${Math.min(100, Math.max(0, s.capaian))}%` }} />
                </div>
                <div className={`lp-pct${s.capaian > 0 ? '' : ' lp-zero'}`}>
                  {persen1(s.capaian)}
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
    </KerangkaPublik>
  );
}
