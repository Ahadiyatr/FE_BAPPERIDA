import React, { useState, useEffect } from "react";
import { Search, Eye, Edit, Trash2, Plus, X, Minus } from "lucide-react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Toast } from "../../utils/toast";
import Pagination from "../../components/Pagination";

interface Rencana {
  CAPAIAN_ID: number;
  PERIODE_ID: number;
  NAMA_PERIODE: string;
  BIDANG_ID: number;
  NAMA_BIDANG: string;
  PROGRAM_ID: number;
  NAMA_PROGRAM: string;
  INDIKATOR_UTAMA_ID: number;
  NAMA_INDIKATOR_UTAMA: string;
  INDIKATOR_ID: number;
  NAMA_INDIKATOR: string;
  TARGET: string;
  REALISASI: string;
  PERSENTASE: string;
  TOTAL_KEGIATAN: number;
  LAST_CALCULATE_DATE: string;
  FLAG_ACTIVE: number;
}

export default function RencanaKegiatan() {
  const [data, setData] = useState<Rencana[]>([]);
  const [filteredData, setFilteredData] = useState<Rencana[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [filterBidang, setFilterBidang] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filterIndikatorUtama, setFilterIndikatorUtama] = useState("");
  const [filterSubIndikator, setFilterSubIndikator] = useState("");

  const [dropdowns, setDropdowns] = useState<any>({ periode: [], bidang: [], program: [], indikator_utama: [], indikator: [], jenis_kegiatan: [] });

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    PERIODE_ID: "",
    BIDANG_ID: "",
    PROGRAM_ID: "",
    INDIKATOR_UTAMA_ID: "",
    MASTER_INDIKATOR_ID: "",
  });
  
  // Detail State for 'add' mode
  const [details, setDetails] = useState<{ JENIS_KEGIATAN: string, TARGET: string, isCustom?: boolean }>([{ JENIS_KEGIATAN: "", TARGET: "" }]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/rencana-kegiatan");
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const res = await api.get("/api/dropdown/rencana-kegiatan");
      setDropdowns((prev: any) => ({ ...prev, ...(res.data.data || {}) }));
      
      // Attempt to load jenis kegiatan if route exists
      try {
        const resJenis = await api.get("/api/dropdown/jenis-kegiatan");
        setDropdowns((prev: any) => ({ 
          ...prev, 
          jenis_kegiatan: Array.isArray(resJenis.data.data) ? resJenis.data.data : []
        }));
      } catch (e) {
        console.error("Gagal load jenis kegiatan:", e);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let result = data;
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(d =>
        (d.NAMA_BIDANG?.toLowerCase().includes(term)) ||
        (d.NAMA_PROGRAM?.toLowerCase().includes(term)) ||
        (d.NAMA_INDIKATOR?.toLowerCase().includes(term)) ||
        (d.NAMA_INDIKATOR_UTAMA?.toLowerCase().includes(term))
      );
    }
    if (filterBidang) result = result.filter(d => d.BIDANG_ID.toString() === filterBidang);
    if (filterProgram) result = result.filter(d => d.PROGRAM_ID.toString() === filterProgram);
    if (filterIndikatorUtama) result = result.filter(d => d.INDIKATOR_UTAMA_ID.toString() === filterIndikatorUtama);
    if (filterSubIndikator) result = result.filter(d => d.INDIKATOR_ID.toString() === filterSubIndikator);

    setFilteredData(result);
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [search, filterBidang, filterProgram, filterIndikatorUtama, filterSubIndikator, data]);

  const handleOpenForm = (openMode: "add" | "edit", item?: any) => {
    setFormMode(openMode);
    if (openMode === "edit" && item) {
      setCurrentId(item.CAPAIAN_ID);
      setFormData({
        PERIODE_ID: item.PERIODE_ID?.toString() || "",
        BIDANG_ID: item.BIDANG_ID?.toString() || "",
        PROGRAM_ID: item.PROGRAM_ID?.toString() || "",
        INDIKATOR_UTAMA_ID: item.INDIKATOR_UTAMA_ID?.toString() || "",
        MASTER_INDIKATOR_ID: item.INDIKATOR_ID?.toString() || "",
      });
      setDetails([]); // Not used in edit mode
    } else {
      setCurrentId(null);
      setFormData({
        PERIODE_ID: "",
        BIDANG_ID: "",
        PROGRAM_ID: "",
        INDIKATOR_UTAMA_ID: "",
        MASTER_INDIKATOR_ID: "",
      });
      setDetails([{ JENIS_KEGIATAN: "", TARGET: "" }]);
    }
    setIsFormOpen(true);
  };

  const handleAddDetailRow = () => {
    setDetails(prev => [...prev, { JENIS_KEGIATAN: "", TARGET: "" }]);
  };

  const handleRemoveDetailRow = (index: number) => {
    setDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleDetailChange = (index: number, field: "JENIS_KEGIATAN" | "TARGET" | "isCustom", value: any) => {
    const newDetails = [...details];
    if (field === "JENIS_KEGIATAN" && value === "__CUSTOM__") {
      newDetails[index] = { ...newDetails[index], isCustom: true, JENIS_KEGIATAN: "" };
    } else {
      newDetails[index] = { ...newDetails[index], [field]: value };
    }
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        PERIODE_ID: formData.PERIODE_ID,
        BIDANG_ID: formData.BIDANG_ID,
        MASTER_INDIKATOR_ID: formData.MASTER_INDIKATOR_ID,
      };

      if (formMode === "add") {
        if (details.length === 0) {
          alert("Minimal tambahkan 1 jenis kegiatan");
          setIsSubmitting(false);
          return;
        }
        payload.DETAIL = details.map(d => ({
          JENIS_KEGIATAN: d.JENIS_KEGIATAN,
          TARGET: Number(d.TARGET)
        }));
        await api.post("/api/rencana-kegiatan", payload);
      } else {
        await api.put(`/api/rencana-kegiatan/${currentId}`, payload);
      }
      setIsFormOpen(false);
      fetchData();
      Toast.fire({
        icon: 'success',
        title: 'Data berhasil disimpan'
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || err.response?.data?.error || "Terjadi kesalahan.",
        confirmButtonColor: '#059669'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
     const result = await Swal.fire({
       title: 'Apakah Anda yakin ingin menghapus data?',
       text: "Tindakan ini tidak bisa dibatalkan jika belum ada relasi.",
       icon: 'warning',
       showCancelButton: true,
       confirmButtonColor: '#ef4444',
       cancelButtonColor: '#94a3b8',
       confirmButtonText: 'Ya, hapus!',
       cancelButtonText: 'Batal'
     });

     if (!result.isConfirmed) return;

     try {
       await api.delete(`/api/rencana-kegiatan/${id}`);
       fetchData();
       Toast.fire({
         icon: 'success',
         title: 'Data berhasil dihapus'
       });
     } catch (err: any) {
       Swal.fire({
         icon: 'error',
         title: 'Gagal',
         text: err.response?.data?.message || "Gagal menghapus data.",
         confirmButtonColor: '#059669'
       });
     }
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rencana Kegiatan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola perancangan program kerja Bapperrida</p>
        </div>
        <button 
           onClick={() => handleOpenForm("add")}
           className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Rencana Baru
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari program / indikator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap flex-1">
            <select
              value={filterBidang}
              onChange={(e) => setFilterBidang(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 min-w-[140px]"
            >
              <option value="">Semua Bidang</option>
              {dropdowns.bidang?.map((b: any) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 min-w-[140px]"
            >
              <option value="">Semua Program</option>
              {dropdowns.program?.map((p: any) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16">No</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Bidang & Program</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Indikator</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Target</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Capaian</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.CAPAIAN_ID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-center text-sm font-bold text-slate-900">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                         {item.NAMA_PERIODE || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{item.NAMA_BIDANG || "-"}</div>
                      <div className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200 line-clamp-1">{item.NAMA_PROGRAM || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-emerald-700 mb-1 line-clamp-1">{item.NAMA_INDIKATOR_UTAMA || "-"}</div>
                      <div className="text-xs font-medium text-slate-600 line-clamp-1">{item.NAMA_INDIKATOR || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-black text-slate-800 bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-200">{Number(item.TARGET) || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          <span>Progress</span>
                          <span className={Number(item.PERSENTASE) >= 100 ? 'text-emerald-600' : 'text-slate-700'}>{item.PERSENTASE || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(Number(item.PERSENTASE || 0), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/dashboard/rencana-kegiatan/detail/${item.CAPAIAN_ID}`)}
                          className="bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 p-2 rounded-lg shadow-sm transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Edit button disabled per request 
                        <button 
                          onClick={() => handleOpenForm("edit", item)} 
                          className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 p-2 rounded-lg shadow-sm transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        */}
                        <button 
                          onClick={() => {
                             Swal.fire({
                               title: 'Hapus data diblokir',
                               text: 'Hapus data utama dinonaktifkan sementara dari UI. Parent ID ini terhubung dengan realisasi.',
                               icon: 'info',
                               confirmButtonColor: '#059669'
                             })
                          }}
                          className="bg-white hover:bg-red-50 text-red-500 border border-red-200 p-2 rounded-lg shadow-sm transition-colors"
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
        
        {/* Pagination Rendering */}
        {!loading && filteredData.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Form Modal (Edit Periode, Bidang, Indikator) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">
                {formMode === "add" ? "Tambah Rencana Kegiatan" : "Edit Hubungan Data Rencana Kegiatan"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm border border-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Mode edit dinonaktifkan sementara sesuai permintaan */}
              {/* formMode === 'edit' && (
                 <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium p-3 rounded-xl mb-4">
                   Mode edit admin khusus untuk memodifikasi relasi periode, bidang, dan indikator pada data ini.
                 </div>
              ) */}
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Periode</label>
                <select required value={formData.PERIODE_ID} onChange={e => setFormData({ ...formData, PERIODE_ID: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-sm bg-white shadow-sm">
                  <option value="">Pilih Periode...</option>
                  {dropdowns.periode?.map((p: any) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Bidang</label>
                <select required value={formData.BIDANG_ID} onChange={e => setFormData({ ...formData, BIDANG_ID: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-sm bg-white shadow-sm">
                  <option value="">Pilih Bidang...</option>
                  {dropdowns.bidang?.map((b: any) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Program</label>
                <select required value={formData.PROGRAM_ID} onChange={e => setFormData({ ...formData, PROGRAM_ID: e.target.value, INDIKATOR_UTAMA_ID: "", MASTER_INDIKATOR_ID: "" })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-sm bg-white shadow-sm">
                  <option value="">Pilih Program...</option>
                  {dropdowns.program?.map((p: any) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              {formData.PROGRAM_ID && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Indikator Utama</label>
                  <select required value={formData.INDIKATOR_UTAMA_ID} onChange={e => setFormData({ ...formData, INDIKATOR_UTAMA_ID: e.target.value, MASTER_INDIKATOR_ID: "" })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-sm bg-white shadow-sm">
                    <option value="">Pilih Indikator Utama...</option>
                    {dropdowns.indikator_utama?.filter((i: any) => String(i.PROGRAM_ID) === String(formData.PROGRAM_ID)).map((i: any) => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.INDIKATOR_UTAMA_ID && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Sub Indikator</label>
                  <select required value={formData.MASTER_INDIKATOR_ID} onChange={e => setFormData({ ...formData, MASTER_INDIKATOR_ID: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-sm bg-white shadow-sm">
                    <option value="">Pilih Sub Indikator...</option>
                    {dropdowns.indikator?.filter((i: any) => String(i.INDIKATOR_UTAMA_ID) === String(formData.INDIKATOR_UTAMA_ID)).map((i: any) => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {formMode === "add" && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Daftar Jenis Kegiatan</label>
                    <button 
                       type="button" 
                       onClick={handleAddDetailRow}
                       className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Kegiatan
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {details.map((detail, index) => (
                      <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                         {details.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => handleRemoveDetailRow(index)}
                              className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 p-1 rounded-full shadow-sm"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                         )}
                         <div className="flex-1 space-y-2">
                           {detail.isCustom ? (
                             <div className="flex items-center gap-2">
                               <input 
                                 type="text" 
                                 required 
                                 placeholder="Ketik Jenis Kegiatan Baru..." 
                                 value={detail.JENIS_KEGIATAN} 
                                 onChange={e => handleDetailChange(index, "JENIS_KEGIATAN", e.target.value)}
                                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                                 autoFocus
                               />
                               <button 
                                 type="button" 
                                 onClick={() => handleDetailChange(index, "isCustom", false)}
                                 className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm shrink-0"
                                 title="Batal ketik manual"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                             </div>
                           ) : (
                             <select 
                               required 
                               value={detail.JENIS_KEGIATAN} 
                               onChange={e => handleDetailChange(index, "JENIS_KEGIATAN", e.target.value)}
                               className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                             >
                               <option value="">Pilih Jenis Kegiatan...</option>
                               {dropdowns.jenis_kegiatan && dropdowns.jenis_kegiatan.length > 0 ? (
                                 dropdowns.jenis_kegiatan.map((j: any) => (
                                   <option key={j.value} value={j.label}>{j.label}</option>
                                 ))
                               ) : (
                                 <option value="" disabled>Sedang memuat data...</option>
                               )}
                               <option value="__CUSTOM__" className="font-bold text-emerald-700 bg-emerald-50">
                                 + Ketik Manual (Baru)
                               </option>
                             </select>
                           )}
                           <input 
                             type="number" 
                             required 
                             min={1} 
                             placeholder="Target" 
                             value={detail.TARGET} 
                             onChange={e => handleDetailChange(index, "TARGET", e.target.value)}
                             className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                           />
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </form>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
               <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 text-sm shadow-sm transition-colors">Batal</button>
               <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm tracking-wide shadow-sm transition-colors flex items-center justify-center min-w-[120px]">
                 {isSubmitting ? <><div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : "Simpan Data"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
