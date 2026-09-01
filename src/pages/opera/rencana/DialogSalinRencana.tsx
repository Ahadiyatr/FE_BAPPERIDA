import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eyebrow } from '@/components/opera/primitives';
import { salinRencana } from '@/services';
import { apiMessage } from '@/services/api';
import type { Periode } from '@/services';

/**
 * Salin pembagian bidang + isinya dari periode sebelumnya. Dipakai dua tab
 * (Penunjukan dan Papan Kesiapan) karena inilah jalur normal untuk periode rutin —
 * katalog resmi selalu punya penanggung jawab, jadi penunjukan manual hanya perlu
 * untuk periode pertama atau saat struktur organisasi berubah.
 */
export function DialogSalinRencana({
  terbuka,
  onTutup,
  sumber,
  tujuan,
  adaIsi,
  onSelesai,
}: {
  terbuka: boolean;
  onTutup: () => void;
  sumber: Periode;
  tujuan: Periode;
  /** Periode tujuan sudah punya rencana — beri peringatan akan ditimpa. */
  adaIsi: boolean;
  onSelesai: () => void | Promise<void>;
}) {
  const [opsi, setOpsi] = React.useState({
    ikutAktifitas: true,
    ikutTarget: true,
    ikutCapaianNol: false,
  });
  const [menyalin, setMenyalin] = React.useState(false);
  const [galat, setGalat] = React.useState<string | null>(null);

  async function jalankan() {
    setMenyalin(true);
    setGalat(null);
    try {
      await salinRencana({
        dariPeriodeId: sumber.id,
        kePeriodeId: tujuan.id,
        ikutStruktur: true,
        ...opsi,
      });
      onTutup();
      await onSelesai();
    } catch (e) {
      setGalat(apiMessage(e, 'Gagal menyalin rencana.'));
    } finally {
      setMenyalin(false);
    }
  }

  return (
    <Dialog open={terbuka} onOpenChange={o => !o && onTutup()}>
      <DialogContent>
        <DialogHeader>
          <Eyebrow>
            {sumber.namaPeriode} → {tujuan.namaPeriode}
          </Eyebrow>
          <DialogTitle className="font-bold">
            Salin rencana periode sebelumnya
          </DialogTitle>
          <DialogDescription>
            Pilih apa saja yang ikut disalin. Realisasi dan bukti kegiatan tidak
            pernah ikut tersalin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="flex cursor-not-allowed items-start gap-2.5 rounded-xl border bg-muted/40 p-2.5 opacity-70">
            <Checkbox checked disabled className="mt-0.5" />
            <span className="text-sm">
              <b className="block">Struktur subkegiatan dan pembagian bidang</b>
              <span className="text-muted-foreground">
                Selalu ikut — sisanya menempel padanya.
              </span>
            </span>
          </label>

          {(
            [
              [
                'ikutAktifitas',
                'Aktivitas utama dan pendukung',
                'Bobot 70/30 dihitung ulang di periode baru.',
              ],
              [
                'ikutTarget',
                'Angka target',
                'Bisa disesuaikan satu per satu setelah disalin.',
              ],
              [
                'ikutCapaianNol',
                'Subkegiatan yang capaiannya nol',
                'Yang tidak berjalan sama sekali di periode sumber.',
              ],
            ] as const
          ).map(([kunci, judul, ket]) => (
            <label
              key={kunci}
              className="flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 hover:bg-muted/40"
            >
              <Checkbox
                className="mt-0.5"
                checked={opsi[kunci]}
                onCheckedChange={v =>
                  setOpsi(o => ({ ...o, [kunci]: v === true }))
                }
              />
              <span className="text-sm">
                <b className="block">{judul}</b>
                <span className="text-muted-foreground">{ket}</span>
              </span>
            </label>
          ))}

          {adaIsi && (
            <p className="rounded-xl bg-amber-50/70 px-3 py-2 text-sm">
              Rencana <b>{tujuan.namaPeriode}</b> yang sudah tersusun untuk
              bidang terdampak akan ditimpa.
            </p>
          )}

          {galat && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {galat}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onTutup}>
            Batal
          </Button>
          <Button onClick={() => void jalankan()} disabled={menyalin}>
            {menyalin ? 'Menyalin…' : 'Salin sekarang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
