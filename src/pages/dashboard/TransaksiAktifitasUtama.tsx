import { useEffect, useState } from 'react';
import { Search, CheckCircle2, XCircle, Eye, X } from 'lucide-react';
import api from '../../services/api.js';
import Pagination from '../../components/Pagination';

interface TransAktifitasUtama {
  ID: number;
  MASTER_AKTIFITAS_ID: number;
  INDIKATOR_BIDANG_ID: number;
  PERIODE_ID: number;
  NAMA_AKTIFITAS: string;
  TARGET: string;
  REALISASI: string;
  BOBOT_TARGET: string;
  BOBOT_REALISASI: string;
  KETERANGAN: string | null;
  FILE_BUKTI_URL: string | null;
  FLAG_ACTIVE: boolean;
  master_aktifitas?: {
    ID: number;
    NAMA_AKTIFITAS: string;
    BOBOT_TARGET: string;
  };
  periode?: {
    ID: number;
    NAMA_PERIODE: string;
    STATUS?: string;
  };
}

export default function TransaksiAktifitasUtama() {
  const [data, setData] = useState<TransAktifitasUtama[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [detailData, setDetailData] = useState<TransAktifitasUtama | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/trans-aktifitas-utama');
      const responseData = response.data?.data || response.data;
      const normalized = Array.isArray(responseData)
        ? responseData.map((item: any) => ({
            ...item,
            FLAG_ACTIVE: Boolean(item.FLAG_ACTIVE),
          }))
        : [];
      setData(normalized);
      setError('');
    } catch (err: any) {
      console.error('Gagal mengambil data transaksi aktifitas utama:', err);
      setError('Gagal memuat data transaksi aktifitas utama.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleOpenDetail = async (id: number) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const response = await api.get(`/api/trans-aktifitas-utama/${id}`);
      const responseData = response.data?.data || response.data;
      setDetailData(
        responseData
          ? {
              ...responseData,
              FLAG_ACTIVE: Boolean(responseData.FLAG_ACTIVE),
            }
          : null,
      );
    } catch (err: any) {
      console.error('Gagal mengambil detail transaksi aktifitas utama:', err);
      setError('Gagal memuat detail transaksi aktifitas utama.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setDetailData(null);
    setDetailLoading(false);
  };

  const filteredData = data.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.NAMA_AKTIFITAS?.toLowerCase() || '').includes(q) ||
      (item.master_aktifitas?.NAMA_AKTIFITAS?.toLowerCase() || '').includes(
        q,
      ) ||
      (item.periode?.NAMA_PERIODE?.toLowerCase() || '').includes(q) ||
      (item.KETERANGAN?.toLowerCase() || '').includes(q)
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Transaksi Aktifitas Utama
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Data target dan realisasi aktifitas utama
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 text-red-600 border border-red-100 bg-red-50 rounded-xl">
          {error}
        </div>
      )}

      <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full py-2 pl-10 pr-3 leading-5 transition-colors bg-white border rounded-lg border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Cari aktifitas utama..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-16 px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">
                  No.
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">
                  Periode
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">
                  Nama Aktifitas
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-500">
                  Target
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-500">
                  Realisasi
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-500">
                  Bobot Target
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-500">
                  Bobot Realisasi
                </th>
                <th className="w-24 px-6 py-3 text-xs font-semibold tracking-wider text-center uppercase text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-500 w-28">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 rounded-full border-emerald-500 border-t-transparent animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Tidak ada data transaksi aktifitas utama ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item.ID}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-900">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.periode?.NAMA_PERIODE || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {item.NAMA_AKTIFITAS}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-700">
                      {item.TARGET}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-700">
                      {item.REALISASI}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-700">
                      {item.BOBOT_TARGET}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-700">
                      {item.BOBOT_REALISASI}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {item.FLAG_ACTIVE ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(item.ID)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col w-full max-w-3xl overflow-hidden bg-white shadow-xl rounded-2xl max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Detail Transaksi Aktifitas Utama
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informasi lengkap dari data yang dipilih
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {detailLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 rounded-full border-emerald-500 border-t-transparent animate-spin"></div>
                    Memuat detail...
                  </div>
                </div>
              ) : detailData ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/60">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Periode
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {detailData.periode?.NAMA_PERIODE || '-'}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      ID: {detailData.PERIODE_ID}
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/60">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Master Aktifitas
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {detailData.master_aktifitas?.NAMA_AKTIFITAS ||
                        detailData.NAMA_AKTIFITAS ||
                        '-'}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      ID: {detailData.MASTER_AKTIFITAS_ID}
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/60">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Indikator Bidang
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {detailData.INDIKATOR_BIDANG_ID}
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/60">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Status
                    </div>
                    <div className="mt-1">
                      {detailData.FLAG_ACTIVE ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/60 md:col-span-2">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Keterangan
                    </div>
                    <div className="mt-1 text-sm text-slate-900">
                      {detailData.KETERANGAN || '-'}
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/60">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Target / Realisasi
                    </div>
                    <div className="mt-1 text-sm text-slate-900">
                      {detailData.TARGET} / {detailData.REALISASI}
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/60">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Bobot Target / Realisasi
                    </div>
                    <div className="mt-1 text-sm text-slate-900">
                      {detailData.BOBOT_TARGET} / {detailData.BOBOT_REALISASI}
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/60 md:col-span-2">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      File Bukti
                    </div>
                    <div className="mt-1 text-sm text-slate-900">
                      {detailData.FILE_BUKTI_URL ? (
                        <a
                          href={detailData.FILE_BUKTI_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-700 hover:underline"
                        >
                          Lihat file bukti
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500">
                  Detail tidak tersedia.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
