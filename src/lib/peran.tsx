import * as React from 'react';
import { LogIn } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api, dataOf, ensureCsrf } from '@/services/api';

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
  const [sesiBerakhir, setSesiBerakhir] = React.useState(false);

  React.useEffect(() => {
    if (
      window.location.pathname === '/' ||
      window.location.pathname === '/detail' ||
      window.location.pathname === '/login'
    ) {
      setMemuat(false);
      return;
    }

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
      setSesiBerakhir(true);
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
      await api.post('/logout', undefined, {
        validateStatus: status =>
          (status >= 200 && status < 300) || status === 401 || status === 419,
      }).catch(() => {});
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
    <KonteksPeran.Provider value={nilai}>
      {children}
      <AlertDialog open={sesiBerakhir} onOpenChange={setSesiBerakhir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-amber-50 text-amber-700">
              <LogIn />
            </AlertDialogMedia>
            <AlertDialogTitle>Sesi berakhir</AlertDialogTitle>
            <AlertDialogDescription>
              Masa aktif sesi Anda telah habis. Silakan masuk kembali untuk
              melanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Masuk kembali</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KonteksPeran.Provider>
  );
}

export const AKSES: { awalan: string; peran: Peran[] }[] = [
  { awalan: '/dashboard', peran: ['admin_bidang', 'admin_aplikasi'] },
  { awalan: '/monitoring', peran: ['admin_bidang', 'admin_aplikasi'] },
  { awalan: '/monitoring/subkegiatan', peran: ['admin_aplikasi'] },
  { awalan: '/bidang', peran: ['admin_aplikasi'] },
  { awalan: '/struktur', peran: ['admin_aplikasi'] },
  { awalan: '/capaian-program', peran: ['admin_aplikasi'] },
  { awalan: '/kalender', peran: ['admin_bidang', 'admin_aplikasi'] },
  { awalan: '/realisasi', peran: ['admin_bidang'] },
  { awalan: '/bukti', peran: ['admin_bidang', 'admin_aplikasi'] },
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
