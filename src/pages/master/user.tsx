import { useEffect, useState } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';

interface MasterUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID');
};

export default function MasterUserPage() {
  const [data, setData] = useState<MasterUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/master-user');
      const responseData = response.data?.data || response.data;
      const normalized = Array.isArray(responseData) ? responseData : [];
      setData(normalized);
      setError('');
    } catch (err: any) {
      console.error('Gagal mengambil data master user:', err);
      setError('Gagal memuat data master user.');
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

  const filteredData = data.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.name?.toLowerCase() || '').includes(q) ||
      (item.email?.toLowerCase() || '').includes(q)
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
          <h1 className="text-2xl font-bold text-slate-900">Master User</h1>
          <p className="mt-1 text-sm text-slate-500">Data pengguna aplikasi</p>
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
              placeholder="Cari nama atau email..."
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
                  Nama
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">
                  Email
                </th>
                <th className="w-28 px-6 py-3 text-xs font-semibold tracking-wider text-center uppercase text-slate-500">
                  Verifikasi
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">
                  Dibuat
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500">
                  Diperbarui
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
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
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Tidak ada data user ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-900">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {item.email_verified_at ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDate(item.updated_at)}
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
    </div>
  );
}
