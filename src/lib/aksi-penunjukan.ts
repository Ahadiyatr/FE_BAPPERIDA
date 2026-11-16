import type { BarisPenunjukan } from '@/services';

export type AksiPenunjukan = 'tugaskan' | 'pindah' | 'cabut' | 'noop';

export function aksiPenunjukan(
  baris: BarisPenunjukan,
  bidangTujuanId: number | null,
): AksiPenunjukan {
  if (baris.bidangId === bidangTujuanId) return 'noop';
  if (bidangTujuanId === null) return 'cabut';
  return baris.bidangId === null ? 'tugaskan' : 'pindah';
}

export function alasanTerkunci(baris: BarisPenunjukan): string | null {
  if (baris.adaRealisasi)
    return 'Sudah ada realisasi tercatat — tidak bisa dipindah atau dilepas.';
  if (!baris.dapatDitugaskan)
    return 'Katalognya butuh 1 aktivitas utama + minimal 1 pendukung yang aktif.';
  return null;
}

export interface RencanaAksiKegiatan {
  tugaskanIds: number[];
  pindahIds: number[];
  cabutIds: number[];
  dilewati: { kode: string; alasan: string }[];
}

export function rencanaAksiKegiatan(
  barisKegiatan: BarisPenunjukan[],
  bidangTujuanId: number | null,
): RencanaAksiKegiatan {
  const hasil: RencanaAksiKegiatan = {
    tugaskanIds: [],
    pindahIds: [],
    cabutIds: [],
    dilewati: [],
  };

  for (const baris of barisKegiatan) {
    const aksi = aksiPenunjukan(baris, bidangTujuanId);
    if (aksi === 'noop') continue;

    const alasan = alasanTerkunci(baris);
    if (alasan) {
      hasil.dilewati.push({ kode: baris.kode, alasan });
      continue;
    }

    if (aksi === 'tugaskan') hasil.tugaskanIds.push(baris.subkegiatanId);
    else if (baris.rencanaId !== null)
      (aksi === 'pindah' ? hasil.pindahIds : hasil.cabutIds).push(
        baris.rencanaId,
      );
  }

  return hasil;
}

export function bidangGrup(
  barisKegiatan: BarisPenunjukan[],
): number | null | 'campuran' {
  if (!barisKegiatan.length) return null;
  const unik = new Set(barisKegiatan.map(b => b.bidangId));
  return unik.size > 1 ? 'campuran' : barisKegiatan[0].bidangId;
}

export function ratakan(
  program: { kegiatan: { subkegiatan: BarisPenunjukan[] }[] }[],
): BarisPenunjukan[] {
  return program.flatMap(p => p.kegiatan.flatMap(k => k.subkegiatan));
}
