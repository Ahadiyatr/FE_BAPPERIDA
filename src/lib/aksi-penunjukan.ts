import type { BarisPenunjukan } from '@/services';

/**
 * Logika penunjukan bidang, dipisah dari komponen supaya bisa diuji tanpa DOM.
 *
 * Satu subkegiatan hanya boleh dipegang satu bidang per periode
 * (UNIQUE(PERIODE_ID, SUBKEGIATAN_ID) di backend), jadi "ganti bidang" bukan
 * menambah baris kedua melainkan memindahkan baris yang ada.
 */

export type AksiPenunjukan = 'tugaskan' | 'pindah' | 'cabut' | 'noop';

/** `null` sebagai tujuan berarti "kembalikan ke belum ditugaskan". */
export function aksiPenunjukan(
  baris: BarisPenunjukan,
  bidangTujuanId: number | null,
): AksiPenunjukan {
  if (baris.bidangId === bidangTujuanId) return 'noop';
  if (bidangTujuanId === null) return 'cabut';
  return baris.bidangId === null ? 'tugaskan' : 'pindah';
}

/** Baris yang tidak boleh disentuh, beserta alasannya untuk ditampilkan. */
export function alasanTerkunci(baris: BarisPenunjukan): string | null {
  if (baris.adaRealisasi)
    return 'Sudah ada realisasi tercatat — tidak bisa dipindah atau dilepas.';
  if (!baris.dapatDitugaskan)
    return 'Katalognya butuh 1 aktivitas utama + minimal 1 pendukung yang aktif.';
  return null;
}

export interface RencanaAksiKegiatan {
  /** Dikirim sebagai SATU POST bulk — backend menerima array subkegiatan_ids. */
  tugaskanIds: number[];
  /** Satu PATCH per baris; endpoint pindah-bidang memang per baris. */
  pindahIds: number[];
  /** Satu DELETE per baris. */
  cabutIds: number[];
  /** Baris yang dilewati beserta alasannya — supaya UI bisa memberi tahu. */
  dilewati: { kode: string; alasan: string }[];
}

/**
 * Pecah satu perubahan di header kegiatan menjadi panggilan API seminimal mungkin.
 *
 * Di katalog resmi seluruh subkegiatan dalam satu kegiatan selalu dipegang bidang
 * yang sama (0 dari 20 kegiatan campur), jadi inilah aksi utama layar penunjukan:
 * satu pilihan memindahkan seluruh isi kegiatan sekaligus.
 */
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

/** Nilai yang ditampilkan pada pemilih bidang di header kegiatan. */
export function bidangGrup(
  barisKegiatan: BarisPenunjukan[],
): number | null | 'campuran' {
  if (!barisKegiatan.length) return null;
  const unik = new Set(barisKegiatan.map(b => b.bidangId));
  return unik.size > 1 ? 'campuran' : barisKegiatan[0].bidangId;
}

/** Semua baris subkegiatan dari pohon program → kegiatan, diratakan. */
export function ratakan(
  program: { kegiatan: { subkegiatan: BarisPenunjukan[] }[] }[],
): BarisPenunjukan[] {
  return program.flatMap(p => p.kegiatan.flatMap(k => k.subkegiatan));
}
