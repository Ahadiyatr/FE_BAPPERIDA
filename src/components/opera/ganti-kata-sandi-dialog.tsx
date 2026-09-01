import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gantiKataSandi } from '@/services';
import { apiMessage } from '@/services/api';
import { Toast } from '@/utils/toast';

/** Dialog ganti kata sandi sendiri — dipakai admin bidang lewat dropdown avatar. */
export function GantiKataSandiDialog({
  terbuka,
  onTutup,
}: {
  terbuka: boolean;
  onTutup: () => void;
}) {
  const [lama, setLama] = React.useState('');
  const [baru, setBaru] = React.useState('');
  const [konfirmasi, setKonfirmasi] = React.useState('');
  const [menyimpan, setMenyimpan] = React.useState(false);
  const [galat, setGalat] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (terbuka) {
      setLama('');
      setBaru('');
      setKonfirmasi('');
      setGalat(null);
      setMenyimpan(false);
    }
  }, [terbuka]);

  const cukup = baru.length >= 8;
  const cocok = baru === konfirmasi;
  const beda = baru !== lama;
  const boleh = !menyimpan && lama.length > 0 && cukup && cocok && beda;

  async function kirim() {
    setGalat(null);
    setMenyimpan(true);
    try {
      await gantiKataSandi(lama, baru);
      Toast.fire({ icon: 'success', title: 'Kata sandi diperbarui.' });
      onTutup();
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal mengganti kata sandi.'));
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <Dialog open={terbuka} onOpenChange={o => !o && onTutup()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ganti kata sandi</DialogTitle>
          <DialogDescription>
            Masukkan kata sandi saat ini lalu kata sandi baru (minimal 8
            karakter).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
              Kata sandi saat ini
            </span>
            <Input
              type="password"
              autoComplete="current-password"
              value={lama}
              onChange={e => setLama(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
              Kata sandi baru
            </span>
            <Input
              type="password"
              autoComplete="new-password"
              value={baru}
              onChange={e => setBaru(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
              Konfirmasi kata sandi baru
            </span>
            <Input
              type="password"
              autoComplete="new-password"
              value={konfirmasi}
              onChange={e => setKonfirmasi(e.target.value)}
            />
          </label>

          {baru.length > 0 && !cukup && (
            <p className="text-xs text-amber-600">Minimal 8 karakter.</p>
          )}
          {konfirmasi.length > 0 && !cocok && (
            <p className="text-xs text-amber-600">Konfirmasi belum cocok.</p>
          )}
          {baru.length > 0 && cukup && !beda && (
            <p className="text-xs text-amber-600">
              Kata sandi baru harus berbeda dari yang sekarang.
            </p>
          )}
          {galat && (
            <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">
              {galat}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onTutup} disabled={menyimpan}>
            Batal
          </Button>
          <Button onClick={() => void kirim()} disabled={!boleh}>
            {menyimpan ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
