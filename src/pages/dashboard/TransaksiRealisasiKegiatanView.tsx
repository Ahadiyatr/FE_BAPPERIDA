import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Image as ImageIcon, FileText, ChevronDown, ChevronRight, Download, Eye, X, Edit, Trash2 } from "lucide-react";
import api from "../../services/api";

interface ViewProps {
  mode: "detail" | "edit";
}

export default function TransaksiRealisasiKegiatanView({ mode }: ViewProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bidang, setBidang] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [realisasi, setRealisasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedDetail, setExpandedDetail] = useState<number | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [currentRealisasiId, setCurrentRealisasiId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    INDIKATOR_DETAIL_ID: "",
    TANGGAL_KEGIATAN: "",
    KETERANGAN: "",
    WAKTU_KEGIATAN: "", // Optional, but used in UI (e.g. HH:MM)
  });
  const [fileFoto, setFileFoto] = useState<FileList | null>(null);
  const [fileDocument, setFileDocument] = useState<File | null>(null);
  const fileFotoRef = useRef<HTMLInputElement>(null);
  const fileDocumentRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Media Modal
  const [mediaToView, setMediaToView] = useState<{ type: 'foto' | 'document', urls: string[] } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/realisasi-kegiatan/${id}`);
      const data = res.data.data;

      const fetchedBidang = data.header;
      setBidang(fetchedBidang);

      const allDetails = data.rekap || [];
      setDetails(allDetails);

      const allRealisasi = data.realisasi || [];
      const formattedRealisasi = allRealisasi.map((r: any) => {
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
      setRealisasi(formattedRealisasi);
      
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data.");
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

  // Form Handlers
  const handleOpenForm = (openMode: "add" | "edit", detailId?: number, item?: any) => {
    setFormMode(openMode);
    setFileFoto(null);
    setFileDocument(null);
    if (fileFotoRef.current) fileFotoRef.current.value = "";
    if (fileDocumentRef.current) fileDocumentRef.current.value = "";

    if (openMode === "edit" && item) {
      setCurrentRealisasiId(item.ID);
      let dateVal = "";
      let timeVal = "";
      if (item.TANGGAL_KEGIATAN) {
        const parts = item.TANGGAL_KEGIATAN.split(/[\sT]/);
        dateVal = parts[0] || "";
        timeVal = parts[1] ? parts[1].substring(0, 5) : "08:00";
      }
      setFormData({
        INDIKATOR_DETAIL_ID: item.INDIKATOR_DETAIL_ID?.toString() || "",
        TANGGAL_KEGIATAN: dateVal,
        WAKTU_KEGIATAN: timeVal, 
        KETERANGAN: item.KETERANGAN || "",
      });
    } else {
      setCurrentRealisasiId(null);
      setFormData({
        INDIKATOR_DETAIL_ID: detailId ? detailId.toString() : "",
        TANGGAL_KEGIATAN: new Date().toISOString().split('T')[0],
        WAKTU_KEGIATAN: "08:00",
        KETERANGAN: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("INDIKATOR_DETAIL_ID", formData.INDIKATOR_DETAIL_ID);
      payload.append("TANGGAL_KEGIATAN", formData.WAKTU_KEGIATAN ? `${formData.TANGGAL_KEGIATAN} ${formData.WAKTU_KEGIATAN}:00` : formData.TANGGAL_KEGIATAN);
      if (formData.KETERANGAN) payload.append("KETERANGAN", formData.KETERANGAN);
      payload.append("FLAG_ACTIVE", "1");

      if (fileFoto && fileFoto.length > 0) {
        Array.from(fileFoto).forEach(f => payload.append("FILE_FOTO[]", f));
      }
      if (fileDocument) payload.append("FILE_DOCUMENT", fileDocument);

      if (formMode === "add") {
        await api.post(`/api/realisasi-kegiatan/${formData.INDIKATOR_DETAIL_ID}`, payload, { headers: { "Content-Type": "multipart/form-data" }});
      } else {
        payload.append("_method", "PUT");
        await api.post(`/api/realisasi-kegiatan/${currentRealisasiId}`, payload, { headers: { "Content-Type": "multipart/form-data" }});
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus realisasi ini?")) return;
    try {
      await api.delete(`/api/realisasi-kegiatan/${id}`);
      fetchData();
    } catch (e) {
      alert("Gagal menghapus.");
    }
  };

  const getMediaUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    return `${baseUrl}/storage${path.startsWith('/') ? path : `/${path}`}`.replace('/storage/storage', '/storage');
  };

  if (loading) return <div className="p-8 text-center text-emerald-600 font-medium">Memuat data...</div>;
  if (!bidang) return <div className="p-8 text-center text-red-500">Data tidak ditemukan.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard/transaksi-realisasi-kegiatan')}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
               {mode === 'detail' ? 'Detail Monitoring Kegiatan' : 'Edit Monitoring Kegiatan'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Rincian capaian realisasi berdasarkan indikator</p>
          </div>
        </div>
        {mode === 'detail' && (
          <button 
            onClick={() => navigate(`/dashboard/transaksi-realisasi-kegiatan/edit/${id}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <Edit className="w-4 h-4"/>
            Ubah ke Mode Edit
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">{bidang.NAMA_INDIKATOR_UTAMA}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">{bidang.NAMA_BIDANG}</span>
             </div>
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 flex-wrap">
                {bidang.NAMA_INDIKATOR}
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-200 shadow-sm">
                  {bidang.PERSENTASE || 0}% TERCAPAI
                </span>
             </h2>
           </div>
        </div>
        <div className="overflow-x-auto p-6 pt-2">
          <table className="min-w-full text-left">
             <thead>
               <tr className="border-b border-slate-200">
                 <th className="pb-3 text-sm font-semibold text-slate-500 font-sans">Jenis Kegiatan</th>
                 <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-center w-24">TARGET</th>
                 <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-center w-24">REALISASI</th>
                 <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-center w-24">BOBOT</th>
                 <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-center w-24">PERSENTASE</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {details.map((d: any) => {
                 const target = parseFloat(d.TARGET) || 0;
                 const rCount = parseFloat(d.REALISASI) || 0;
                 const persentase = parseFloat(d.PERSENTASE) || 0;
                 const bobot = (1 / details.length).toFixed(2); // Mock bobot
                 const isComplete = persentase >= 100;
                 return (
                   <tr key={d.DETAIL_ID} className="hover:bg-slate-50/50 transition-colors">
                     <td className="py-4 pr-4 text-sm font-medium text-slate-800">{d.JENIS_KEGIATAN}</td>
                     <td className="py-4 text-sm text-center font-bold text-slate-700">{target}</td>
                     <td className="py-4 text-sm text-center font-bold text-emerald-600">{rCount}</td>
                     <td className="py-4 text-sm text-center text-slate-500">{bobot}</td>
                     <td className={`py-4 text-sm text-center font-bold ${isComplete ? 'text-emerald-600' : 'text-slate-700'}`}>{persentase}%</td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-4">Riwayat Realisasi</h3>
        <div className="space-y-3">
           {details.map((d) => {
             const isExpanded = expandedDetail === d.DETAIL_ID;
             const myRealisasi = realisasi.filter(r => r.JENIS_KEGIATAN === d.JENIS_KEGIATAN || String(r.INDIKATOR_DETAIL_ID) === String(d.DETAIL_ID));
             
             return (
               <div key={d.DETAIL_ID} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <button 
                   onClick={() => toggleAccordion(d.DETAIL_ID)}
                   className="w-full flex items-center gap-4 py-4 px-5 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                 >
                   <div className={`p-1 rounded bg-white border border-slate-200 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight className="w-4 h-4" />
                   </div>
                   <span className="font-semibold text-slate-900 flex-1">{d.JENIS_KEGIATAN}</span>
                   <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">{myRealisasi.length} Realisasi</span>
                 </button>
                 
                 {isExpanded && (
                   <div className="p-5 bg-white space-y-6">
                      {myRealisasi.length === 0 ? (
                        <div className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">Belum ada data realisasi.</div>
                      ) : (
                        myRealisasi.map((r, i) => {
                          let dateStr = r.TANGGAL_KEGIATAN || "";
                          let timeStr = "08:00";
                          if (dateStr) {
                             const parts = dateStr.split(/[\sT]/);
                             if(parts.length > 1) {
                               dateStr = parts[0];
                               timeStr = parts[1].substring(0, 5);
                             }
                             const dParts = dateStr.split("-");
                             if(dParts.length === 3) {
                               dateStr = `${dParts[2]}/${dParts[1]}/${dParts[0].substring(2)}`;
                             }
                          }

                          return (
                            <div key={r.ID} className="flex flex-col md:flex-row gap-6 p-5 border border-slate-200 rounded-xl bg-slate-50/50">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                       <div className="flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shadow-sm border border-emerald-200">{i + 1}</span>
                                          <span className="text-sm font-bold text-slate-800 tracking-wider uppercase">{dateStr} • {timeStr}</span>
                                       </div>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                       {r.KETERANGAN || "Tidak ada keterangan tambahan."}
                                    </p>
                                    
                                    {mode === 'edit' && (
                                       <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                                          <button onClick={() => handleOpenForm("edit", d.DETAIL_ID, r)} className="text-xs font-medium bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                            <Edit className="w-3.5 h-3.5"/> Edit
                                          </button>
                                          <button onClick={() => handleDelete(r.ID)} className="text-xs font-medium bg-white border border-slate-200 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5"/> Hapus
                                          </button>
                                       </div>
                                    )}
                                </div>
                                <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 justify-start">
                                    <button 
                                      onClick={() => {
                                        if(r.FILE_FOTO && r.FILE_FOTO.length > 0) {
                                          setMediaToView({ type: 'foto', urls: r.FILE_FOTO });
                                        }
                                      }}
                                      className="w-full h-32 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center transition-colors cursor-pointer group shadow-sm overflow-hidden relative"
                                    >
                                      {r.FILE_FOTO && r.FILE_FOTO.length > 0 ? (
                                        <div className="relative w-full h-full">
                                          <img src={getMediaUrl(r.FILE_FOTO[0])} className="w-full h-full object-cover" alt="Foto" 
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg .../>'; }}
                                          />
                                          {r.FILE_FOTO.length > 1 && <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">+{r.FILE_FOTO.length - 1}</div>}
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-500">
                                            <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                                            <span className="text-[10px] font-bold tracking-wider">NO FOTO</span>
                                        </div>
                                      )}
                                    </button>
                                    {r.FILE_DOCUMENT && (
                                      <button onClick={() => setMediaToView({ type: 'document', urls: [r.FILE_DOCUMENT] })} className="w-full text-xs font-bold text-center py-2.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors">
                                        <FileText className="w-4 h-4" /> Lihat Dokumen
                                      </button>
                                    )}
                                </div>
                            </div>
                          );
                        })
                      )}
                      {mode === "edit" && (
                        <div className="pt-4 border-t border-slate-100">
                          <button 
                            onClick={() => handleOpenForm("add", d.DETAIL_ID)}
                            className="w-full py-3 bg-white hover:bg-slate-50 text-emerald-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-emerald-200 text-sm shadow-sm hover:border-emerald-300"
                          >
                            <Plus className="w-5 h-5" /> TAMBAH REALISASI
                          </button>
                        </div>
                      )}
                   </div>
                 )}
               </div>
             );
           })}
        </div>
      </div>

      {mode === "detail" && (
          <div className="flex justify-end pt-4">
             <button 
                onClick={() => navigate(`/dashboard/transaksi-realisasi-kegiatan/edit/${id}`)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4"/> Beralih ke Mode Edit 
              </button>
          </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {formMode === "add" ? (
                    <><div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Plus className="w-5 h-5"/></div> Tambah Realisasi Baru</>
                ) : (
                    <><div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Edit className="w-5 h-5"/></div> Edit Realisasi</>
                )}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto">
                <form onSubmit={handleSubmit} id="realisasi-form" className="p-6 space-y-5">
                   <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Waktu Realisasi</label>
                      <div className="flex gap-3">
                        <input type="date" required value={formData.TANGGAL_KEGIATAN} onChange={e => setFormData({...formData, TANGGAL_KEGIATAN: e.target.value})} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-sm appearance-none"/>
                        <input type="time" value={formData.WAKTU_KEGIATAN} onChange={e => setFormData({...formData, WAKTU_KEGIATAN: e.target.value})} className="w-32 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-sm appearance-none"/>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Keterangan Aktivitas</label>
                      <textarea rows={4} placeholder="Tuliskan detail mengenai kegiatan yang telah direalisasikan..." value={formData.KETERANGAN} onChange={e => setFormData({...formData, KETERANGAN: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-sm text-slate-900 shadow-sm resize-none"/>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-5 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group flex flex-col items-center justify-center">
                         <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                            <ImageIcon className="w-5 h-5 text-emerald-600" />
                         </div>
                         <div className="text-sm font-bold text-slate-700 mb-1">Pilih Foto</div>
                         <p className="text-[10px] font-medium text-slate-500">Mendukung banyak format .jpg/.png</p>
                         <input type="file" ref={fileFotoRef} multiple accept="image/*" onChange={e => setFileFoto(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
                         {fileFoto && fileFoto.length > 0 && <div className="absolute top-3 right-3 bg-emerald-500 border-2 border-white text-white text-[10px] rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-sm">{fileFoto.length}</div>}
                      </div>
                      <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-5 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group flex flex-col items-center justify-center">
                         <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                         </div>
                         <div className="text-sm font-bold text-slate-700 mb-1">Pilih Dokumen</div>
                         <p className="text-[10px] font-medium text-slate-500">Hanya .pdf atau .docx</p>
                         <input type="file" ref={fileDocumentRef} accept=".pdf,.doc,.docx" onChange={e => setFileDocument(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                         {fileDocument && <div className="absolute top-3 right-3 text-emerald-500 bg-white rounded-full"><CheckCircle2 className="w-6 h-6"/></div>}
                      </div>
                   </div>
                </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
               <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">Batal</button>
               <button type="submit" form="realisasi-form" disabled={isSubmitting} className="min-w-[140px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors justify-center flex items-center gap-2">
                 {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent flex items-center rounded-full animate-spin"></div> Menyimpan...</> : "Simpan Data"}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {mediaToView && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
           <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center z-10 bg-white">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {mediaToView.type === 'foto' ? <><ImageIcon className="w-5 h-5 text-blue-500"/> Foto Realisasi</> : <><FileText className="w-5 h-5 text-emerald-500"/> Dokumen Pendukung</>} 
                </h3>
                <div className="flex items-center gap-2">
                  <a href={getMediaUrl(mediaToView.urls[0])} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 border border-slate-200 shadow-sm"><Download className="w-4 h-4"/></a>
                  <button onClick={() => setMediaToView(null)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-100 shadow-sm"><X className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-slate-50 relative min-h-[50vh]">
                 {mediaToView.type === 'foto' ? (
                   <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
                     {mediaToView.urls.map((u, i) => (
                       <img key={i} src={getMediaUrl(u)} className="max-w-full max-h-[70vh] rounded-2xl shadow-md border-4 border-white object-contain" alt="Foto" />
                     ))}
                   </div>
                 ) : (
                   mediaToView.urls[0].toLowerCase().endsWith('.pdf') ? (
                     <iframe src={getMediaUrl(mediaToView.urls[0])} className="w-full h-full min-h-[60vh] rounded-xl border-0 shadow-inner bg-white" />
                   ) : (
                     <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
                       <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                       <div className="font-bold text-slate-800 text-lg mb-2">Preview Tidak Tersedia</div>
                       <p className="text-sm text-slate-500 mb-6">Format dokumen ini tidak dapat langsung ditampilkan di layar.</p>
                       <a href={getMediaUrl(mediaToView.urls[0])} target="_blank" rel="noopener noreferrer" className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors">
                         Unduh Dokumen <Download className="w-4 h-4"/>
                       </a>
                     </div>
                   )
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
}
