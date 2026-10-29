import type { KesiapanBidang, Periode } from '@/services';

/**
 * Logika murni Papan Kesiapan, dipisah dari komponen supaya bisa diuji tanpa DOM.
 *
 * Status kesiapan dari backend hanya dua (DRAFT/SIAP), padahal "DRAFT" mencakup dua
 * keadaan yang tindak lanjutnya berbeda: rencana yang masih cacat (harus dilengkapi)
 * dan rencana yang sudah lengkap tapi belum ditandai (tinggal ditinjau).
 */
export type TahapKesiapan = 'kurang' | 'menunggu' | 'siap';

export function tahapKesiapan(b: KesiapanBidang): TahapKesiapan {
  if (b.status === 'SIAP') return 'siap';
  return b.butir.length ? 'kurang' : 'menunggu';
}

const URUTAN: Record<TahapKesiapan, number> = { kurang: 0, menunggu: 1, siap: 2 };

/** Yang perlu ditindaklanjuti di atas; di dalam satu tahap urut nama. */
export function urutkanKesiapan(papan: KesiapanBidang[]): KesiapanBidang[] {
  return [...papan].sort(
    (a, b) =>
      URUTAN[tahapKesiapan(a)] - URUTAN[tahapKesiapan(b)] ||
      a.namaBidang.localeCompare(b.namaBidang, 'id'),
  );
}

export interface ButirKekurangan {
  /** Kode subkegiatan, atau null untuk butir tingkat bidang. */
  kode: string | null;
  pesan: string;
}

/**
 * Backend mengirim butir sebagai kalimat "KODE: pesan." (KesiapanRencanaService).
 * Dipecah supaya kode bisa ditampilkan terpisah dan dihitung per subkegiatan.
 */
export function pecahButir(butir: string): ButirKekurangan {
  const m = /^(\d+(?:\.\d+)+):\s*(.+)$/.exec(butir.trim());
  if (!m) return { kode: null, pesan: butir.trim() };
  const pesan = m[2].charAt(0).toUpperCase() + m[2].slice(1);
  return { kode: m[1], pesan };
}

/** Jumlah subkegiatan berbeda yang masih punya kekurangan. */
export function jumlahSubkegiatanKurang(b: KesiapanBidang): number {
  const kode = new Set(b.butir.map(x => pecahButir(x).kode).filter(Boolean));
  return kode.size || (b.butir.length ? 1 : 0);
}

export interface SyaratBuka {
  kunci: 'pembagian' | 'siap' | 'tunggal';
  terpenuhi: boolean;
  judul: string;
  keterangan: string;
  hitungan?: string;
}

/**
 * Syarat membuka periode — cermin aturan `PeriodeController::buka` di backend.
 * Server tetap yang menegakkan; ini hanya supaya admin tahu sebelum menekan tombol.
 */
export function syaratBukaPeriode(
  papan: KesiapanBidang[],
  periodeLainTerbuka: Periode | null,
): SyaratBuka[] {
  const belum = urutkanKesiapan(papan).filter(b => b.status !== 'SIAP');
  const siap = papan.length - belum.length;
  return [
    {
      kunci: 'pembagian',
      terpenuhi: papan.length > 0,
      judul: 'Ada bidang yang mendapat pembagian rencana',
      keterangan: papan.length
        ? `${papan.length} bidang memegang subkegiatan pada periode ini.`
        : 'Tugaskan subkegiatan ke bidang di tab Penunjukan.',
    },
    {
      kunci: 'siap',
      terpenuhi: papan.length > 0 && !belum.length,
      judul: 'Semua bidang berstatus Siap',
      keterangan: !papan.length
        ? 'Belum ada bidang untuk ditandai.'
        : belum.length
          ? `Masih menunggu: ${belum.map(b => b.namaBidang).join(', ')}.`
          : 'Setiap rencana bidang sudah ditinjau dan ditandai.',
      hitungan: `${siap} dari ${papan.length}`,
    },
    {
      kunci: 'tunggal',
      terpenuhi: !periodeLainTerbuka,
      judul: 'Tidak ada periode lain yang terbuka',
      keterangan: periodeLainTerbuka
        ? `${periodeLainTerbuka.namaPeriode} masih terbuka. Kunci periode itu dulu di menu Periode.`
        : 'Hanya satu periode yang boleh terbuka dalam satu waktu.',
    },
  ];
}
