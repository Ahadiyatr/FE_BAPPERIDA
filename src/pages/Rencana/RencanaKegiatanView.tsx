import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  Download,
  X,
} from 'lucide-react';
import api from '../../services/api';

export default function RencanaKegiatanView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [header, setHeader] = useState<any>(null);
  const [rekap, setRekap] = useState<any[]>([]);
  const [realisasi, setRealisasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedDetail, setExpandedDetail] = useState<number | null>(null);

  // Media Modal
  const [mediaToView, setMediaToView] = useState<{
    type: 'foto' | 'document';
    urls: string[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/rencana-kegiatan/${id}`);

      setHeader(res.data.data.header);
      setRekap(res.data.data.rekap || []);

      const allRealisasi = res.data.data.realisasi || [];
      const parsedRealisasi = allRealisasi.map((r: any) => {
        let parsedFoto = r.FILE_FOTO;
        if (typeof parsedFoto === 'string') {
          try {
            parsedFoto = JSON.parse(parsedFoto);
          } catch {
            parsedFoto = parsedFoto ? [parsedFoto] : [];
          }
        }
        return { ...r, FILE_FOTO: Array.isArray(parsedFoto) ? parsedFoto : [] };
      });
      setRealisasi(parsedRealisasi);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const toggleAccordion = (detailId: number) => {
    setExpandedDetail(expandedDetail === detailId ? null : detailId);
  };

  const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}/storage${path.startsWith('/') ? path : `/${path}`}`.replace(
      '/storage/storage',
      '/storage',
    );
  };

  if (loading)
    return (
      <div className="p-8 font-medium text-center text-emerald-600">
        Memuat data...
      </div>
    );
  if (!header)
    return (
      <div className="p-8 text-center text-red-500">Data tidak ditemukan.</div>
    );

  return (
    <div className="w-full pb-20 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/rencana-kegiatan')}
            className="p-2 transition-colors bg-white border shadow-sm border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Detail Rencana & Capaian Kegiatan
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Rincian rencana dan capaian realisasi berdasarkan indikator
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full text-emerald-600 bg-emerald-100">
                {header.NAMA_INDIKATOR_UTAMA}
              </span>
              <span className="px-3 py-1 text-xs font-semibold tracking-wider uppercase border rounded-full text-slate-500 bg-slate-100 border-slate-200">
                {header.NAMA_BIDANG}
              </span>
              <span className="px-3 py-1 text-xs font-semibold tracking-wider text-blue-500 uppercase bg-blue-100 border border-blue-200 rounded-full">
                {header.NAMA_PERIODE}
              </span>
            </div>
            <h2 className="flex flex-wrap items-center gap-3 text-xl font-bold text-slate-900">
              {header.NAMA_INDIKATOR}
              <span className="px-3 py-1 text-sm font-bold border rounded-full shadow-sm bg-emerald-50 text-emerald-700 border-emerald-200">
                {header.PERSENTASE}% TERCAPAI
              </span>
            </h2>
            <div className="mt-1 text-sm font-medium text-slate-600">
              <span className="font-bold text-slate-800">Program:</span>{' '}
              {header.NAMA_PROGRAM}
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {rekap.length > 0 && (
            <div className="flex items-center gap-4 px-6 py-2 border-b bg-slate-50 border-slate-200">
              <span className="w-24 shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Jenis
              </span>
              <span className="flex-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sub Kegiatan
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28 text-right">
                Realisasi/Target
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right">
                Bobot Real/Target
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24 text-right">
                Persentase
              </span>
            </div>
          )}
          {rekap.length === 0 ? (
            <p className="px-6 py-8 text-sm text-center text-slate-500">
              Belum ada rincian rekap data
            </p>
          ) : (
            [
              ...rekap.filter(d => d.TIPE_AKTIFITAS === 'UTAMA'),
              ...rekap.filter(d => d.TIPE_AKTIFITAS === 'PENDUKUNG'),
            ].map(d => {
              const isUtama = d.TIPE_AKTIFITAS === 'UTAMA';
              const target = parseFloat(d.TARGET) || 0;
              const realCount = parseFloat(d.REALISASI) || 0;
              const bobotTarget = parseFloat(d.BOBOT_TARGET) || 0;
              const bobotRealisasi = parseFloat(d.BOBOT_REALISASI) || 0;
              const persentase = parseFloat(d.PERSENTASE) || 0;
              const isComplete = persentase >= 100;
              return (
                <div
                  key={`${d.TIPE_AKTIFITAS}-${d.DETAIL_ID}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <span
                    className={`w-24 shrink-0 text-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${isUtama ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}
                  >
                    {isUtama ? 'Utama' : 'Pendukung'}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800">
                    {d.JENIS_KEGIATAN}
                  </span>
                  <span className="text-sm text-center w-28 tabular-nums text-slate-500 shrink-0">
                    <span className="font-bold text-slate-700">
                      {realCount}
                    </span>
                    /{target}
                  </span>
                  <span className="w-32 text-sm text-right tabular-nums text-slate-500 shrink-0">
                    <span className="font-bold text-slate-700">
                      {bobotRealisasi.toFixed(2)}
                    </span>
                    /{bobotTarget.toFixed(2)}
                  </span>
                  <span
                    className={`w-24 text-right text-sm font-bold tabular-nums shrink-0 ${isComplete ? 'text-emerald-600' : 'text-slate-700'}`}
                  >
                    {persentase.toFixed(2)}%
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-6 overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
        <h3 className="pb-4 mb-4 text-base font-bold border-b text-slate-900 border-slate-100">
          Riwayat Realisasi
        </h3>
        <div className="space-y-6">
          {(['UTAMA', 'PENDUKUNG'] as const).map(tipe => {
            const grouped = rekap.filter(d => d.TIPE_AKTIFITAS === tipe);
            if (grouped.length === 0) return null;
            return (
              <div key={tipe}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${tipe === 'UTAMA' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}
                  >
                    Aktivitas {tipe === 'UTAMA' ? 'Utama' : 'Pendukung'}
                  </span>
                </div>
                <div className="space-y-3">
                  {grouped.map(d => {
                    const isExpanded = expandedDetail === d.DETAIL_ID;
                    const myRealisasi = realisasi.filter(
                      r =>
                        r.JENIS_KEGIATAN === d.JENIS_KEGIATAN ||
                        String(r.INDIKATOR_DETAIL_ID) === String(d.DETAIL_ID),
                    );

                    return (
                      <div
                        key={d.DETAIL_ID}
                        className={`border rounded-xl overflow-hidden shadow-sm ${tipe === 'UTAMA' ? 'border-blue-200' : 'border-amber-200'}`}
                      >
                        <button
                          onClick={() => toggleAccordion(d.DETAIL_ID)}
                          className="flex items-center w-full gap-4 px-5 py-4 text-left transition-colors bg-slate-50 hover:bg-slate-100"
                        >
                          <div
                            className={`p-1 rounded bg-white border border-slate-200 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </div>
                          <span className="flex-1 font-semibold text-slate-900">
                            {d.JENIS_KEGIATAN}
                          </span>
                          <span className="px-3 py-1 text-xs font-medium bg-white border rounded-full text-slate-500 border-slate-200">
                            {myRealisasi.length} Realisasi
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="p-5 space-y-6 bg-white">
                            {myRealisasi.length === 0 ? (
                              <div className="py-4 text-sm italic text-center border border-dashed rounded-lg text-slate-400 bg-slate-50 border-slate-200">
                                Belum ada bukti realisasi.
                              </div>
                            ) : (
                              myRealisasi.map((r, i) => {
                                let dateStr = r.TANGGAL_KEGIATAN || '';
                                let timeStr = '08:00';
                                if (dateStr) {
                                  const parts = dateStr.split(/[\sT]/);
                                  if (parts.length > 1) {
                                    dateStr = parts[0];
                                    timeStr = parts[1].substring(0, 5);
                                  }
                                  const dParts = dateStr.split('-');
                                  if (dParts.length === 3) {
                                    dateStr = `${dParts[2]}/${dParts[1]}/${dParts[0].substring(2)}`;
                                  }
                                }
                                return (
                                  <div
                                    key={r.ID}
                                    className="flex flex-col gap-6 p-5 border md:flex-row border-slate-200 rounded-xl bg-slate-50/50"
                                  >
                                    <div className="flex-1 space-y-4">
                                      <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 text-xs font-bold border rounded-full shadow-sm bg-emerald-100 text-emerald-700 border-emerald-200">
                                          {i + 1}
                                        </span>
                                        <span className="text-sm font-bold tracking-wider uppercase text-slate-800">
                                          {dateStr} • {timeStr}
                                        </span>
                                      </div>
                                      <p className="p-4 text-sm leading-relaxed bg-white border shadow-sm text-slate-600 rounded-xl border-slate-200">
                                        {r.KETERANGAN ||
                                          'Tidak ada keterangan tambahan.'}
                                      </p>
                                    </div>
                                    <div className="flex flex-col justify-start w-full gap-3 md:w-64 shrink-0">
                                      <button
                                        onClick={() => {
                                          if (
                                            r.FILE_FOTO &&
                                            r.FILE_FOTO.length > 0
                                          ) {
                                            setMediaToView({
                                              type: 'foto',
                                              urls: r.FILE_FOTO,
                                            });
                                          }
                                        }}
                                        className="relative flex items-center justify-center w-full h-32 overflow-hidden transition-colors border shadow-sm cursor-pointer bg-slate-100 hover:bg-slate-200 border-slate-200 rounded-xl group"
                                      >
                                        {r.FILE_FOTO &&
                                        r.FILE_FOTO.length > 0 ? (
                                          <div className="relative w-full h-full">
                                            <img
                                              src={getMediaUrl(r.FILE_FOTO[0])}
                                              className="object-cover w-full h-full"
                                              alt="Foto"
                                              onError={e => {
                                                (
                                                  e.target as HTMLImageElement
                                                ).src =
                                                  'data:image/svg+xml;utf8,<svg .../>';
                                              }}
                                            />
                                            {r.FILE_FOTO.length > 1 && (
                                              <div className="absolute px-2 py-1 text-xs font-bold text-white rounded-lg bottom-2 right-2 bg-black/60">
                                                +{r.FILE_FOTO.length - 1}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-500">
                                            <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                                            <span className="text-[10px] font-bold tracking-wider">
                                              NO FOTO
                                            </span>
                                          </div>
                                        )}
                                      </button>
                                      {r.FILE_DOCUMENT && (
                                        <button
                                          onClick={() =>
                                            setMediaToView({
                                              type: 'document',
                                              urls: [r.FILE_DOCUMENT],
                                            })
                                          }
                                          className="w-full text-xs font-bold text-center py-2.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                          <FileText className="w-4 h-4" /> Lihat
                                          Dokumen
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Media Modal */}
      {mediaToView && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="z-10 flex items-center justify-between p-4 bg-white border-b border-slate-100">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                {mediaToView.type === 'foto' ? (
                  <>
                    <ImageIcon className="w-5 h-5 text-blue-500" /> Foto
                    Realisasi
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 text-emerald-500" /> Dokumen
                    Pendukung
                  </>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={getMediaUrl(mediaToView.urls[0])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border rounded-full shadow-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setMediaToView(null)}
                  className="p-2 text-red-600 border border-red-100 rounded-full shadow-sm bg-red-50 hover:bg-red-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-slate-50 relative min-h-[50vh]">
              {mediaToView.type === 'foto' ? (
                <div className="flex flex-col w-full max-w-2xl gap-6 mx-auto">
                  {mediaToView.urls.map((u, i) => (
                    <img
                      key={i}
                      src={getMediaUrl(u)}
                      className="max-w-full max-h-[70vh] rounded-2xl shadow-md border-4 border-white object-contain"
                      alt="Foto"
                    />
                  ))}
                </div>
              ) : mediaToView.urls[0].toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getMediaUrl(mediaToView.urls[0])}
                  className="w-full h-full min-h-[60vh] rounded-xl border-0 shadow-inner bg-white"
                />
              ) : (
                <div className="w-full max-w-md p-12 text-center bg-white border shadow-sm rounded-3xl border-slate-200">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <div className="mb-2 text-lg font-bold text-slate-800">
                    Preview Tidak Tersedia
                  </div>
                  <p className="mb-6 text-sm text-slate-500">
                    Format dokumen ini tidak dapat langsung ditampilkan di
                    layar.
                  </p>
                  <a
                    href={getMediaUrl(mediaToView.urls[0])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full gap-2 px-6 py-3 font-bold text-white transition-colors bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700"
                  >
                    Unduh Dokumen <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
