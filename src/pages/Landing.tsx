import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Activity } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiMessage } from "../services/api";
import { getLandingPublik } from "../services/public-dashboard.service";
import { CHART_PALETTE, DESIGN_COLOR } from "../lib/design-tokens";

// Modern Green to Yellow Palette
const COLORS = [...CHART_PALETTE, ...CHART_PALETTE];

const ringkasNamaBidang = (nama: string) => {
  const label: Record<string, string> = {
    "Pemerintahan dan Pembangunan Manusia": "Pemerintahan & SDM",
    "Perekonomian, Infrastruktur dan Kewilayahan": "Ekonomi & Infrastruktur",
    "Perencanaan, Pengendalian dan Evaluasi Pembangunan Daerah": "Perencanaan & Evaluasi",
    "Riset dan Inovasi Daerah": "Riset & Inovasi",
  };

  return label[nama] ?? nama;
};

const DonutTooltip = ({ active, payload }: any) => {
  const bidang = payload?.[0]?.payload;

  if (!active || !bidang) return null;

  return (
    <div className="max-w-64 rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/10">
      <p className="text-sm font-bold leading-snug text-slate-800">{bidang.name}</p>
      <p className="mt-1 text-xs font-semibold text-emerald-700">
        Proporsi subkegiatan: {Number(bidang.distribution).toFixed(2)}%
      </p>
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [bidang, setBidang] = useState<any[]>([]);
  const [distribusi, setDistribusi] = useState<any[]>([]);
  const [radar, setRadar] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getLandingPublik();
        setSummary(data.summary);
        setBidang(data.bidang.map((b, i) => ({ ...b, name: b.nama_bidang, label: ringkasNamaBidang(b.nama_bidang), achievement: b.capaian_bidang, color: COLORS[i % COLORS.length] })));
        setDistribusi(data.distribusi.map((d, i) => ({ ...d, name: d.nama_bidang, distribution: d.persentase, color: COLORS[i % COLORS.length] })));
        setRadar(data.radar.map((r) => ({ name: ringkasNamaBidang(r.label), achievement: r.value })));
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError(apiMessage(err, "Gagal memuat dashboard publik."));
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-yellow-50 font-sans text-slate-900 selection:bg-emerald-200">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-20 border-b border-emerald-100/50 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-yellow-400 p-2 rounded-xl shadow-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-800 via-emerald-600 to-yellow-600 bg-clip-text text-transparent">
              OPERA-INK BAPPERRIDA
            </h1>
          </div>
          {/* <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full font-semibold transition-colors shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Login</span>
          </button> */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 -z-10"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 -z-10"></div>

        {loading ? (
           <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        ) : (
          <>
            {/* Top Section */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-emerald-900/5 rounded-[2rem] flex flex-col md:flex-row items-center justify-center py-12 px-8 gap-12 relative overflow-hidden">
              <div className="text-center md:text-left flex flex-col items-center md:items-start relative z-10">
                <div className="text-8xl font-black tracking-tighter bg-gradient-to-br from-emerald-600 to-yellow-500 bg-clip-text text-transparent leading-none mb-4 drop-shadow-sm">
                  {Number(summary?.capaian_pd ?? 0).toFixed(2)}%
                </div>
                <div className="text-xl text-slate-800 font-bold tracking-wide">
                  Capaian Keseluruhan
                </div>
                <div className="text-sm text-emerald-700 font-semibold bg-emerald-100/80 px-4 py-1.5 rounded-full mt-3 border border-emerald-200/50 shadow-sm">
                  {summary?.jumlah_program ?? 0} program · {summary?.jumlah_bidang ?? 0} bidang
                </div>
              </div>

              <div className="relative z-10 h-[380px] w-full max-w-[500px]">
                <ResponsiveContainer className="relative z-10" width="100%" height="100%" initialDimension={{ width: 500, height: 320 }}>
                  <PieChart>
                    <Pie
                      data={distribusi}
                      cx="50%"
                      cy="38%"
                      labelLine={false}
                      label={false}
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={2}
                      dataKey="distribution"
                      nameKey="name"
                      stroke="none"
                    >
                      {distribusi.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity duration-300 cursor-pointer" />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      cursor={false}
                      content={<DonutTooltip />}
                      wrapperStyle={{ zIndex: 30, pointerEvents: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center decorative circle */}
                <div className="pointer-events-none absolute z-0 left-1/2 top-[38%] flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-inner">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-50 to-yellow-50 border border-emerald-100/50"></div>
                </div>
                <div className="absolute inset-x-4 bottom-1 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-slate-600">
                  {distribusi.map((item) => (
                    <div key={item.bidang_id} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{ringkasNamaBidang(item.name)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar Chart */}
              <Card className="bg-white/80 backdrop-blur-md border-white/60 shadow-lg shadow-emerald-900/5 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-100/50 bg-white/50 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-yellow-400"></div>
                    Capaian Per Bidang (%)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: 320 }}>
                      <BarChart
                        data={bidang}
                        layout="vertical"
                        margin={{ top: 8, right: 28, left: 16, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-surface-subtle)" />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: DESIGN_COLOR.textMuted, fontWeight: 500 }}
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={165}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: DESIGN_COLOR.textMuted, fontWeight: 600 }}
                        />
                        <RechartsTooltip
                          cursor={{ fill: DESIGN_COLOR.surface, opacity: 0.6 }}
                          contentStyle={{ 
                            borderRadius: "12px", 
                            border: "1px solid rgba(255,255,255,0.8)", 
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(8px)",
                            fontWeight: 600
                          }}
                        />
                        <Bar dataKey="achievement" radius={[0, 6, 6, 0]} maxBarSize={32} label={{ position: "right", fill: DESIGN_COLOR.textMuted, fontSize: 11, fontWeight: 700, formatter: (value) => `${Number(value).toFixed(1)}%` }}>
                          {bidang.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity duration-300 cursor-pointer" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="bg-white/80 backdrop-blur-md border-white/60 shadow-lg shadow-emerald-900/5 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-100/50 bg-white/50 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full bg-gradient-to-b from-yellow-400 to-emerald-400"></div>
                    Profil Kinerja
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: 320 }}>
                      <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radar}>
                        <PolarGrid stroke={DESIGN_COLOR.border} />
                        <PolarAngleAxis
                          dataKey="name"
                          tick={{ fill: DESIGN_COLOR.textMuted, fontSize: 10, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          name="Capaian"
                          dataKey="achievement"
                          stroke={DESIGN_COLOR.success}
                          strokeWidth={3}
                          fill="url(#colorUv)"
                          fillOpacity={0.6}
                        />
                        <defs>
                          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={DESIGN_COLOR.success} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={DESIGN_COLOR.warning} stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <RechartsTooltip 
                          contentStyle={{ 
                            borderRadius: "12px", 
                            border: "1px solid rgba(255,255,255,0.8)", 
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            fontWeight: 600
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cards Section */}
            <div className="grid grid-flow-col grid-rows-1 auto-cols-[minmax(9rem,1fr)] gap-5 overflow-x-auto pb-2">
              {bidang.map((item) => (
                <Card key={item.name} className="group min-h-56 overflow-hidden border-white/60 bg-white/80 shadow-lg shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-900/10 backdrop-blur-md">
                  <div className="h-1.5 w-full transition-all duration-300 group-hover:h-2" style={{ backgroundColor: item.color }}></div>
                  <CardContent className="flex h-full flex-col items-center space-y-3 p-5 text-center">
                    <div className="flex h-16 items-center justify-center text-[11px] font-bold uppercase leading-relaxed tracking-wider text-slate-500">
                      {item.name}
                    </div>
                    <div
                      className="text-4xl font-black tracking-tighter drop-shadow-sm"
                      style={{ color: item.color }}
                    >
                      {Number(item.achievement).toFixed(1)}%
                    </div>
                    {item.bidang_id && (
                      <button 
                        onClick={() => navigate(`/detail?bidang=${item.bidang_id}`)}
                        className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition-colors hover:text-emerald-600"
                      >
                        Lihat Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm font-medium text-slate-500 bg-white/50 border-t border-emerald-100/50 mt-12">
        <p>© 2026 Bapperrida — Dashboard Kinerja</p>
      </footer>
    </div>
  );
}
