import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

interface ProgramDetail {
  id: number;
  nama: string;
  persentase: number;
}

export default function Detail() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const bidangId = searchParams.get("bidang");
  const defaultNama = searchParams.get("nama") || "P2EPD";
  const defaultScore = parseInt(searchParams.get("score") || "0");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    nama: string;
    rata_rata: number;
    total_program: number;
    programs: ProgramDetail[];
  }>({
    nama: defaultNama,
    rata_rata: defaultScore,
    total_program: 0,
    programs: []
  });

  // Since we don't have a specific API for this yet, we'll use dummy data if the API fails,
  // but we try to fetch it just in case the backend already provides it.
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        // Attempt to hit an endpoint (the user might create this later)
        if (bidangId) {
           const response = await api.get(`/api/dashboard/bidang/${bidangId}`);
           if (response.data.success) {
             setData(response.data.data);
             return; // Stop here if API succeeds
           }
        }
      } catch (err) {
        console.warn("API hasn't been created yet. Using mock data.");
      } finally {
        // Mock data matching the screenshot
        setData(prev => ({
          ...prev,
          total_program: 12,
          rata_rata: prev.rata_rata || 75,
          nama: prev.nama || "Bidang P2EPD",
          programs: [
            { id: 1, nama: "Analisis Kondisi Daerah, Permasalahan, dan Isu Strategis Pembangunan Daerah", persentase: 91 },
            { id: 2, nama: "Koordinasi Penelaahan Dokumen Perencanaan Pembangunan Daerah dengan Dokumen Kebijakan Lainnya", persentase: 70 },
            { id: 3, nama: "Pelaksanaan Konsultasi Publik", persentase: 61 },
            { id: 4, nama: "Koordinasi Pelaksanaan Forum Perangkat Daerah/Lintas Perangkat Daerah", persentase: 61 },
            { id: 5, nama: "Pelaksanaan Musrenbang Kabupaten/Kota", persentase: 95 },
            { id: 6, nama: "Penyiapan Bahan Koordinasi Musrenbang Kecamatan", persentase: 89 },
            { id: 7, nama: "Koordinasi Penyusunan dan Penetapan Dokumen Perencanaan Pembangunan Daerah Kabupaten/Kota", persentase: 78 },
            { id: 8, nama: "Analisis Data dan Informasi Perencanaan Pembangunan Daerah", persentase: 79 },
            { id: 9, nama: "Pembinaan dan Pemanfaatan Data dan Informasi Perencanaan Pembangunan Perangkat Daerah", persentase: 70 },
            { id: 10, nama: "Penyusunan Profil Pembangunan Daerah Kabupaten/Kota", persentase: 72 },
            { id: 11, nama: "Koordinasi Pengendalian Perencanaan dan Pelaksanaan Pembangunan Daerah di Kabupaten/Kota", persentase: 71 },
            { id: 12, nama: "Monitoring, Evaluasi dan Penyusunan Laporan Berkala Pelaksanaan Pembangunan Daerah", persentase: 70 },
          ]
        }));
        setLoading(false);
      }
    };

    fetchDetail();
  }, [bidangId]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Header Back Button */}
      <header className="border-b border-slate-100 py-4 px-6 md:px-12 bg-white sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          
          {/* Top Section Layout */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            
            {/* Donut Chart */}
            <div className="relative w-40 h-40 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                {/* Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3b82f6" // blue-500
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(data.rata_rata / 100) * (2 * Math.PI * 40)} ${2 * Math.PI * 40}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Text Inside */}
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">{data.rata_rata}%</span>
              </div>
            </div>

            {/* Title Info */}
            <div className="flex flex-col text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h1 className="text-3xl font-bold text-slate-800">Bidang {data.nama}</h1>
              </div>
              <p className="text-slate-500 font-medium">
                {data.total_program} program · Rata-rata capaian {data.rata_rata}%
              </p>
            </div>
            
          </div>

          {/* Programs Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white mt-8">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm text-left">
                <thead className="text-xs text-slate-400 bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-16 text-center">No</th>
                    <th className="px-6 py-4 font-semibold">Program</th>
                    <th className="px-6 py-4 font-semibold w-64">Progress</th>
                    <th className="px-6 py-4 font-semibold w-20 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.programs.map((prog, idx) => (
                    <tr key={prog.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{prog.nama}</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${prog.persentase}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-blue-600 font-semibold">
                        {prog.persentase}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      )}
    </div>
  );
}
