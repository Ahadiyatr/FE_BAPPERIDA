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

function judulDariPath(pathname: string) {
  if (pathname === '/dashboard') return 'Dashboard Umum';
  if (pathname.startsWith('/bidang/')) return 'Kinerja Bidang';
  if (pathname === '/struktur') return 'Struktur Program';
  if (pathname === '/capaian-program') return 'Capaian Program';
  if (pathname.startsWith('/monitoring/subkegiatan/')) return 'Detail Subkegiatan';
  if (pathname === '/monitoring') return 'Monitoring Kinerja';
  if (pathname.startsWith('/rencana-saya/')) return 'Detail Rencana Saya';
  if (pathname === '/rencana-saya') return 'Rencana Saya';
  if (pathname.startsWith('/rencana/')) return 'Rencana Bidang';
  if (pathname === '/rencana') return 'Penyusunan Rencana';
  if (pathname === '/realisasi') return 'Catat Realisasi';
  if (pathname === '/bukti') return 'Bukti Kegiatan';
  if (pathname === '/log') return 'Log Aktivitas';
  if (pathname === '/periode') return 'Periode';
  if (pathname === '/master-bidang') return 'Master Bidang';
  if (pathname === '/master-dokumen') return 'Master Dokumen Perencanaan';
  if (pathname === '/pengguna') return 'Manajemen Pengguna';
  if (pathname.startsWith('/master/')) return 'Data Master';
  return null;
}

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

  const inisialPengguna = (user?.name ?? 'OPERA')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(nama => nama[0])
    .join('')
    .toUpperCase();
  const judulHalaman = judulDariPath(pathname);

  if (memuat)
    return (
      <div className="grid min-h-screen text-sm place-items-center text-slate-500">
        Memeriksa sesi…
      </div>
    );

  return (
    <div className="flex h-screen gap-4 overflow-hidden bg-[var(--color-surface-subtle)] p-4 font-sans max-lg:p-2.5">
      {terbuka && (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setTerbuka(false)}
        />
      )}
      <aside
        className={`fixed inset-y-2.5 left-2.5 z-50 flex w-72 flex-col rounded-[20px] border border-slate-200 bg-white shadow-sm transition-all lg:static lg:inset-auto lg:h-[calc(100vh-32px)] lg:shrink-0 ${terbuka ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] lg:translate-x-0'} ${ringkas ? 'lg:w-20' : 'lg:w-72'}`}
      >
        <div
          className={`flex items-center px-4 pt-5 pb-4 ${ringkas ? 'justify-center' : 'justify-between'}`}
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
          >
            <span className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-sm">
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
        <nav className="flex-1 px-3 pb-3 space-y-5 overflow-y-auto">
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
                      title={ringkas ? item.name : undefined}
                      onClick={() => setTerbuka(false)}
                      className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${aktif ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'} ${ringkas ? 'justify-center' : ''}`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!ringkas && (
                        <span className="min-w-0">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="pt-3 mx-3 border-t border-slate-200">
          <button
            onClick={keluar}
            className={`mb-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 ${ringkas ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {!ringkas && 'Keluar'}
          </button>
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col gap-2.5">
        <header className="flex h-[76px] shrink-0 items-center justify-between rounded-[20px] border border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Buka menu"
              className="p-2 transition-colors rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setTerbuka(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              aria-label={ringkas ? 'Lebarkan sidebar' : 'Ringkas sidebar'}
              className="hidden p-2 transition-colors rounded-xl text-slate-600 hover:bg-slate-100 lg:block"
              onClick={() => setRingkas(v => !v)}
            >
              {ringkas ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
            {judulHalaman && (
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                {judulHalaman}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3 pl-4 ml-auto border-l border-slate-200 sm:gap-4 sm:pl-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">
                {LABEL_PERAN[peran]}
                {user?.bidang[0] ? ` · ${user.bidang[0].nama_bidang}` : ''}
              </p>
            </div>
            <span
              className="grid w-10 h-10 text-sm font-bold rounded-full shrink-0 place-items-center bg-emerald-100 text-emerald-700"
              aria-label={`Profil ${user?.name ?? 'pengguna'}`}
              title={user?.name}
            >
              {inisialPengguna}
            </span>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto rounded-[20px] pb-4 max-lg:px-0">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
