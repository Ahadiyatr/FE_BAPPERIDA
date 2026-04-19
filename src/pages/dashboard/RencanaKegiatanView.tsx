import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Image as ImageIcon, FileText, ChevronRight, Download, X } from "lucide-react";
import api from "../../services/api";

export default function RencanaKegiatanView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [header, setHeader] = useState<any>(null);
  const [rekap, setRekap] = useState<any[]>([]);
  const [realisasi, setRealisasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedDetail, setExpandedDetail] = useState<number | null>(null);

  // Media Modal
  const [mediaToView, setMediaToView] = useState<{ type: 'foto' | 'document', urls: string[] } | null>(null);

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

  const getMediaUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    return `${baseUrl}/storage${path.startsWith('/') ? path : `/${path}`}`.replace('/storage/storage', '/storage');
  };

  if (loading) return <div className="p-8 text-center text-emerald-600 font-medium">Memuat data...</div>;
  if (!header) return <div className="p-8 text-center text-red-500">Data tidak ditemukan.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard/rencana-kegiatan')}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
               Detail Rencana & Capaian Kegiatan
            </h1>
            <p className="text-sm text-slate-500 mt-1">Rincian rencana dan capaian realisasi berdasarkan indikator</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">{header.NAMA_INDIKATOR_UTAMA}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">{header.NAMA_BIDANG}</span>
                <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider bg-blue-100 border border-blue-200 px-3 py-1 rounded-full">{header.NAMA_PERIODE}</span>
             </div>
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 flex-wrap">
                {header.NAMA_INDIKATOR}
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-200 shadow-sm">
                  {header.PERSENTASE}% TERCAPAI
                </span>
             </h2>
             <div className="text-sm font-medium text-slate-600 mt-1">
               <span className="font-bold text-slate-800">Program:</span> {header.NAMA_PROGRAM}
             </div>
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
               {rekap.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">Belum ada rincian rekap data</td>
                 </tr>
               ) : rekap.map((d) => {
                 const target = parseFloat(d.TARGET) || 0;
                 const realCount = parseFloat(d.REALISASI) || 0;
                 const persentase = parseFloat(d.PERSENTASE) || 0;
                 const bobot = parseFloat(d.BOBOT) || 0;
                 const isComplete = persentase >= 100;
                 return (
                   <tr key={d.DETAIL_ID} className="hover:bg-slate-50/50 transition-colors">
                     <td className="py-4 pr-4 text-sm font-medium text-slate-800">{d.JENIS_KEGIATAN}</td>
                     <td className="py-4 text-sm text-center font-bold text-slate-700">{target}</td>
                     <td className="py-4 text-sm text-center font-bold text-emerald-600">{realCount}</td>
                     <td className="py-4 text-sm text-center text-slate-500">{bobot.toFixed(2)}</td>
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
           {rekap.map((d) => {
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
                        <div className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">Belum ada bukti realisasi.</div>
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
                   </div>
                 )}
               </div>
             );
           })}
        </div>
      </div>

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
