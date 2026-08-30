import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiMessage } from "../services/api";
import { getDetailBidangPublik, type DetailBidangPublik } from "../services/public-dashboard.service";
import { DESIGN_COLOR } from "../lib/design-tokens";

export default function Detail() {
  const navigate = useNavigate();
  const bidangId = new URLSearchParams(useLocation().search).get("bidang");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DetailBidangPublik | null>(null);

  useEffect(() => {
    if (!bidangId) {
      setError("Bidang tidak ditentukan.");
      setLoading(false);
      return;
    }

    getDetailBidangPublik(bidangId)
      .then(setData)
      .catch((err) => setError(apiMessage(err, "Gagal memuat data bidang.")))
      .finally(() => setLoading(false));
  }, [bidangId]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-6 py-4 md:px-12">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
      ) : error || !data ? (
        <main className="mx-auto max-w-7xl px-6 py-10 md:px-12"><div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">{error ?? "Data tidak ditemukan."}</div></main>
      ) : (
        <main className="mx-auto max-w-7xl px-6 py-10 md:px-12">
          <div className="mb-12 flex flex-col items-center gap-8 md:flex-row">
            <div className="relative h-40 w-40 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke={DESIGN_COLOR.border} strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke={DESIGN_COLOR.brand} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(Math.min(100, Math.max(0, data.header.capaian_bidang)) / 100) * (2 * Math.PI * 40)} ${2 * Math.PI * 40}`} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold tracking-tight text-slate-800">{data.header.capaian_bidang.toFixed(1)}%</span></div>
            </div>
            <div className="flex flex-col text-center md:text-left">
              <div className="mb-2 flex items-center justify-center gap-3 md:justify-start"><div className="h-3 w-3 rounded-full bg-blue-500" /><h1 className="text-3xl font-bold text-slate-800">{data.header.nama_bidang}</h1></div>
              <p className="font-medium text-slate-500">{data.header.jumlah_subkegiatan} subkegiatan · Rata-rata capaian {data.header.capaian_bidang.toFixed(1)}%</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-100 bg-white"><div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm"><thead className="border-b border-slate-100 bg-white text-xs text-slate-400"><tr><th className="w-16 px-6 py-4 text-center font-semibold">No</th><th className="px-6 py-4 font-semibold">Subkegiatan</th><th className="w-64 px-6 py-4 font-semibold">Progress</th><th className="w-20 px-6 py-4 text-right font-semibold">%</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{data.rincian.map((subkegiatan, index) => <tr key={subkegiatan.id} className="transition-colors hover:bg-slate-50"><td className="px-6 py-4 text-center font-medium text-slate-400">{index + 1}</td><td className="px-6 py-4 font-medium text-slate-700"><div>{subkegiatan.nama_subkegiatan}</div><div className="mt-1 text-xs font-normal text-slate-400">{subkegiatan.kode_subkegiatan}</div></td><td className="px-6 py-4"><div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(0, subkegiatan.capaian))}%` }} /></div></td><td className="px-6 py-4 text-right font-semibold text-blue-600">{subkegiatan.capaian.toFixed(1)}%</td></tr>)}</tbody>
            </table>
          </div></div>
        </main>
      )}
    </div>
  );
}
