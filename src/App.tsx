import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Detail from './pages/Detail';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import MasterProgram from './pages/dashboard/MasterProgram';
import MasterIndikatorUtama from './pages/dashboard/MasterIndikatorUtama';
import MasterIndikator from './pages/dashboard/MasterIndikator';
import MasterBidang from './pages/dashboard/MasterBidang';
import MasterPeriode from './pages/dashboard/MasterPeriode';
import TransaksiIndikatorBidang from './pages/dashboard/TransaksiIndikatorBidang';
import TransaksiIndikatorDetail from './pages/dashboard/TransaksiIndikatorDetail';
import TransaksiRealisasiKegiatan from './pages/dashboard/TransaksiRealisasiKegiatan';

import RencanaKegiatan from './pages/dashboard/RencanaKegiatan';
import TransaksiRealisasiKegiatanView from './pages/dashboard/TransaksiRealisasiKegiatanView';
import RencanaKegiatanView from './pages/dashboard/RencanaKegiatanView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route
            index
            element={<div className="p-6">Selamat datang di Dashboard</div>}
          />
          <Route path="master-program" element={<MasterProgram />} />
          <Route
            path="master-indikator-utama"
            element={<MasterIndikatorUtama />}
          />
          <Route path="master-indikator" element={<MasterIndikator />} />
          <Route path="master-bidang" element={<MasterBidang />} />
          <Route path="master-periode" element={<MasterPeriode />} />
          <Route
            path="transaksi-indikator-bidang"
            element={<TransaksiIndikatorBidang />}
          />
          <Route
            path="transaksi-indikator-detail"
            element={<TransaksiIndikatorDetail />}
          />
          <Route
            path="transaksi-realisasi-kegiatan"
            element={<TransaksiRealisasiKegiatan />}
          />
          <Route
            path="transaksi-realisasi-kegiatan/detail/:id"
            element={<TransaksiRealisasiKegiatanView mode="detail" />}
          />
          <Route
            path="transaksi-realisasi-kegiatan/edit/:id"
            element={<TransaksiRealisasiKegiatanView mode="edit" />}
          />
          <Route path="rencana-kegiatan" element={<RencanaKegiatan />} />
          <Route
            path="rencana-kegiatan/detail/:id"
            element={<RencanaKegiatanView />}
          />
        </Route>
      </Routes>
    </Router>
  );
}
