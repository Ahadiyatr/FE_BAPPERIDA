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
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Toast } from '../../utils/toast';
import Pagination from '../../components/Pagination';

interface AktivitasUtama {
  ID: number;
  MSTR_INDIKATOR_SUB_ID: number;
  NAMA_AKTIFITAS_UTAMA: string;
  FLAG_ACTIVE: boolean;
  indikator_sub?: {
    ID: number;
    NAMA_INDIKATOR_SUB: string;
  };
}

interface IndikatorSub {
  ID: number;
  NAMA_INDIKATOR_SUB: string;
}

export default function MasterAktifitasUtama() {
  const [data, setData] = useState<AktivitasUtama[]>([]);
  const [indikatorSubList, setIndikatorSubList] = useState<IndikatorSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    MSTR_INDIKATOR_SUB_ID: '',
    NAMA_AKTIFITAS_UTAMA: '',
    FLAG_ACTIVE: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/master-list-aktifitas-utama');
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
      console.error('Gagal mengambil data:', err);
      setError('Gagal memuat data aktifitas utama.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchIndikatorSub();
  }, []);

  const fetchIndikatorSub = async () => {
    try {
      const response = await api.get('/api/master-indikator-sub');
      const responseData = response.data?.data || response.data;
      setIndikatorSubList(Array.isArray(responseData) ? responseData : []);
    } catch (err: any) {
      console.error('Gagal mengambil data indikator sub:', err);
    }
  };

  const handleOpenModal = (mode: 'add' | 'edit', item?: AktivitasUtama) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      setCurrentId(item.ID);
      setFormData({
        MSTR_INDIKATOR_SUB_ID: item.MSTR_INDIKATOR_SUB_ID.toString(),
        NAMA_AKTIFITAS_UTAMA: item.NAMA_AKTIFITAS_UTAMA || '',
        FLAG_ACTIVE:
          item.FLAG_ACTIVE === undefined ? true : Boolean(item.FLAG_ACTIVE),
      });
    } else {
      setCurrentId(null);
      setFormData({
        MSTR_INDIKATOR_SUB_ID: '',
        NAMA_AKTIFITAS_UTAMA: '',
        FLAG_ACTIVE: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      MSTR_INDIKATOR_SUB_ID: '',
      NAMA_AKTIFITAS_UTAMA: '',
      FLAG_ACTIVE: true,
    });
    setCurrentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      MSTR_INDIKATOR_SUB_ID: parseInt(formData.MSTR_INDIKATOR_SUB_ID),
    };

    try {
      let response;
      if (modalMode === 'add') {
        response = await api.post('/api/master-aktifitas-utama', payload);
      } else if (modalMode === 'edit' && currentId) {
        response = await api.put(
          `/api/master-aktifitas-utama/${currentId}`,
          payload,
        );
      }

      Toast.fire({
        icon: 'success',
        title:
          response?.data?.message ||
          (modalMode === 'add'
            ? 'Data berhasil dibuat.'
            : 'Data berhasil diperbarui.'),
      });

      handleCloseModal();
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Gagal menyimpan data:', err);
      alert(
        err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const performDelete = async (id: number) => {
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
        await api.delete(`/api/master-list-aktifitas-utama/${id}`);
        fetchData(); // Refresh data
        Toast.fire({
          icon: 'success',
          title: 'Data berhasil dihapus',
        });
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

  const filteredData = data.filter(
    item =>
      (item.NAMA_AKTIFITAS_UTAMA?.toLowerCase() || '').includes(
        search.toLowerCase(),
      ) ||
      (item.indikator_sub?.NAMA_INDIKATOR_SUB?.toLowerCase() || '').includes(
        search.toLowerCase(),
      ),
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Master Aktivitas Utama
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data aktivitas utama di Bapperrida
          </p>
        </div>
        <button
          onClick={() => handleOpenModal('add')}
          className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors shadow-sm bg-emerald-600 hover:bg-emerald-700 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Tambah Aktifitas
        </button>
      </div>

      {error && (
        <div className="p-4 text-red-600 border border-red-100 bg-red-50 rounded-xl">
          {error}
        </div>
      )}

      <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
        <div className="flex flex-col gap-3 p-4 border-b sm:flex-row sm:items-center sm:justify-between border-slate-100 bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full py-2 pl-10 pr-3 leading-5 transition-colors bg-white border rounded-lg border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Cari aktifitas..."
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <label
              htmlFor="rowsPerPage"
              className="font-medium whitespace-nowrap"
            >
              Show
            </label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={e => setRowsPerPage(Number(e.target.value))}
              className="px-2 py-2 bg-white border rounded-lg border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
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
                  Nama Aktifitas
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500"
                >
                  Indikator Sub
                </th>
                <th
                  scope="col"
                  className="w-24 px-6 py-3 text-xs font-semibold tracking-wider text-center uppercase text-slate-500"
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
                    colSpan={5}
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
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Tidak ada data aktifitas ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item.ID}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-900">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {item.NAMA_AKTIFITAS_UTAMA}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.indikator_sub?.NAMA_INDIKATOR_SUB || '-'}
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
                          onClick={() => performDelete(item.ID)}
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
                {modalMode === 'add'
                  ? 'Tambah Aktifitas Utama'
                  : 'Edit Aktifitas Utama'}
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
                id="aktifitas-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="MSTR_INDIKATOR_SUB_ID"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Indikator Sub <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="MSTR_INDIKATOR_SUB_ID"
                    required
                    value={formData.MSTR_INDIKATOR_SUB_ID}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        MSTR_INDIKATOR_SUB_ID: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="" disabled>
                      Pilih indikator sub
                    </option>
                    {indikatorSubList.map(indikator => (
                      <option key={indikator.ID} value={indikator.ID}>
                        {indikator.NAMA_INDIKATOR_SUB}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="NAMA_AKTIFITAS_UTAMA"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Nama Aktifitas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="NAMA_AKTIFITAS_UTAMA"
                    required
                    maxLength={150}
                    value={formData.NAMA_AKTIFITAS_UTAMA}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        NAMA_AKTIFITAS_UTAMA: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Masukkan nama aktifitas"
                  />
                </div>
                <div className="flex items-center">
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
                    Aktifitas Aktif
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
                form="aktifitas-form"
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
