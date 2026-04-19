import { useNavigate } from "react-router-dom";
import { ArrowRight, Activity, LogIn } from "lucide-react";
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

// Modern Green to Yellow Palette
const data = [
  { name: "P2EPD", distribution: 21, achievement: 75, color: "#047857" }, // Emerald 700
  { name: "PPM", distribution: 11, achievement: 81, color: "#10B981" }, // Emerald 500
  { name: "PIK", distribution: 7, achievement: 91, color: "#34D399" }, // Emerald 400
  { name: "Perencanaan", distribution: 13, achievement: 76, color: "#84CC16" }, // Lime 500
  { name: "Keuangan", distribution: 6, achievement: 71, color: "#EAB308" }, // Yellow 500
  { name: "Umum & Kepeg.", distribution: 27, achievement: 78, color: "#F59E0B" }, // Amber 500
  { name: "Litbang", distribution: 15, achievement: 78, color: "#D97706" }, // Amber 600
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
  distribution,
}: any) => {
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={data[index].color}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
      className="drop-shadow-sm"
    >
      {`${name} ${distribution}%`}
    </text>
  );
};

export default function Landing() {
  const navigate = useNavigate();

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
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full font-semibold transition-colors shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Login</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 -z-10"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 -z-10"></div>

        {/* Top Section */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-emerald-900/5 rounded-[2rem] flex flex-col md:flex-row items-center justify-center py-12 px-8 gap-12 relative overflow-hidden">
          <div className="text-center md:text-left flex flex-col items-center md:items-start relative z-10">
            <div className="text-8xl font-black tracking-tighter bg-gradient-to-br from-emerald-600 to-yellow-500 bg-clip-text text-transparent leading-none mb-4 drop-shadow-sm">
              78%
            </div>
            <div className="text-xl text-slate-800 font-bold tracking-wide">
              Capaian Keseluruhan
            </div>
            <div className="text-sm text-emerald-700 font-semibold bg-emerald-100/80 px-4 py-1.5 rounded-full mt-3 border border-emerald-200/50 shadow-sm">
              71 program · 7 bidang
            </div>
          </div>

          <div className="h-[320px] w-full max-w-[500px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  label={renderCustomizedLabel}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="distribution"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity duration-300 cursor-pointer" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center decorative circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full shadow-inner flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-50 to-yellow-50 border border-emerald-100/50"></div>
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
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                      interval={0}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      dx={-10}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "#f8fafc", opacity: 0.6 }}
                      contentStyle={{ 
                        borderRadius: "12px", 
                        border: "1px solid rgba(255,255,255,0.8)", 
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(8px)",
                        fontWeight: 600
                      }}
                    />
                    <Bar dataKey="achievement" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {data.map((entry, index) => (
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
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
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
                      stroke="#10B981"
                      strokeWidth={3}
                      fill="url(#colorUv)"
                      fillOpacity={0.6}
                    />
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#EAB308" stopOpacity={0.2}/>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-5">
          {data.map((item) => (
            <Card key={item.name} className="bg-white/80 backdrop-blur-md border-white/60 shadow-lg shadow-emerald-900/5 hover:shadow-xl hover:shadow-emerald-900/10 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group">
              <div className="h-1.5 w-full transition-all duration-300 group-hover:h-2" style={{ backgroundColor: item.color }}></div>
              <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest h-8 flex items-center justify-center">
                  {item.name}
                </div>
                <div
                  className="text-4xl font-black tracking-tighter drop-shadow-sm"
                  style={{ color: item.color }}
                >
                  {item.achievement}%
                </div>
                <button 
                  disabled
                  className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mt-2 transition-colors cursor-not-allowed opacity-60"
                  title="Fitur belum tersedia"
                >
                  Lihat Detail <ArrowRight className="w-3 h-3" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm font-medium text-slate-500 bg-white/50 border-t border-emerald-100/50 mt-12">
        <p>© 2026 Bapperrida — Dashboard Kinerja</p>
      </footer>
    </div>
  );
}
