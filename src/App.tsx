import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import DashboardLayout from "./layouts/DashboardLayout"
import { PenyediaPeran } from "./lib/peran"
import Detail from "./pages/Detail"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import BuktiKegiatan from "./pages/opera/BuktiKegiatan"
import CapaianProgram from "./pages/opera/CapaianProgram"
import CatatRealisasi from "./pages/opera/CatatRealisasi"
import DashboardUmum from "./pages/opera/DashboardUmum"
import DataMaster from "./pages/opera/DataMaster"
import DetailSubkegiatan from "./pages/opera/DetailSubkegiatan"
import KinerjaBidang from "./pages/opera/KinerjaBidang"
import LogAktivitas from "./pages/opera/LogAktivitas"
import ManajemenPengguna from "./pages/opera/ManajemenPengguna"
import MasterBidang from "./pages/opera/MasterBidang"
import MasterDokumen from "./pages/opera/MasterDokumen"
import MonitoringKinerja from "./pages/opera/MonitoringKinerja"
import PenyusunanRencana from "./pages/opera/PenyusunanRencana"
import PeriodeLayar from "./pages/opera/PeriodeLayar"
import RencanaBidang from "./pages/opera/RencanaBidang"
import RencanaSaya from "./pages/opera/RencanaSaya"
import RencanaSayaDetail from "./pages/opera/RencanaSayaDetail"
import StrukturProgram from "./pages/opera/StrukturProgram"
import { PenjagaPeran } from "./pages/opera/bagian/PenjagaPeran"

const jaga = (halaman: React.ReactNode) => <PenjagaPeran>{halaman}</PenjagaPeran>

export default function App() {
  return (
    <PenyediaPeran>
      <BrowserRouter>
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
      </BrowserRouter>
    </PenyediaPeran>
  )
}
