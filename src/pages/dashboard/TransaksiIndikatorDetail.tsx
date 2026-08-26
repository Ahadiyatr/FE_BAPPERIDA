import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, CheckCircle2, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import { Toast } from "../../utils/toast";
import Pagination from "../../components/Pagination";
import api from "../../services/api";

interface TransIndikatorDetail {
  ID: number;
  TRANS_INDIKATOR_BIDANG_ID: number;
  TIPE_AKTIFITAS: string;
  LIST_AKTIFITAS_UTAMA_ID: number | null;
  LIST_AKTIFITAS_PENDUKUNG_ID: number | null;
  NAMA_AKTIFITAS?: string;
  TARGET: string;
  BOBOT_TARGET: string;
  FLAG_ACTIVE: number | boolean;
  LOG_ENTRY_NAME?: string | null;
  LOG_ENTRY_DATE?: string | null;
  LOG_UPDATE_NAME?: string | null;
  LOG_UPDATE_DATE?: string | null;
}

interface TransIndikatorBidang {
  ID: number;
  NAMA_BIDANG?: string;
  NAMA_INDIKATOR_SUB?: string;
  NAMA_PERIODE?: string;
}

export default function TransaksiIndikatorDetail() {
  const [data, setData] = useState<TransIndikatorDetail[]>([]);
  const [bidangMappingList, setBidangMappingList] = useState<TransIndikatorBidang[]>([]);

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
    TRANS_INDIKATOR_BIDANG_ID: "",
    TIPE_AKTIFITAS: "UTAMA",
    TARGET: "",
    BOBOT_TARGET: "",
    FLAG_ACTIVE: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDetail, resBidang] = await Promise.all([
        api.get("/api/trans-indikator-detail"),
        api.get("/api/trans-indikator-bidang"),
      ]);

      const detailData = resDetail.data.data || resDetail.data || [];
      const bidangData = resBidang.data.data || resBidang.data || [];

      setBidangMappingList(Array.isArray(bidangData) ? bidangData : []);
      setData(Array.isArray(detailData) ? detailData : []);
      setError("");
    } catch (err: any) {
      console.error("Gagal mengambil data:", err);
      setError("Gagal memuat data transaksi indikator detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = async (mode: "add" | "edit", item?: TransIndikatorDetail) => {
    setModalMode(mode);
    if (mode === "edit" && item) {
      setCurrentId(item.ID);
      try {
        const response = await api.get(`/api/trans-indikator-detail/${item.ID}`);
        const detail = response.data.data || response.data;

        setFormData({
          TRANS_INDIKATOR_BIDANG_ID: detail.TRANS_INDIKATOR_BIDANG_ID
            ? detail.TRANS_INDIKATOR_BIDANG_ID.toString()
            : "",
          TIPE_AKTIFITAS: detail.TIPE_AKTIFITAS || "UTAMA",
          TARGET: detail.TARGET !== undefined && detail.TARGET !== null ? detail.TARGET.toString() : "",
          BOBOT_TARGET: detail.BOBOT_TARGET !== undefined && detail.BOBOT_TARGET !== null
            ? detail.BOBOT_TARGET.toString()
            : "",
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
        TRANS_INDIKATOR_BIDANG_ID: "",
        TIPE_AKTIFITAS: "UTAMA",
        TARGET: "",
        BOBOT_TARGET: "",
        FLAG_ACTIVE: true,
      });
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      TRANS_INDIKATOR_BIDANG_ID: "",
      TIPE_AKTIFITAS: "UTAMA",
      TARGET: "",
      BOBOT_TARGET: "",
      FLAG_ACTIVE: true,
    });
    setCurrentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        TRANS_INDIKATOR_BIDANG_ID: parseInt(formData.TRANS_INDIKATOR_BIDANG_ID),
        TIPE_AKTIFITAS: formData.TIPE_AKTIFITAS,
        TARGET: parseFloat(formData.TARGET),
        BOBOT_TARGET: parseFloat(formData.BOBOT_TARGET),
        FLAG_ACTIVE: formData.FLAG_ACTIVE,
      };

      if (modalMode === "add") {
        await api.post("/api/trans-indikator-detail", payload);
      } else if (modalMode === "edit" && currentId) {
        await api.put(`/api/trans-indikator-detail/${currentId}`, payload);
      }
      handleCloseModal();
      fetchData();
      Toast.fire({ icon: "success", title: "Data berhasil disimpan" });
    } catch (err: any) {
      console.error("Gagal menyimpan data:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Terjadi kesalahan.",
        confirmButtonColor: "#059669",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin ingin menghapus data?",
      text: "Data yang dihapus tidak bisa dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/trans-indikator-detail/${id}`);
        fetchData();
        Toast.fire({ icon: "success", title: "Data berhasil dihapus" });
      } catch (err: any) {
        console.error("Gagal menghapus data:", err);
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: err.response?.data?.message || "Terjadi kesalahan saat menghapus data.",
          confirmButtonColor: "#059669",
        });
      }
    }
  };

  const filteredData = data.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      (item.NAMA_AKTIFITAS?.toLowerCase() || "").includes(searchLower) ||
      (item.TIPE_AKTIFITAS?.toLowerCase() || "").includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaksi Indikator Detail</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola detail aktifitas dan target</p>
        </div>
        <button
          onClick={() => handleOpenModal("add")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Detail
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
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
              placeholder="Cari aktifitas..."
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
                  Nama Aktifitas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tipe
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Target
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Bobot Target
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
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data detail aktifitas ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.ID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.NAMA_AKTIFITAS || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.TIPE_AKTIFITAS === "UTAMA"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.TIPE_AKTIFITAS}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-emerald-600">
                      {item.TARGET}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-600">
                      {item.BOBOT_TARGET}
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
                {modalMode === "add" ? "Tambah Detail Aktifitas" : "Edit Detail Aktifitas"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <form id="detail-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="TRANS_INDIKATOR_BIDANG_ID" className="block text-sm font-medium text-slate-700 mb-1">
                    Mapping Indikator Bidang <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="TRANS_INDIKATOR_BIDANG_ID"
                    required
                    value={formData.TRANS_INDIKATOR_BIDANG_ID}
                    onChange={(e) => setFormData({ ...formData, TRANS_INDIKATOR_BIDANG_ID: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- Pilih Mapping --</option>
                    {bidangMappingList.map((m) => (
                      <option key={m.ID} value={m.ID}>
                        {m.NAMA_BIDANG} - {m.NAMA_INDIKATOR_SUB} ({m.NAMA_PERIODE})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="TIPE_AKTIFITAS" className="block text-sm font-medium text-slate-700 mb-1">
                    Tipe Aktifitas <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="TIPE_AKTIFITAS"
                    required
                    value={formData.TIPE_AKTIFITAS}
                    onChange={(e) => setFormData({ ...formData, TIPE_AKTIFITAS: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="UTAMA">UTAMA</option>
                    <option value="PENDUKUNG">PENDUKUNG</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="TARGET" className="block text-sm font-medium text-slate-700 mb-1">
                    Target <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="TARGET"
                    required
                    step="0.01"
                    min="0"
                    value={formData.TARGET}
                    onChange={(e) => setFormData({ ...formData, TARGET: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: 10"
                  />
                </div>

                <div>
                  <label htmlFor="BOBOT_TARGET" className="block text-sm font-medium text-slate-700 mb-1">
                    Bobot Target <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="BOBOT_TARGET"
                    required
                    step="0.0001"
                    min="0"
                    max="1"
                    value={formData.BOBOT_TARGET}
                    onChange={(e) => setFormData({ ...formData, BOBOT_TARGET: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: 0.0750"
                  />
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
                    Aktif
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
                form="detail-form"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
