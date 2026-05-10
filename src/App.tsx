import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Detail from './pages/Detail';
import Login from './pages/Login';
import MasterUserPage from './pages/master/user';
import DashboardLayout from './layouts/DashboardLayout';
import MasterProgram from './pages/master/Program';
import MasterIndikatorUtama from './pages/master/IndikatorUtama';
import MasterAktifitasUtama from './pages/master/AktifitasUtama';
import MasterIndikator from './pages/master/Indikator';
import MasterBidang from './pages/master/Bidang';
import MasterPeriode from './pages/master/Periode';
import MasterJenisKegiatan from './pages/master/JenisKegiatan';
import TransaksiIndikatorBidang from './pages/dashboard/TransaksiIndikatorBidang';
import TransaksiAktifitasUtama from './pages/dashboard/TransaksiAktifitasUtama';
import TransaksiIndikatorDetail from './pages/dashboard/TransaksiIndikatorDetail';
import TransaksiRealisasiKegiatan from './pages/dashboard/TransaksiRealisasiKegiatan';

import RencanaKegiatan from './pages/Rencana/RencanaKegiatan';
import TransaksiRealisasiKegiatanView from './pages/dashboard/TransaksiRealisasiKegiatanView';
import RencanaKegiatanView from './pages/Rencana/RencanaKegiatanView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/login" element={<Login />} />

        <Route path="/master" element={<DashboardLayout />}>
          <Route path="user" element={<MasterUserPage />} />
          <Route path="program" element={<MasterProgram />} />
          <Route path="indikator-utama" element={<MasterIndikatorUtama />} />
          <Route path="aktifitas-utama" element={<MasterAktifitasUtama />} />
          <Route path="indikator" element={<MasterIndikator />} />
          <Route path="bidang" element={<MasterBidang />} />
          <Route path="periode" element={<MasterPeriode />} />
          <Route path="jenis-kegiatan" element={<MasterJenisKegiatan />} />
        </Route>

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route
            index
            element={<div className="p-6">Selamat datang di Dashboard</div>}
          />
          <Route
            path="transaksi-indikator-bidang"
            element={<TransaksiIndikatorBidang />}
          />
          <Route
            path="transaksi-aktifitas-utama"
            element={<TransaksiAktifitasUtama />}
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
