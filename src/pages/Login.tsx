import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogIn, Mail, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import { apiMessage } from '../services/api';
import { usePeran } from '../lib/peran';
import { DESIGN_COLOR } from '../lib/design-tokens';

const AKUN_DEV = [
  { email: 'admin@bapperida.test', label: 'Admin Aplikasi' },
  { email: 'ppm@bapperida.test', label: 'Admin PPM' },
  { email: 'pik@bapperida.test	', label: 'Admin PIK' },
  { email: 'p2epd@bapperida.test ', label: 'Admin P2EPD' },
  { email: 'rinova@bapperida.test', label: 'Admin RINOVA' },
  { email: 'sekre@bapperida.test ', label: 'Admin Sekretariat' },
  { email: 'keuangan@bapperida.test', label: 'Admin Keuangan' },
  {
    email: 'perencanan@bapperida.test',
    label: 'Admin Subbag Perencanaan',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, user, memuat } = usePeran();
  const [email, setEmail] = useState(AKUN_DEV[0].email);
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      sessionStorage.removeItem('opera:redirect_after_login');
      sessionStorage.removeItem('opera:session_expired');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);

      const errorMessage = apiMessage(err, 'Login gagal');
      setError(errorMessage);

      if (
        errorMessage.toLowerCase().includes('password') ||
        errorMessage.toLowerCase().includes('kredensial') ||
        errorMessage.toLowerCase().includes('salah')
      ) {
        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: 'Password salah. Silakan coba lagi.',
          confirmButtonColor: DESIGN_COLOR.success,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: errorMessage,
          confirmButtonColor: DESIGN_COLOR.success,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!memuat && user) {
      sessionStorage.removeItem('opera:redirect_after_login');
      sessionStorage.removeItem('opera:session_expired');
      navigate('/dashboard', { replace: true });
    }
  }, [memuat, navigate, user]);

  return (
    <div className="flex flex-col justify-center min-h-screen py-12 font-sans bg-gradient-to-br from-emerald-50 via-slate-50 to-yellow-50 sm:px-6 lg:px-8">
      {/* DEV ONLY: Info login akun developer */}
      <div className="mb-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="p-4 mb-2 text-sm text-yellow-900 border border-yellow-400 shadow rounded-xl bg-yellow-50">
          <strong>Info Login Developer</strong>
          <span className="text-yellow-800">
            {' '}
            — klik untuk isi otomatis (password{' '}
            <span className="font-mono">password</span>)
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AKUN_DEV.map(akun => (
              <button
                key={akun.email}
                type="button"
                title={akun.label}
                onClick={() => {
                  setEmail(akun.email);
                  setPassword('password');
                }}
                className={`px-2 py-1 rounded-lg border font-mono text-xs transition-colors ${
                  email === akun.email
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-yellow-400 bg-white/70 hover:bg-yellow-100'
                }`}
              >
                {akun.email}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 shadow-lg bg-gradient-to-br from-emerald-500 to-yellow-400 rounded-2xl">
            <Activity className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-center text-slate-900">
          Login ke Dashboard
        </h2>
        <p className="mt-2 text-sm text-center text-slate-600">
          OPERA-INK BAPPERRIDA KAB. TABALONG
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="px-4 py-8 border shadow-xl bg-white/80 backdrop-blur-xl shadow-emerald-900/5 sm:rounded-3xl sm:px-10 border-white/60">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 border-l-4 border-red-500 rounded-md bg-red-50">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Alamat Email
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full py-3 pl-10 border focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border-slate-300 rounded-xl bg-white/50"
                  placeholder="admin@bapperrida.go.id"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full py-3 pl-10 border focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border-slate-300 rounded-xl bg-white/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <label
                  htmlFor="remember-me"
                  className="block ml-2 text-sm text-slate-900"
                >
                  Ingat saya
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  Lupa password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex justify-center w-full px-4 py-3 text-sm font-bold text-white transition-all border border-transparent shadow-sm rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg
                    className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <LogIn className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
