import * as React from 'react';
import { api, dataOf, ensureCsrf } from '@/services/api';
import { Toast } from '@/utils/toast';

export type Peran = 'publik' | 'admin_bidang' | 'admin_aplikasi';
export interface PenggunaSesi {
  id: number;
  name: string;
  email: string;
  role: Exclude<Peran, 'publik'>;
  bidang: { id: number; nama_bidang: string }[];
}

export const LABEL_PERAN: Record<Peran, string> = {
  publik: 'Pengunjung',
  admin_bidang: 'Admin bidang',
  admin_aplikasi: 'Admin aplikasi',
};

interface NilaiPeran {
  peran: Peran;
  bidangId: number | null;
  user: PenggunaSesi | null;
  memuat: boolean;
  login: (email: string, password: string) => Promise<PenggunaSesi>;
  logout: () => Promise<void>;
}

const KonteksPeran = React.createContext<NilaiPeran | null>(null);

export function PenyediaPeran({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<PenggunaSesi | null>(null);
  const [memuat, setMemuat] = React.useState(true);

  React.useEffect(() => {
    api
      .get('/me')
      .then(response => setUser(dataOf<PenggunaSesi>(response)))
      .catch(() => setUser(null))
      .finally(() => setMemuat(false));
  }, []);
  React.useEffect(() => {
    const unauthorized = () => {
      setUser(null);
      setMemuat(false);
      Toast.fire({
        icon: 'info',
        title: 'Sesi berakhir. Silakan masuk kembali.',
      });
    };
    window.addEventListener('opera:unauthorized', unauthorized);
    return () => window.removeEventListener('opera:unauthorized', unauthorized);
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    await ensureCsrf();
    const hasil = dataOf<{ user: PenggunaSesi }>(
      await api.post('/login', { email, password }),
    );
    setUser(hasil.user);
    return hasil.user;
  }, []);
  const logout = React.useCallback(async () => {
    try {
      await api.post('/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const nilai = React.useMemo<NilaiPeran>(
    () => ({
      peran: user?.role ?? 'publik',
      bidangId: user?.bidang[0]?.id ?? null,
      user,
      memuat,
      login,
      logout,
    }),
    [user, memuat, login, logout],
  );
  return (
    <KonteksPeran.Provider value={nilai}>{children}</KonteksPeran.Provider>
  );
}

export const AKSES: { awalan: string; peran: Peran[] }[] = [
  { awalan: '/dashboard', peran: ['admin_bidang', 'admin_aplikasi'] },
  { awalan: '/monitoring', peran: ['admin_bidang', 'admin_aplikasi'] },
  // Detail satu subkegiatan sampai lampiran — endpoint backend admin_aplikasi saja.
  { awalan: '/monitoring/subkegiatan', peran: ['admin_aplikasi'] },
  // Endpoint katalog, rincian program, dan rencana lintas-bidang hanya tersedia
  // untuk admin_aplikasi; admin_bidang memakai Rencana Saya dan Dashboard.
  { awalan: '/bidang', peran: ['admin_aplikasi'] },
  { awalan: '/struktur', peran: ['admin_aplikasi'] },
  { awalan: '/capaian-program', peran: ['admin_aplikasi'] },
  { awalan: '/realisasi', peran: ['admin_bidang'] },
  { awalan: '/bukti', peran: ['admin_bidang'] },
  { awalan: '/log', peran: ['admin_aplikasi'] },
  { awalan: '/rencana-saya', peran: ['admin_bidang'] },
  { awalan: '/rencana', peran: ['admin_aplikasi'] },
  { awalan: '/master', peran: ['admin_aplikasi'] },
  { awalan: '/periode', peran: ['admin_aplikasi'] },
  { awalan: '/pengguna', peran: ['admin_aplikasi'] },
];

export function peranYangBoleh(path: string): Peran[] | null {
  const cocok = AKSES.filter(a => path.startsWith(a.awalan)).sort(
    (a, b) => b.awalan.length - a.awalan.length,
  )[0];
  return cocok?.peran ?? null;
}
export function bolehAkses(peran: Peran, path: string): boolean {
  const daftar = peranYangBoleh(path);
  return daftar === null || daftar.includes(peran);
}
export function usePeran(): NilaiPeran {
  const konteks = React.useContext(KonteksPeran);
  if (!konteks)
    throw new Error('usePeran() harus dipakai di dalam <PenyediaPeran>');
  return konteks;
}
