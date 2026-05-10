import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import {
  LayoutDashboard,
  Database,
  Target,
  BarChart2,
  Layers,
  Calendar,
  Link as LinkIcon,
  ListTodo,
  CheckSquare,
  LogOut,
  Menu,
  X,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  BookType,
  LibraryBig,
} from 'lucide-react';

const sidebarLinks: any[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { Heading: 'Master Data' },
  { name: 'Periode', href: '/master/periode', icon: Calendar },
  { name: 'Program', href: '/master/program', icon: Database },
  { name: 'Bidang', href: '/master/bidang', icon: Layers },
  {
    name: 'User',
    href: '/master/user',
    icon: Database,
  },
  {
    name: 'Indikator Utama',
    href: '/master/indikator-utama',
    icon: LibraryBig,
  },
  {
    name: 'Indikator Sub',
    href: '/master/indikator',
    icon: BarChart2,
  },
  {
    name: 'Aktifitas Utama',
    href: '/master/aktifitas-utama',
    icon: Activity,
  },
  {
    name: 'Jenis Kegiatan',
    href: '/master/jenis-kegiatan',
    icon: BookType,
  },
  { Heading: 'Transaksi' },
  {
    name: 'Indikator Bidang',
    href: '/dashboard/transaksi-indikator-bidang',
    icon: LinkIcon,
  },
  {
    name: 'Aktifitas Utama',
    href: '/dashboard/transaksi-aktifitas-utama',
    icon: LinkIcon,
  },
  {
    name: 'Indikator Detail',
    href: '/dashboard/transaksi-indikator-detail',
    icon: ListTodo,
  },

  { Heading: 'Renacana & Realisasi' },
  {
    name: 'Rencana & Capaian Kegiatan',
    href: '/dashboard/rencana-kegiatan',
    icon: Target,
  },
  {
    name: 'Realisasi Kegiatan',
    href: '/dashboard/transaksi-realisasi-kegiatan',
    icon: CheckSquare,
  },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Memanggil endpoint user untuk memastikan sesi valid
        // (Akan menggunakan token dari localStorage atau cookie Sanctum)
        const response = await api.get('/api/user');

        // Sesuaikan dengan struktur response backend Laravel
        // Bisa di response.data, response.data.data, atau response.data.user
        const userData =
          response.data?.data || response.data?.user || response.data;
        setUser(userData);
      } catch (error: any) {
        console.error('Auth check failed:', error);
        // Hapus token yang tidak valid
        localStorage.removeItem('token');
        // Jika gagal (misal 401 Unauthorized), arahkan ke halaman login
        navigate('/login');
      } finally {
        // Pastikan loading state dimatikan baik saat sukses maupun gagal
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // hit logout API
      await api.post(
        '/api/logout',
        {},
        {
          withCredentials: true,
        },
      );

      // hapus data lokal (kalau ada)
      localStorage.removeItem('token');

      // redirect ke login
      navigate('/login');
    } catch (error: any) {
      console.error('Logout gagal:', error.response?.data || error.message);

      // kalau token/session sudah tidak valid → paksa logout frontend
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 rounded-full border-emerald-500 border-t-transparent animate-spin"></div>
          <p className="font-medium text-slate-500">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-sans bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'lg:w-16' : 'lg:w-72'}
        w-72
      `}
      >
        {/* Sidebar header */}
        <div
          className={`flex items-center h-16 px-4 border-b border-slate-100 ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          <Link to="/" className="flex items-center min-w-0 gap-3">
            <div className="shrink-0 bg-gradient-to-br from-emerald-500 to-yellow-400 p-1.5 rounded-lg shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold tracking-tight truncate text-slate-800">
                OPERA-INK
              </span>
            )}
          </Link>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div
          className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}
        >
          {sidebarLinks.map((link, idx) => {
            if (link.Heading) {
              if (collapsed) {
                return (
                  <div
                    key={`divider-${idx}`}
                    className="my-1 border-t border-slate-100"
                  />
                );
              }
              return (
                <div
                  key={`heading-${idx}`}
                  className="px-3 pt-4 pb-1 text-xs font-bold tracking-wider uppercase select-none text-slate-400"
                >
                  {link.Heading}
                </div>
              );
            }
            const isActive = location.pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href || `link-${idx}`}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? link.name : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                />
                {!collapsed && link.name}
              </Link>
            );
          })}
        </div>

        <div
          className={`border-t border-slate-100 ${collapsed ? 'p-2' : 'p-4'}`}
        >
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-end flex-1 gap-3">
            <div className="hidden text-sm font-medium text-slate-700 sm:block">
              {user?.name || 'Admin Bapperrida'}
            </div>
            <div className="flex items-center justify-center w-8 h-8 font-bold uppercase rounded-full bg-emerald-100 text-emerald-700">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <button
              onClick={() => setCollapsed(prev => !prev)}
              className="items-center justify-center hidden w-8 h-8 transition-colors rounded-lg lg:flex text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 p-4 overflow-y-auto bg-slate-50 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
