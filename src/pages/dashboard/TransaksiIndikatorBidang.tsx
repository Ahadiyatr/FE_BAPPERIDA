import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Toast } from '../../utils/toast';
import Pagination from '../../components/Pagination';
import api from '../../services/api';

interface TransIndikatorBidang {
  ID: number;
  NAMA_PROGRAM?: string;
  NAMA_INDIKATOR_UTAMA?: string;
  NAMA_INDIKATOR?: string;
  NAMA_BIDANG?: string;
  NAMA_PERIODE?: string;
  FLAG_ACTIVE: boolean;
  LOG_ENTRY_NAME?: string;
  LOG_ENTRY_DATE?: string;
  LOG_UPDATE_NAME?: string;
  LOG_UPDATE_DATE?: string;
}

interface Periode {
  ID: number;
  NAMA_PERIODE: string;
}

interface Bidang {
  ID: number;
  NAMA_BIDANG: string;
}

interface Indikator {
  ID: number;
  NAMA_INDIKATOR_SUB: string;
  KODE_INDIKATOR_SUB: string;
}

export default function TransaksiIndikatorBidang() {
  const [data, setData] = useState<TransIndikatorBidang[]>([]);
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [bidangList, setBidangList] = useState<Bidang[]>([]);
  const [indikatorList, setIndikatorList] = useState<Indikator[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    PERIODE_ID: '',
    BIDANG_ID: '',
    INDIKATOR_SUB_ID: '',
    FLAG_ACTIVE: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/trans-indikator-bidang');
      const responseData = response.data.data || response.data;
      setData(Array.isArray(responseData) ? responseData : []);
      setError('');
    } catch (err: any) {
      console.error('Gagal mengambil data:', err);
      setError('Gagal memuat data transaksi indikator bidang.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [resPeriode, resBidang, resIndikator] = await Promise.all([
        api.get('/api/master-periode'),
        api.get('/api/master-bidang'),
        api.get('/api/master-indikator-sub'),
      ]);

      setPeriodeList(resPeriode.data.data || resPeriode.data || []);
      setBidangList(resBidang.data.data || resBidang.data || []);
      setIndikatorList(resIndikator.data.data || resIndikator.data || []);
    } catch (err) {
      console.error('Gagal mengambil data referensi:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const handleOpenModal = async (
    mode: 'add' | 'edit',
    item?: TransIndikatorBidang,
  ) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      setCurrentId(item.ID);

      try {
        // Fetch detail data because the list view might not contain the foreign keys
        const response = await api.get(
          `/api/trans-indikator-bidang/${item.ID}`,
        );
        const detail = response.data.data || response.data;

        setFormData({
          PERIODE_ID: detail.PERIODE_ID ? detail.PERIODE_ID.toString() : '',
          BIDANG_ID: detail.BIDANG_ID ? detail.BIDANG_ID.toString() : '',
          INDIKATOR_SUB_ID: detail.INDIKATOR_SUB_ID
            ? detail.INDIKATOR_SUB_ID.toString()
            : '',
          FLAG_ACTIVE:
            detail.FLAG_ACTIVE === undefined
              ? true
              : Boolean(detail.FLAG_ACTIVE),
        });
        setIsModalOpen(true);
      } catch (err) {
        console.error('Gagal mengambil detail data:', err);
        alert('Gagal mengambil detail data untuk diedit.');
      }
    } else {
      setCurrentId(null);
      setFormData({
        PERIODE_ID: '',
        BIDANG_ID: '',
        INDIKATOR_SUB_ID: '',
        FLAG_ACTIVE: true,
      });
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      PERIODE_ID: '',
      BIDANG_ID: '',
      INDIKATOR_SUB_ID: '',
      FLAG_ACTIVE: true,
    });
    setCurrentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        PERIODE_ID: parseInt(formData.PERIODE_ID),
        BIDANG_ID: parseInt(formData.BIDANG_ID),
        INDIKATOR_SUB_ID: parseInt(formData.INDIKATOR_SUB_ID),
        FLAG_ACTIVE: formData.FLAG_ACTIVE,
      };

      if (modalMode === 'add') {
        await api.post('/api/trans-indikator-bidang', payload);
      } else if (modalMode === 'edit' && currentId) {
        await api.put(`/api/trans-indikator-bidang/${currentId}`, payload);
      }
      handleCloseModal();
      fetchData();
      Toast.fire({ icon: 'success', title: 'Data berhasil disimpan' }); // Refresh data
    } catch (err: any) {
      console.error('Gagal menyimpan data:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#059669',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin ingin menghapus data?',
      text: 'Data yang dihapus tidak bisa dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/trans-indikator-bidang/${id}`);
        fetchData();
        Toast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
      } catch (err: any) {
        console.error('Gagal menghapus data:', err);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text:
            err.response?.data?.message ||
            'Terjadi kesalahan saat menghapus data.',
          confirmButtonColor: '#059669',
        });
      }
    }
  };

  const filteredData = data.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      (item.NAMA_PROGRAM?.toLowerCase() || '').includes(searchLower) ||
      (item.NAMA_INDIKATOR_UTAMA?.toLowerCase() || '').includes(searchLower) ||
      (item.NAMA_INDIKATOR?.toLowerCase() || '').includes(searchLower) ||
      (item.NAMA_BIDANG?.toLowerCase() || '').includes(searchLower) ||
      (item.NAMA_PERIODE?.toLowerCase() || '').includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Transaksi Indikator Bidang
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mapping indikator ke masing-masing bidang
          </p>
        </div>
        <button
          onClick={() => handleOpenModal('add')}
          className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors shadow-sm bg-emerald-600 hover:bg-emerald-700 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Tambah Mapping
        </button>
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
              placeholder="Cari mapping..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  className="w-16 px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500"
                >
                  No.
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500"
                >
                  Periode
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500"
                >
                  Bidang
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500"
                >
                  Program
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500"
                >
                  Indikator Utama
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500"
                >
                  Indikator
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-center uppercase text-slate-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-500 w-28"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
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
                    colSpan={8}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Tidak ada data mapping ditemukan.
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
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">
                      {item.NAMA_PERIODE || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-800">
                      {item.NAMA_BIDANG || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.NAMA_PROGRAM || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.NAMA_INDIKATOR_UTAMA || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.NAMA_INDIKATOR || '-'}
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
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal('edit', item)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => executeDelete(item.ID)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {modalMode === 'add' ? 'Tambah Mapping' : 'Edit Mapping'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <form
                id="mapping-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="PERIODE_ID"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Periode <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="PERIODE_ID"
                    required
                    value={formData.PERIODE_ID}
                    onChange={e =>
                      setFormData({ ...formData, PERIODE_ID: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Periode --</option>
                    {periodeList.map(p => (
                      <option key={p.ID} value={p.ID}>
                        {p.NAMA_PERIODE}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="BIDANG_ID"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Bidang <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="BIDANG_ID"
                    required
                    value={formData.BIDANG_ID}
                    onChange={e =>
                      setFormData({ ...formData, BIDANG_ID: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Bidang --</option>
                    {bidangList.map(b => (
                      <option key={b.ID} value={b.ID}>
                        {b.NAMA_BIDANG}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="INDIKATOR_SUB_ID"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Indikator <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="INDIKATOR_SUB_ID"
                    required
                    value={formData.INDIKATOR_SUB_ID}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        INDIKATOR_SUB_ID: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Indikator --</option>
                    {indikatorList.map(i => (
                      <option key={i.ID} value={i.ID}>
                        {i.KODE_INDIKATOR_SUB} - {i.NAMA_INDIKATOR_SUB}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="FLAG_ACTIVE"
                    checked={formData.FLAG_ACTIVE}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        FLAG_ACTIVE: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="FLAG_ACTIVE"
                    className="block ml-2 text-sm text-slate-700"
                  >
                    Mapping Aktif
                  </label>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-100 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium transition-colors bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="mapping-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                )}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
