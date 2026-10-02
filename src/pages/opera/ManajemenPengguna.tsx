import * as React from 'react';
import { Copy, KeyRound, Plus } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/opera/search-input';
import {
  getBidang,
  getUsers,
  resetPasswordUser,
  setAktifUser,
  simpanUser,
} from '@/services';
import type { Bidang, PeranPengguna, User } from '@/services';
import { apiMessage } from '@/services/api';
import { Toast } from '@/utils/toast';
import {
  memenuhiKebijakanKataSandi,
  PETUNJUK_KEBIJAKAN_KATA_SANDI,
} from '@/utils/kata-sandi';
import { Panel, Th } from './bagian/ui';

type PeranAkun = Exclude<PeranPengguna, 'publik'>;
type FilterStatus = 'semua' | 'aktif' | 'nonaktif';
const LABEL: Record<PeranAkun, string> = {
  admin_aplikasi: 'Admin aplikasi',
  admin_bidang: 'Admin bidang',
};

export default function ManajemenPengguna() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [bidangs, setBidangs] = React.useState<Bidang[]>([]);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [laci, setLaci] = React.useState<User | null | undefined>(undefined);
  const [konfirmasi, setKonfirmasi] = React.useState<User | null>(null);
  const [resetUntuk, setResetUntuk] = React.useState<User | null>(null);
  const [cari, setCari] = React.useState('');
  const [filterPeran, setFilterPeran] = React.useState<PeranAkun | 'semua'>('semua');
  const [filterBidang, setFilterBidang] = React.useState<number | 'semua'>('semua');
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('semua');

  const muat = React.useCallback(async () => {
    const [u, b] = await Promise.all([
      getUsers({ termasukNonaktif: true }),
      getBidang(),
    ]);
    setUsers(u);
    setBidangs(b);
  }, []);
  React.useEffect(() => {
    void muat();
  }, [muat]);

  const namaBidang = React.useCallback(
    (id: number | null) =>
      id == null ? '—' : (bidangs.find(b => b.id === id)?.namaBidang ?? `#${id}`),
    [bidangs],
  );

  const penggunaTersaring = React.useMemo(() => {
    const kata = cari.trim().toLocaleLowerCase('id-ID');
    return users.filter(user => {
      const cocokPencarian =
        !kata ||
        [user.name, user.email, namaBidang(user.bidangId)]
          .some(teks => teks.toLocaleLowerCase('id-ID').includes(kata));
      const cocokPeran = filterPeran === 'semua' || user.role === filterPeran;
      const cocokBidang = filterBidang === 'semua' || user.bidangId === filterBidang;
      const cocokStatus =
        filterStatus === 'semua' ||
        (filterStatus === 'aktif' ? user.flagActive : !user.flagActive);
      return cocokPencarian && cocokPeran && cocokBidang && cocokStatus;
    });
  }, [cari, filterBidang, filterPeran, filterStatus, namaBidang, users]);

  const adaSaringan =
    !!cari ||
    filterPeran !== 'semua' ||
    filterBidang !== 'semua' ||
    filterStatus !== 'semua';

  const gayaFilter =
    'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition-[border-color,box-shadow] hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  async function ubahAktif(u: User) {
    setGalat(null);
    try {
      await setAktifUser(u.id, !u.flagActive);
      await muat();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mengubah status.');
    } finally {
      setKonfirmasi(null);
    }
  }

  return (
    <div className="space-y-6">
      {galat && (
        <div className="p-4 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">
          {galat}
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          value={cari}
          onValueChange={setCari}
          placeholder="Cari nama, email, atau bidang…"
          aria-label="Cari pengguna"
          className="lg:w-72 lg:shrink-0"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex">
          <select
            aria-label="Filter peran pengguna"
            className={gayaFilter}
            value={filterPeran}
            onChange={event => setFilterPeran(event.target.value as PeranAkun | 'semua')}
          >
            <option value="semua">Semua peran</option>
            <option value="admin_aplikasi">Admin aplikasi</option>
            <option value="admin_bidang">Admin bidang</option>
          </select>
          <select
            aria-label="Filter bidang pengguna"
            className={gayaFilter}
            value={filterBidang}
            onChange={event => setFilterBidang(event.target.value === 'semua' ? 'semua' : Number(event.target.value))}
          >
            <option value="semua">Semua bidang</option>
            {bidangs.map(bidang => (
              <option key={bidang.id} value={bidang.id}>{bidang.namaBidang}</option>
            ))}
          </select>
          <select
            aria-label="Filter status pengguna"
            className={gayaFilter}
            value={filterStatus}
            onChange={event => setFilterStatus(event.target.value as FilterStatus)}
          >
            <option value="semua">Semua status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
        {adaSaringan && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start lg:self-auto"
            onClick={() => {
              setCari('');
              setFilterPeran('semua');
              setFilterBidang('semua');
              setFilterStatus('semua');
            }}
          >
            Bersihkan saringan
          </Button>
        )}
        <p className="text-xs text-slate-500 lg:ml-auto">
          {penggunaTersaring.length} dari {users.length} pengguna
        </p>
        <Button
          className="shrink-0 self-start lg:self-auto"
          onClick={() => setLaci(null)}
        >
          <Plus className="w-3.5 h-3.5" /> Tambah pengguna
        </Button>
      </div>

      <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>Peran</Th>
              <Th>Bidang</Th>
              <Th>Status</Th>
              <Th kanan>Tindakan</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {penggunaTersaring.map(u => (
              <tr
                key={u.id}
                className={u.flagActive ? 'hover:bg-slate-50' : 'opacity-55'}
              >
                <td className="px-6 py-3 text-sm font-medium text-slate-800">
                  {u.name}
                </td>
                <td className="px-6 py-3 text-sm text-slate-500">{u.email}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                      u.role === 'admin_aplikasi'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {LABEL[u.role]}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">
                  {namaBidang(u.bidangId)}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`text-xs font-semibold uppercase ${u.flagActive ? 'text-emerald-700' : 'text-slate-400'}`}
                  >
                    {u.flagActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setLaci(u)}>
                    Ubah
                  </Button>
                  {u.flagActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setResetUntuk(u)}
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Reset sandi
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setKonfirmasi(u)}
                  >
                    {u.flagActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </td>
              </tr>
            ))}
            {penggunaTersaring.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  {adaSaringan
                    ? 'Tidak ada pengguna yang cocok dengan pencarian dan filter.'
                    : 'Belum ada pengguna.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      {laci !== undefined && (
        <LaciPengguna
          awal={laci}
          bidangs={bidangs}
          onTutup={() => setLaci(undefined)}
          onTersimpan={() => void muat()}
        />
      )}

      <AlertDialog
        open={konfirmasi !== null}
        onOpenChange={o => !o && setKonfirmasi(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {konfirmasi?.flagActive ? 'Nonaktifkan' : 'Aktifkan'}{' '}
              {konfirmasi?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {konfirmasi?.flagActive
                ? 'Akun tidak dihapus — catatan realisasi menyimpan nama pencatatnya, jadi jejaknya harus tetap bisa ditelusuri.'
                : 'Akun ini bisa masuk lagi dan mencatat realisasi untuk bidangnya.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => konfirmasi && void ubahAktif(konfirmasi)}
            >
              {konfirmasi?.flagActive ? 'Nonaktifkan' : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {resetUntuk && (
        <DialogResetSandi
          pengguna={resetUntuk}
          onTutup={() => setResetUntuk(null)}
        />
      )}
    </div>
  );
}

function LaciPengguna({
  awal,
  bidangs,
  onTutup,
  onTersimpan,
}: {
  awal: User | null;
  bidangs: Bidang[];
  onTutup: () => void;
  onTersimpan: () => void;
}) {
  const [name, setName] = React.useState(awal?.name ?? '');
  const [email, setEmail] = React.useState(awal?.email ?? '');
  const [role, setRole] = React.useState<PeranAkun>(
    awal?.role ?? 'admin_bidang',
  );
  const [bidangId, setBidangId] = React.useState<number | null>(
    awal?.bidangId ?? bidangs[0]?.id ?? null,
  );
  const [sandi, setSandi] = React.useState('');
  const [konfirmasiSandi, setKonfirmasiSandi] = React.useState('');
  const [galat, setGalat] = React.useState<string | null>(null);

  const membuat = awal == null;
  const sandiCukup = memenuhiKebijakanKataSandi(sandi);
  const sandiCocok = sandi === konfirmasiSandi;
  const sandiValid = !membuat || (sandiCukup && sandiCocok);

  async function simpan() {
    setGalat(null);
    try {
      await simpanUser({
        id: awal?.id,
        name,
        email,
        role,
        bidangId,
        password: membuat ? sandi : undefined,
      });
      onTersimpan();
      onTutup();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  const gaya =
    'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none';

  return (
    <Sheet open onOpenChange={o => !o && onTutup()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{awal ? 'Ubah pengguna' : 'Pengguna baru'}</SheetTitle>
          <SheetDescription>
            Admin bidang wajib ditempatkan di satu bidang. Admin aplikasi tidak.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-3">
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
              Nama
            </span>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
              Email
            </span>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
              Peran
            </span>
            <select
              className={gaya}
              value={role}
              onChange={e => setRole(e.target.value as PeranAkun)}
            >
              <option value="admin_bidang">Admin bidang</option>
              <option value="admin_aplikasi">Admin aplikasi</option>
            </select>
          </label>
          {role === 'admin_bidang' && (
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
                Bidang
              </span>
              <select
                className={gaya}
                value={bidangId ?? ''}
                onChange={e => setBidangId(Number(e.target.value))}
              >
                {bidangs.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.namaBidang}
                  </option>
                ))}
              </select>
            </label>
          )}
          {membuat && (
            <>
              <label className="block">
                <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Kata sandi
                </span>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={sandi}
                  onChange={e => setSandi(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Konfirmasi kata sandi
                </span>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={konfirmasiSandi}
                  onChange={e => setKonfirmasiSandi(e.target.value)}
                />
              </label>
              {sandi.length > 0 && !sandiCukup && (
                <p className="text-xs text-amber-600">
                  {PETUNJUK_KEBIJAKAN_KATA_SANDI}
                </p>
              )}
              {konfirmasiSandi.length > 0 && !sandiCocok && (
                <p className="text-xs text-amber-600">
                  Konfirmasi kata sandi belum cocok.
                </p>
              )}
            </>
          )}
          {galat && (
            <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">
              {galat}
            </p>
          )}
        </div>

        <SheetFooter>
          <Button
            onClick={() => void simpan()}
            disabled={!name || !email || !sandiValid}
          >
            Simpan
          </Button>
          <Button variant="ghost" onClick={onTutup}>
            Batal
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DialogResetSandi({
  pengguna,
  onTutup,
}: {
  pengguna: User;
  onTutup: () => void;
}) {
  const [mode, setMode] = React.useState<'manual' | 'auto'>('manual');
  const [sandi, setSandi] = React.useState('');
  const [konfirmasi, setKonfirmasi] = React.useState('');
  const [menyimpan, setMenyimpan] = React.useState(false);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [hasil, setHasil] = React.useState<string | null>(null);

  const cukup = memenuhiKebijakanKataSandi(sandi);
  const cocok = sandi === konfirmasi;
  const bolehKirim =
    !menyimpan && (mode === 'auto' || (cukup && cocok));

  async function kirim() {
    setGalat(null);
    setMenyimpan(true);
    try {
      const dibuat = await resetPasswordUser(
        pengguna.id,
        mode === 'manual' ? sandi : undefined,
      );
      if (dibuat) {
        setHasil(dibuat);
      } else {
        Toast.fire({ icon: 'success', title: 'Kata sandi direset.' });
        onTutup();
      }
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal mereset kata sandi.'));
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <Dialog open onOpenChange={o => !o && onTutup()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset kata sandi</DialogTitle>
          <DialogDescription>
            Untuk <span className="font-medium">{pengguna.name}</span> (
            {pengguna.email}).
          </DialogDescription>
        </DialogHeader>

        {hasil ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Kata sandi baru — salin sekarang, tidak akan ditampilkan lagi:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 font-mono text-sm rounded-lg bg-slate-100 text-slate-800 break-all">
                {hasil}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(hasil);
                  Toast.fire({ icon: 'success', title: 'Disalin.' });
                }}
              >
                <Copy className="w-3.5 h-3.5" /> Salin
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={onTutup}>Selesai</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === 'manual' ? 'default' : 'outline'}
                onClick={() => setMode('manual')}
              >
                Ketik sandi baru
              </Button>
              <Button
                size="sm"
                variant={mode === 'auto' ? 'default' : 'outline'}
                onClick={() => setMode('auto')}
              >
                Buatkan otomatis
              </Button>
            </div>

            {mode === 'manual' && (
              <>
                <label className="block">
                  <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
                    Kata sandi baru
                  </span>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={sandi}
                    onChange={e => setSandi(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
                    Konfirmasi
                  </span>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={konfirmasi}
                    onChange={e => setKonfirmasi(e.target.value)}
                  />
                </label>
                {sandi.length > 0 && !cukup && (
                  <p className="text-xs text-amber-600">
                    {PETUNJUK_KEBIJAKAN_KATA_SANDI}
                  </p>
                )}
                {konfirmasi.length > 0 && !cocok && (
                  <p className="text-xs text-amber-600">Konfirmasi belum cocok.</p>
                )}
              </>
            )}

            {mode === 'auto' && (
              <p className="text-sm text-slate-600">
                Sistem membuat kata sandi acak. Ditampilkan sekali setelah reset
                untuk Anda salin dan sampaikan ke pengguna.
              </p>
            )}

            {galat && (
              <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">
                {galat}
              </p>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={onTutup}
                disabled={menyimpan}
              >
                Batal
              </Button>
              <Button onClick={() => void kirim()} disabled={!bolehKirim}>
                {menyimpan ? 'Memproses…' : 'Reset'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
