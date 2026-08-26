import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

interface ProgramDetail {
  id: number;
  nama: string;
  target: number;
  realisasi: number;
  persentase: number;
}

export default function Detail() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const bidangId = searchParams.get("bidang");
  const defaultNama = searchParams.get("nama") || "";
  const defaultScore = Number(searchParams.get("score") || 0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchDetail = async () => {
      if (!bidangId) {
        setError("Bidang tidak ditentukan");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/api/dashboard/bidang/${bidangId}`);
        if (response.data.success) {
          const { header, detail } = response.data.data;
          setData({
            nama: header?.NAMA_BIDANG ?? defaultNama,
            rata_rata: Number(header?.RATA_RATA_CAPAIAN ?? 0),
            total_program: Number(header?.TOTAL_INDIKATOR ?? detail?.length ?? 0),
            programs: (detail ?? []).map((d: any) => ({
              id: d.INDIKATOR_ID,
              nama: d.NAMA_INDIKATOR,
              target: Number(d.TARGET ?? 0),
              realisasi: Number(d.REALISASI ?? 0),
              persentase: Number(d.PERSENTASE ?? 0),
            })),
          });
        } else {
          setError(response.data.message || "Gagal memuat data bidang");
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat data bidang");
      } finally {
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
      ) : error ? (
        <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <div className="p-4 text-red-600 border border-red-100 bg-red-50 rounded-xl">{error}</div>
        </main>
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
                  strokeDasharray={`${(Math.min(100, Math.max(0, data.rata_rata)) / 100) * (2 * Math.PI * 40)} ${2 * Math.PI * 40}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Text Inside */}
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">{data.rata_rata.toFixed(1)}%</span>
              </div>
            </div>

            {/* Title Info */}
            <div className="flex flex-col text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h1 className="text-3xl font-bold text-slate-800">{data.nama}</h1>
              </div>
              <p className="text-slate-500 font-medium">
                {data.total_program} program · Rata-rata capaian {data.rata_rata.toFixed(1)}%
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
                  {data.programs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                        Belum ada data indikator untuk bidang ini.
                      </td>
                    </tr>
                  ) : (
                    data.programs.map((prog, idx) => (
                      <tr key={prog.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{prog.nama}</td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${Math.min(100, Math.max(0, prog.persentase))}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-blue-600 font-semibold">
                          {prog.persentase.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      )}
    </div>
  );
}
