import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, CheckCircle2, XCircle } from "lucide-react";
import api from "../../services/api";

interface TransIndikatorBidang {
  ID: number;
  PERIODE_ID: number;
  BIDANG_ID: number;
  MASTER_INDIKATOR_ID: number;
  NAMA_PROGRAM?: string;
  NAMA_INDIKATOR_UTAMA?: string;
  NAMA_INDIKATOR?: string;
  NAMA_BIDANG?: string;
  NAMA_PERIODE?: string;
  FLAG_ACTIVE: boolean;
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
  NAMA_INDIKATOR: string;
  KODE_INDIKATOR: string;
}

export default function TransaksiIndikatorBidang() {
  const [data, setData] = useState<TransIndikatorBidang[]>([]);
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [bidangList, setBidangList] = useState<Bidang[]>([]);
  const [indikatorList, setIndikatorList] = useState<Indikator[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    PERIODE_ID: "",
    BIDANG_ID: "",
    MASTER_INDIKATOR_ID: "",
    FLAG_ACTIVE: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/trans-indikator-bidang");
      const responseData = response.data.data || response.data;
      setData(Array.isArray(responseData) ? responseData : []);
      setError("");
    } catch (err: any) {
      console.error("Gagal mengambil data:", err);
      setError("Gagal memuat data transaksi indikator bidang.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [resPeriode, resBidang, resIndikator] = await Promise.all([
        api.get("/api/master-periode"),
        api.get("/api/master-bidang"),
        api.get("/api/master-indikator")
      ]);
      
      setPeriodeList(resPeriode.data.data || resPeriode.data || []);
      setBidangList(resBidang.data.data || resBidang.data || []);
      setIndikatorList(resIndikator.data.data || resIndikator.data || []);
    } catch (err) {
      console.error("Gagal mengambil data referensi:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const handleOpenModal = async (mode: "add" | "edit", item?: TransIndikatorBidang) => {
    setModalMode(mode);
    if (mode === "edit" && item) {
      setCurrentId(item.ID);
      
      try {
        // Fetch detail data because the list view might not contain the foreign keys
        const response = await api.get(`/api/trans-indikator-bidang/${item.ID}`);
        const detail = response.data.data || response.data;
        
        setFormData({
          PERIODE_ID: detail.PERIODE_ID ? detail.PERIODE_ID.toString() : "",
          BIDANG_ID: detail.BIDANG_ID ? detail.BIDANG_ID.toString() : "",
          MASTER_INDIKATOR_ID: detail.MASTER_INDIKATOR_ID ? detail.MASTER_INDIKATOR_ID.toString() : "",
          FLAG_ACTIVE: detail.FLAG_ACTIVE === undefined ? true : Boolean(detail.FLAG_ACTIVE),
        });
        setIsModalOpen(true);
      } catch (err) {
        console.error("Gagal mengambil detail data:", err);
        alert("Gagal mengambil detail data untuk diedit.");
      }
    } else {
      setCurrentId(null);
      setFormData({
        PERIODE_ID: "",
        BIDANG_ID: "",
        MASTER_INDIKATOR_ID: "",
        FLAG_ACTIVE: true,
      });
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ PERIODE_ID: "", BIDANG_ID: "", MASTER_INDIKATOR_ID: "", FLAG_ACTIVE: true });
    setCurrentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        PERIODE_ID: parseInt(formData.PERIODE_ID),
        BIDANG_ID: parseInt(formData.BIDANG_ID),
        MASTER_INDIKATOR_ID: parseInt(formData.MASTER_INDIKATOR_ID),
        FLAG_ACTIVE: formData.FLAG_ACTIVE
      };

      if (modalMode === "add") {
        await api.post("/api/trans-indikator-bidang", payload);
      } else if (modalMode === "edit" && currentId) {
        await api.put(`/api/trans-indikator-bidang/${currentId}`, payload);
      }
      handleCloseModal();
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error("Gagal menyimpan data:", err);
      alert(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/trans-indikator-bidang/${deleteId}`);
      fetchData(); // Refresh data
      cancelDelete();
    } catch (err: any) {
      console.error("Gagal menghapus data:", err);
      alert(err.response?.data?.message || "Terjadi kesalahan saat menghapus data.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredData = data.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      (item.NAMA_PROGRAM?.toLowerCase() || "").includes(searchLower) ||
      (item.NAMA_INDIKATOR_UTAMA?.toLowerCase() || "").includes(searchLower) ||
      (item.NAMA_INDIKATOR?.toLowerCase() || "").includes(searchLower) ||
      (item.NAMA_BIDANG?.toLowerCase() || "").includes(searchLower) ||
      (item.NAMA_PERIODE?.toLowerCase() || "").includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaksi Indikator Bidang</h1>
          <p className="text-sm text-slate-500 mt-1">Mapping indikator ke masing-masing bidang</p>
        </div>
        <button 
          onClick={() => handleOpenModal("add")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Mapping
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
              placeholder="Cari mapping..."
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Periode
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Bidang
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Program
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Indikator Utama
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Indikator
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data mapping ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.ID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {item.NAMA_PERIODE || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {item.NAMA_BIDANG || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.NAMA_PROGRAM || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.NAMA_INDIKATOR_UTAMA || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.NAMA_INDIKATOR || "-"}
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
                          onClick={() => confirmDelete(item.ID)}
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
        
        {!loading && (
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
            <div className="text-sm text-slate-500">
              Menampilkan <span className="font-medium">{filteredData.length}</span> data
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {modalMode === "add" ? "Tambah Mapping" : "Edit Mapping"}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <form id="mapping-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="PERIODE_ID" className="block text-sm font-medium text-slate-700 mb-1">
                    Periode <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="PERIODE_ID"
                    required
                    value={formData.PERIODE_ID}
                    onChange={(e) => setFormData({ ...formData, PERIODE_ID: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- Pilih Periode --</option>
                    {periodeList.map((p) => (
                      <option key={p.ID} value={p.ID}>
                        {p.NAMA_PERIODE}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="BIDANG_ID" className="block text-sm font-medium text-slate-700 mb-1">
                    Bidang <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="BIDANG_ID"
                    required
                    value={formData.BIDANG_ID}
                    onChange={(e) => setFormData({ ...formData, BIDANG_ID: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- Pilih Bidang --</option>
                    {bidangList.map((b) => (
                      <option key={b.ID} value={b.ID}>
                        {b.NAMA_BIDANG}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="MASTER_INDIKATOR_ID" className="block text-sm font-medium text-slate-700 mb-1">
                    Indikator <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="MASTER_INDIKATOR_ID"
                    required
                    value={formData.MASTER_INDIKATOR_ID}
                    onChange={(e) => setFormData({ ...formData, MASTER_INDIKATOR_ID: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- Pilih Indikator --</option>
                    {indikatorList.map((i) => (
                      <option key={i.ID} value={i.ID}>
                        {i.KODE_INDIKATOR} - {i.NAMA_INDIKATOR}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="FLAG_ACTIVE"
                    checked={formData.FLAG_ACTIVE}
                    onChange={(e) => setFormData({ ...formData, FLAG_ACTIVE: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="FLAG_ACTIVE" className="ml-2 block text-sm text-slate-700">
                    Mapping Aktif
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
                form="mapping-form"
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Hapus Mapping?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Apakah Anda yakin ingin menghapus mapping indikator bidang ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-full"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2 w-full"
                >
                  {isDeleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
