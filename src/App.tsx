import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import DashboardLayout from "./layouts/DashboardLayout"
import { PenyediaPeran } from "./lib/peran"
import { PenjagaPeran } from "./pages/opera/bagian/PenjagaPeran"

// Setiap halaman dimuat terpisah supaya pengunjung halaman publik tidak ikut
// mengunduh semua layar admin. Kerangka (layout, penjaga peran) tetap di bundel utama.
const Detail = lazy(() => import("./pages/Detail"))
const Landing = lazy(() => import("./pages/Landing"))
const Login = lazy(() => import("./pages/Login"))
const BuktiKegiatan = lazy(() => import("./pages/opera/BuktiKegiatan"))
const CapaianProgram = lazy(() => import("./pages/opera/CapaianProgram"))
const CatatRealisasi = lazy(() => import("./pages/opera/CatatRealisasi"))
const KalenderRencana = lazy(() => import("./pages/opera/KalenderRencana"))
const DashboardUmum = lazy(() => import("./pages/opera/DashboardUmum"))
const DataMaster = lazy(() => import("./pages/opera/DataMaster"))
const DetailSubkegiatan = lazy(() => import("./pages/opera/DetailSubkegiatan"))
const KinerjaBidang = lazy(() => import("./pages/opera/KinerjaBidang"))
const LogAktivitas = lazy(() => import("./pages/opera/LogAktivitas"))
const ManajemenPengguna = lazy(() => import("./pages/opera/ManajemenPengguna"))
const MasterBidang = lazy(() => import("./pages/opera/MasterBidang"))
const MasterDokumen = lazy(() => import("./pages/opera/MasterDokumen"))
const MonitoringKinerja = lazy(() => import("./pages/opera/MonitoringKinerja"))
const PenyusunanRencana = lazy(() => import("./pages/opera/PenyusunanRencana"))
const PeriodeLayar = lazy(() => import("./pages/opera/PeriodeLayar"))
const RencanaBidang = lazy(() => import("./pages/opera/RencanaBidang"))
const RencanaSaya = lazy(() => import("./pages/opera/RencanaSaya"))
const RencanaSayaDetail = lazy(() => import("./pages/opera/RencanaSayaDetail"))
const StrukturProgram = lazy(() => import("./pages/opera/StrukturProgram"))

const Memuat = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
  </div>
)

// Suspense di dalam jaga() supaya sidebar & header tetap tampil saat layar dimuat.
const jaga = (halaman: React.ReactNode) => (
  <PenjagaPeran>
    <Suspense fallback={<Memuat />}>{halaman}</Suspense>
  </PenjagaPeran>
)

export default function App() {
  return (
    <PenyediaPeran>
      <BrowserRouter>
        <Suspense fallback={<Memuat />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/detail" element={<Detail />} />
          <Route path="/login" element={<Login />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={jaga(<DashboardUmum />)} />
            <Route path="/bidang/:id" element={jaga(<KinerjaBidang />)} />
            <Route path="/struktur" element={jaga(<StrukturProgram />)} />
            <Route path="/capaian-program" element={jaga(<CapaianProgram />)} />
            <Route path="/monitoring" element={jaga(<MonitoringKinerja />)} />
            <Route path="/monitoring/subkegiatan/:id" element={jaga(<DetailSubkegiatan />)} />
            <Route path="/master/:tingkat" element={jaga(<DataMaster />)} />
            <Route path="/rencana" element={jaga(<PenyusunanRencana />)} />
            <Route path="/rencana/:bidangId" element={jaga(<RencanaBidang />)} />
            <Route path="/rencana-saya" element={jaga(<RencanaSaya />)} />
            <Route path="/rencana-saya/:id" element={jaga(<RencanaSayaDetail />)} />
            <Route path="/kalender" element={jaga(<KalenderRencana />)} />
            <Route path="/realisasi" element={jaga(<CatatRealisasi />)} />
            <Route path="/bukti" element={jaga(<BuktiKegiatan />)} />
            <Route path="/log" element={jaga(<LogAktivitas />)} />
            <Route path="/periode" element={jaga(<PeriodeLayar />)} />
            <Route path="/master-bidang" element={jaga(<MasterBidang />)} />
            <Route path="/master-dokumen" element={jaga(<MasterDokumen />)} />
            <Route path="/pengguna" element={jaga(<ManajemenPengguna />)} />
          </Route>
          <Route path="/opera/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/master/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </PenyediaPeran>
  )
}
