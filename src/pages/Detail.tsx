import React, { useState } from "react";
import { ArrowLeft, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Data dummy berdasarkan gambar yang diberikan
const detailData = [
  {
    INDIKATOR_BIDANG_ID: 1,
    NAMA_BIDANG: "P2EPD",
    NAMA_INDIKATOR_UTAMA: "Perencanaan",
    NAMA_INDIKATOR: "Penyusunan Perencanaan dan Pendanaan",
    DETAIL_ID: 1,
    JENIS_KEGIATAN: "Rapat Koordinasi",
    TARGET: 10,
    REALISASI: 10,
    BOBOT: 0.526316,
    PERSENTASE: 100,
  },
  {
    INDIKATOR_BIDANG_ID: 1,
    NAMA_BIDANG: "P2EPD",
    NAMA_INDIKATOR_UTAMA: "Perencanaan",
    NAMA_INDIKATOR: "Penyusunan Perencanaan dan Pendanaan",
    DETAIL_ID: 2,
    JENIS_KEGIATAN: "Pembuatan SK Tim",
    TARGET: 1,
    REALISASI: 1,
    BOBOT: 0.052632,
    PERSENTASE: 100,
  },
  {
    INDIKATOR_BIDANG_ID: 1,
    NAMA_BIDANG: "P2EPD",
    NAMA_INDIKATOR_UTAMA: "Perencanaan",
    NAMA_INDIKATOR: "Penyusunan Perencanaan dan Pendanaan",
    DETAIL_ID: 3,
    JENIS_KEGIATAN: "Sosialisasi",
    TARGET: 5,
    REALISASI: 5,
    BOBOT: 0.263158,
    PERSENTASE: 100,
  },
  {
    INDIKATOR_BIDANG_ID: 1,
    NAMA_BIDANG: "P2EPD",
    NAMA_INDIKATOR_UTAMA: "Perencanaan",
    NAMA_INDIKATOR: "Penyusunan Perencanaan dan Pendanaan",
    DETAIL_ID: 4,
    JENIS_KEGIATAN: "Penyelarasan dengan Provinsi",
    TARGET: 3,
    REALISASI: 3,
    BOBOT: 0.157895,
    PERSENTASE: 100,
  },
];

// Data dummy untuk detail realisasi
const realisasiDetails: Record<number, any[]> = {
  1: [
    { id: "0.1", tanggal: "dd/mm/yy", waktu: "HH:MM", keterangan: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", realisasi: 1 },
    { id: "0.2", tanggal: "dd/mm/yy", waktu: "HH:MM", keterangan: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", realisasi: 2 },
    { id: "0.3", tanggal: "dd/mm/yy", waktu: "HH:MM", keterangan: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", realisasi: 2 },
  ],
  2: [],
  3: [],
  4: [],
};

interface DetailProps {
  onBack?: () => void;
}

export default function Detail() {
  const navigate = useNavigate();
  // Mengambil info header dari data pertama
  const headerInfo = detailData[0];
  const [expandedId, setExpandedId] = useState<number | null>(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-yellow-50 font-sans text-slate-900 selection:bg-emerald-200 flex flex-col">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-20 border-b border-emerald-100/50 py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors bg-white/50 px-4 py-2 rounded-full border border-slate-200 hover:border-emerald-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-yellow-400 p-2 rounded-xl shadow-sm hidden sm:block">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-800 via-emerald-600 to-yellow-600 bg-clip-text text-transparent">
              Detail Indikator
            </h1>
          </div>
          
          <div className="w-[100px] hidden sm:block"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative flex-grow w-full">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 -z-10"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 -z-10"></div>

        {/* Card Detail dengan Glassmorphism */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-emerald-900/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-yellow-400"></div>
                <h2 className="text-sm md:text-base font-bold text-emerald-700 uppercase tracking-widest">
                  {headerInfo.NAMA_INDIKATOR_UTAMA}
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                  {headerInfo.NAMA_INDIKATOR}
                </h3>
                <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-700 font-black text-xl md:text-2xl px-4 py-1 rounded-xl">
                  100%
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-yellow-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md shadow-emerald-500/20 whitespace-nowrap">
              BIDANG {headerInfo.NAMA_BIDANG}
            </div>
          </div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left pb-4 w-[45%] font-bold text-slate-500 uppercase tracking-wider text-sm border-b border-slate-200/60">Jenis Kegiatan</th>
                  <th className="text-center pb-4 font-bold text-slate-500 uppercase tracking-wider text-sm border-b border-slate-200/60">Target</th>
                  <th className="text-center pb-4 font-bold text-slate-500 uppercase tracking-wider text-sm border-b border-slate-200/60">Realisasi</th>
                  <th className="text-center pb-4 font-bold text-slate-500 uppercase tracking-wider text-sm border-b border-slate-200/60">Bobot</th>
                  <th className="text-center pb-4 font-bold text-slate-500 uppercase tracking-wider text-sm border-b border-slate-200/60">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {detailData.map((row, index) => (
                  <tr key={index} className="hover:bg-white/50 transition-colors border-b border-slate-100/50 last:border-0 group">
                    <td className="py-4 text-left font-semibold text-slate-700 text-base group-hover:text-emerald-700 transition-colors">
                      {row.JENIS_KEGIATAN}
                    </td>
                    <td className="py-4 text-center font-bold text-slate-700 text-base">
                      {row.TARGET}
                    </td>
                    <td className="py-4 text-center font-bold text-emerald-600 text-base">
                      {row.REALISASI}
                    </td>
                    <td className="py-4 text-center font-medium text-slate-600 text-base">
                      {row.BOBOT.toFixed(2)}
                    </td>
                    <td className="py-4 text-center font-black text-emerald-600 text-base">
                      {row.PERSENTASE}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Realisasi Section */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-emerald-900/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden mt-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6">Realisasi</h3>

          <div className="space-y-3">
            {detailData.map((item) => {
              const isExpanded = expandedId === item.DETAIL_ID;
              const details = realisasiDetails[item.DETAIL_ID] || [];

              return (
                <div key={item.DETAIL_ID} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-white/50 border-white/60 shadow-sm' : 'bg-white/30 border-transparent hover:bg-white/40'}`}>
                  {/* Accordion Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.DETAIL_ID)}
                    className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
                    <span className="font-bold text-slate-800">{item.JENIS_KEGIATAN}</span>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="p-4 pt-0 pl-4 md:pl-12 space-y-4">
                      {details.length > 0 ? details.map((detail) => (
                        <div key={detail.id} className="bg-white/80 rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-start">
                          <div className="flex gap-4">
                            <span className="font-bold text-slate-800 text-lg">{detail.id}</span>
                            <div className="space-y-1 text-sm">
                              <div className="font-bold text-slate-800">Tanggal Realisasi : {detail.tanggal}</div>
                              <div className="font-bold text-slate-800">Waktu Realisasi : {detail.waktu}</div>
                              <div className="text-slate-700 mt-2 leading-relaxed max-w-xl"><span className="font-bold text-slate-800">Keterangan :</span> {detail.keterangan}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-4 shrink-0 mt-4 md:mt-0">
                            <div className="bg-emerald-400 text-slate-900 font-bold px-4 py-1.5 rounded-full text-xs shadow-sm">
                              Realisasi : {detail.realisasi}
                            </div>
                            <div className="w-36 h-20 border-2 border-slate-800 rounded-xl flex items-center justify-center bg-slate-50/50 overflow-hidden shadow-sm">
                              <span className="-rotate-12 font-bold text-slate-800 text-sm tracking-wide">Foto Kegiatan</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-slate-500 text-sm italic py-4 px-8">Belum ada data realisasi untuk kegiatan ini.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm font-medium text-slate-500 bg-white/50 border-t border-emerald-100/50 mt-auto">
        <p>© 2026 Bapperrida — Dashboard Kinerja</p>
      </footer>
    </div>
  );
}
