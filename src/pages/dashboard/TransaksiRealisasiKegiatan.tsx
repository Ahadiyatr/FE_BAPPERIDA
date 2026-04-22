import React, { useState, useEffect } from "react";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination";

export default function RealisasiKegiatan() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [filterBidang, setFilterBidang] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filterIndikatorUtama, setFilterIndikatorUtama] = useState("");
  const [filterSubIndikator, setFilterSubIndikator] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/realisasi-kegiatan");
      const aggregated = res.data.data || [];
      setData(aggregated);
      setFilteredData(aggregated);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = data;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(item => 
        (item.NAMA_BIDANG?.toLowerCase().includes(s)) ||
        (item.NAMA_PROGRAM?.toLowerCase().includes(s)) ||
        (item.NAMA_INDIKATOR_UTAMA?.toLowerCase().includes(s)) ||
        (item.NAMA_INDIKATOR?.toLowerCase().includes(s))
      );
    }
    if (filterBidang) filtered = filtered.filter(item => item.NAMA_BIDANG === filterBidang);
    if (filterProgram) filtered = filtered.filter(item => item.NAMA_PROGRAM === filterProgram);
    if (filterIndikatorUtama) filtered = filtered.filter(item => item.NAMA_INDIKATOR_UTAMA === filterIndikatorUtama);
    if (filterSubIndikator) filtered = filtered.filter(item => item.NAMA_INDIKATOR === filterSubIndikator);

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [search, filterBidang, filterProgram, filterIndikatorUtama, filterSubIndikator, data]);

  const uniqueBidang = Array.from(new Set(data.map(d => d.NAMA_BIDANG).filter(Boolean)));
  const uniqueProgram = Array.from(new Set(data.map(d => d.NAMA_PROGRAM).filter(Boolean)));
  const uniqueIndikatorUtama = Array.from(new Set(data.map(d => d.NAMA_INDIKATOR_UTAMA).filter(Boolean)));
  const uniqueSubIndikator = Array.from(new Set(data.map(d => d.NAMA_INDIKATOR).filter(Boolean)));

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Realisasi Kegiatan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data realisasi kegiatan di Bapperrida</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
             <div className="relative flex-1 min-w-[200px] max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
             </div>
             <select value={filterBidang} onChange={(e) => setFilterBidang(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg min-w-[150px] appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                <option value="">Filter : Bidang</option>
                {uniqueBidang.map((u, i) => <option key={i} value={u as string}>{u as string}</option>)}
             </select>
             <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg min-w-[150px] appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                <option value="">Filter : Program</option>
                {uniqueProgram.map((u, i) => <option key={i} value={u as string}>{u as string}</option>)}
             </select>
             <select value={filterIndikatorUtama} onChange={(e) => setFilterIndikatorUtama(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg min-w-[150px] appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                <option value="">Filter : Indikator Utama</option>
                {uniqueIndikatorUtama.map((u, i) => <option key={i} value={u as string}>{u as string}</option>)}
             </select>
             <select value={filterSubIndikator} onChange={(e) => setFilterSubIndikator(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg min-w-[150px] appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                <option value="">Filter : Sub Indikator</option>
                {uniqueSubIndikator.map((u, i) => <option key={i} value={u as string}>{u as string}</option>)}
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
             <thead className="bg-slate-50">
                <tr>
                   <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">No.</th>
                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Periode</th>
                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bidang & Program</th>
                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Indikator</th>
                   <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                   <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Realisasi</th>
                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Capaian</th>
                   <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
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
               ) : paginatedData.length === 0 ? (
                 <tr>
                   <td colSpan={8} className="px-6 py-8 text-center text-slate-500">Tidak ada data ditemukan.</td>
                 </tr>
               ) : (
                 paginatedData.map((item, index) => (
                    <tr key={item.CAPAIAN_ID} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4 text-center text-sm font-medium text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                       <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.NAMA_PERIODE || "2026"}</td>
                       <td className="px-6 py-4">
                         <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-0.5">{item.NAMA_BIDANG}</div>
                         <div className="text-sm font-medium text-slate-900">{item.NAMA_PROGRAM}</div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-0.5">{item.NAMA_INDIKATOR_UTAMA}</div>
                         <div className="text-sm font-medium text-slate-900">{item.NAMA_INDIKATOR}</div>
                       </td>
                       <td className="px-6 py-4 text-center text-base font-bold text-slate-800">{Number(item.TARGET) || 0}</td>
                       <td className="px-6 py-4 text-center text-base font-bold text-emerald-600">{Number(item.TOTAL_KEGIATAN) || Number(item.REALISASI) || 0}</td>
                       <td className="px-6 py-4 w-48">
                         <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600">
                           <span>CAPAIAN</span>
                           <span>{item.PERSENTASE || 0}%</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                           <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(Number(item.PERSENTASE || 0), 100)}%` }}></div>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2 text-sm font-medium">
                           <button onClick={() => navigate(`/dashboard/transaksi-realisasi-kegiatan/detail/${item.CAPAIAN_ID}`)} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors border border-emerald-200 flex items-center gap-1 px-3">
                             <Eye className="w-4 h-4"/> Detail
                           </button>
                           <button onClick={() => navigate(`/dashboard/transaksi-realisasi-kegiatan/edit/${item.CAPAIAN_ID}`)} className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors border border-blue-200 flex items-center gap-1 px-3">
                             <Edit className="w-4 h-4"/> Edit
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
    </div>
  );
}
