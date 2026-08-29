import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, CheckCircle2, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import { Toast } from "../../utils/toast";
import Pagination from "../../components/Pagination";
import api from "../../services/api";

interface Program {
  ID: number;
  KODE_PROGRAM: string;
  NAMA_PROGRAM: string;
}

interface IndikatorUtama {
  ID: number;
  PROGRAM_ID: number;
  KODE_INDIKATOR_UTAMA: string;
  NAMA_INDIKATOR_UTAMA: string;
  FLAG_ACTIVE: boolean;
  program?: Program;
}

export default function MasterIndikatorUtama() {
  const [data, setData] = useState<IndikatorUtama[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    PROGRAM_ID: "",
    KODE_INDIKATOR_UTAMA: "",
    NAMA_INDIKATOR_UTAMA: "",
    FLAG_ACTIVE: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/master-indikator-utama");
      const responseData = response.data.data || response.data;
      setData(Array.isArray(responseData) ? responseData : []);
      setError("");
    } catch (err: any) {
      console.error("Gagal mengambil data:", err);
      setError("Gagal memuat data indikator utama.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get("/api/master-program");
      const responseData = response.data.data || response.data;
      setPrograms(Array.isArray(responseData) ? responseData : []);
    } catch (err: any) {
      console.error("Gagal mengambil data program:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPrograms();
  }, []);

  const handleOpenModal = (mode: "add" | "edit", item?: IndikatorUtama) => {
    setModalMode(mode);
    if (mode === "edit" && item) {
      setCurrentId(item.ID);
      setFormData({
        PROGRAM_ID: item.PROGRAM_ID.toString(),
        KODE_INDIKATOR_UTAMA: item.KODE_INDIKATOR_UTAMA || "",
        NAMA_INDIKATOR_UTAMA: item.NAMA_INDIKATOR_UTAMA || "",
        FLAG_ACTIVE: item.FLAG_ACTIVE === undefined ? true : Boolean(item.FLAG_ACTIVE),
      });
    } else {
      setCurrentId(null);
      setFormData({
        PROGRAM_ID: "",
        KODE_INDIKATOR_UTAMA: "",
        NAMA_INDIKATOR_UTAMA: "",
        FLAG_ACTIVE: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ PROGRAM_ID: "", KODE_INDIKATOR_UTAMA: "", NAMA_INDIKATOR_UTAMA: "", FLAG_ACTIVE: true });
    setCurrentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      PROGRAM_ID: parseInt(formData.PROGRAM_ID)
    };

    try {
      if (modalMode === "add") {
        await api.post("/api/master-indikator-utama", payload);
      } else if (modalMode === "edit" && currentId) {
        await api.put(`/api/master-indikator-utama/${currentId}`, payload);
      }
      handleCloseModal();
      fetchData();
      Toast.fire({ icon: 'success', title: 'Data berhasil disimpan' });
    } catch (err: any) {
      console.error("Gagal menyimpan data:", err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.",
        confirmButtonColor: '#059669'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin ingin menghapus data?',
      text: "Data yang dihapus tidak bisa dikembalikan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/master-indikator-utama/${id}`);
        fetchData();
        Toast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
      } catch (err: any) {
        console.error("Gagal menghapus data:", err);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.response?.data?.message || "Terjadi kesalahan saat menghapus data.",
          confirmButtonColor: '#059669'
        });
      }
    }
  };

  const filteredData = data.filter((item) =>
    (item.NAMA_INDIKATOR_UTAMA?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (item.KODE_INDIKATOR_UTAMA?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (item.program?.NAMA_PROGRAM?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Indikator Utama</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data indikator utama dan relasinya dengan program</p>
        </div>
        <button 
          onClick={() => handleOpenModal("add")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Indikator Utama
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
              placeholder="Cari indikator utama..."
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                  No.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                  Kode
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nama Indikator Utama
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Program Terkait
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data indikator utama ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.ID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                      {item.KODE_INDIKATOR_UTAMA}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {item.NAMA_INDIKATOR_UTAMA}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.program ? (
                        <div>
                          <span className="font-medium text-slate-700">{item.program.KODE_PROGRAM}</span>
                          <span className="mx-1">-</span>
                          {item.program.NAMA_PROGRAM}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada program</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal("edit", item)}
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
                {modalMode === "add" ? "Tambah Indikator Utama" : "Edit Indikator Utama"}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <form id="indikator-utama-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="PROGRAM_ID" className="block text-sm font-medium text-slate-700 mb-1">
                    Program Terkait <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="PROGRAM_ID"
                    required
                    value={formData.PROGRAM_ID}
                    onChange={(e) => setFormData({ ...formData, PROGRAM_ID: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="" disabled>Pilih Program</option>
                    {programs.map((prog) => (
                      <option key={prog.ID} value={prog.ID}>
                        {prog.KODE_PROGRAM} - {prog.NAMA_PROGRAM}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="KODE_INDIKATOR_UTAMA" className="block text-sm font-medium text-slate-700 mb-1">
                    Kode Indikator Utama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="KODE_INDIKATOR_UTAMA"
                    required
                    maxLength={50}
                    value={formData.KODE_INDIKATOR_UTAMA}
                    onChange={(e) => setFormData({ ...formData, KODE_INDIKATOR_UTAMA: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Masukkan kode indikator utama"
                  />
                </div>
                <div>
                  <label htmlFor="NAMA_INDIKATOR_UTAMA" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Indikator Utama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="NAMA_INDIKATOR_UTAMA"
                    required
                    rows={3}
                    maxLength={200}
                    value={formData.NAMA_INDIKATOR_UTAMA}
                    onChange={(e) => setFormData({ ...formData, NAMA_INDIKATOR_UTAMA: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Masukkan nama indikator utama"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="FLAG_ACTIVE"
                    checked={formData.FLAG_ACTIVE}
                    onChange={(e) => setFormData({ ...formData, FLAG_ACTIVE: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="FLAG_ACTIVE" className="ml-2 block text-sm text-slate-700">
                    Indikator Aktif
                  </label>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="indikator-utama-form"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
