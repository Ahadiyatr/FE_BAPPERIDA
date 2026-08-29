import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart2,
  Calendar,
  CheckSquare,
  Database,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Table2,
  Target,
  X,
} from 'lucide-react';
import { LABEL_PERAN, bolehAkses, usePeran } from '@/lib/peran';

const semuaMenu = [
  {
    label: 'Ringkasan',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        catatan: 'Sebagian mock · daftar tertinggal',
      },
      { name: 'Monitoring Kinerja', href: '/monitoring', icon: Table2 },
      { name: 'Struktur Program', href: '/struktur', icon: Layers },
      { name: 'Capaian Program', href: '/capaian-program', icon: BarChart2 },
    ],
  },
  {
    label: 'Perencanaan',
    items: [
      { name: 'Periode', href: '/periode', icon: Calendar },
      { name: 'Penyusunan Rencana', href: '/rencana', icon: Target },
      { name: 'Rencana Saya', href: '/rencana-saya', icon: Target },
    ],
  },
  {
    label: 'Pelaksanaan',
    items: [
      { name: 'Catat Realisasi', href: '/realisasi', icon: CheckSquare },
      { name: 'Bukti Kegiatan', href: '/bukti', icon: Database },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { name: 'Dokumen', href: '/master-dokumen', icon: Database },
      { name: 'Data Master', href: '/master/program', icon: Database },
      { name: 'Bidang', href: '/master-bidang', icon: Layers },
      { name: 'Pengguna', href: '/pengguna', icon: Database },
    ],
  },
  {
    label: 'Log',
    items: [{ name: 'Log Aktivitas', href: '/log', icon: Database }],
  },
];

export default function DashboardLayout() {
  const [terbuka, setTerbuka] = useState(false);
  const [ringkas, setRingkas] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { peran, user, memuat, logout } = usePeran();

  const keluar = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (memuat)
    return (
      <div className="grid min-h-screen text-sm place-items-center text-slate-500">
        Memeriksa sesi…
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-slate-50">
      {terbuka && (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setTerbuka(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-all lg:static ${terbuka ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${ringkas ? 'lg:w-20' : 'lg:w-72'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
          >
            <span className="p-2 text-white rounded-lg bg-emerald-600">
              <Activity className="w-5 h-5" />
            </span>
            {!ringkas && (
              <span className="font-bold whitespace-nowrap text-slate-800">
                OPERA INK
              </span>
            )}
          </Link>
          <button className="lg:hidden" onClick={() => setTerbuka(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
          {semuaMenu.map(kelompok => {
            const items = kelompok.items.filter(item =>
              bolehAkses(peran, item.href),
            );
            if (!items.length) return null;
            return (
              <div key={kelompok.label}>
                {!ringkas && (
                  <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {kelompok.label}
                  </p>
                )}
                {items.map(item => {
                  const aktif =
                    pathname === item.href ||
                    (item.href.includes('/master/') &&
                      pathname.startsWith('/master/'));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      title={
                        ringkas
                          ? `${item.name}${item.catatan ? ` — ${item.catatan}` : ''}`
                          : undefined
                      }
                      onClick={() => setTerbuka(false)}
                      className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${aktif ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'} ${ringkas ? 'justify-center' : ''}`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!ringkas && (
                        <span className="min-w-0">
                          <span className="block">{item.name}</span>
                          {item.catatan && (
                            <span className="block text-[10px] font-normal leading-3 text-amber-600">
                              {item.catatan}
                            </span>
                          )}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <button
          onClick={keluar}
          className={`m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 ${ringkas ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5" />
          {!ringkas && 'Keluar'}
        </button>
      </aside>
      <section className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 sm:px-6">
          <button className="lg:hidden" onClick={() => setTerbuka(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <button
            className="hidden lg:block"
            onClick={() => setRingkas(v => !v)}
          >
            {ringkas ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
          <div className="ml-auto text-right">
            <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">
              {LABEL_PERAN[peran]}
              {user?.bidang[0] ? ` · ${user.bidang[0].nama_bidang}` : ''}
            </p>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-y-auto sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
