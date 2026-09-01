import { describe, expect, it } from 'vitest';

import {
  aksiPenunjukan,
  alasanTerkunci,
  bidangGrup,
  ratakan,
  rencanaAksiKegiatan,
  type AksiPenunjukan,
} from '@/lib/aksi-penunjukan';
import type { BarisPenunjukan } from '@/services';

const P2EPD = 1;
const PPM = 2;

function baris(ubah: Partial<BarisPenunjukan> = {}): BarisPenunjukan {
  return {
    subkegiatanId: 10,
    rencanaId: null,
    kode: '5.1.2.2.01.1',
    nama: 'Analisis Kondisi Daerah',
    indikatorKinerja: 'Jumlah dokumen',
    targetAnjuran: 2,
    satuan: null,
    flagActive: true,
    bidangId: null,
    namaBidang: null,
    jumlahAktifitasUtama: 1,
    jumlahAktifitasPendukung: 3,
    dapatDitugaskan: true,
    adaRealisasi: false,
    ...ubah,
  };
}

/** Sudah ditugaskan ke satu bidang: rencanaId selalu ada bersama bidangId. */
function ditugaskan(bidangId: number, ubah: Partial<BarisPenunjukan> = {}) {
  return baris({ bidangId, rencanaId: 900 + bidangId, ...ubah });
}

describe('aksiPenunjukan', () => {
  it.each<[string, BarisPenunjukan, number | null, AksiPenunjukan]>([
    ['belum → bidang', baris(), P2EPD, 'tugaskan'],
    ['bidang A → bidang B', ditugaskan(P2EPD), PPM, 'pindah'],
    ['bidang → belum', ditugaskan(P2EPD), null, 'cabut'],
    ['bidang yang sama', ditugaskan(P2EPD), P2EPD, 'noop'],
    ['belum → belum', baris(), null, 'noop'],
  ])('%s', (_nama, row, tujuan, harapan) => {
    expect(aksiPenunjukan(row, tujuan)).toBe(harapan);
  });
});

describe('alasanTerkunci', () => {
  it('mengunci baris yang sudah punya realisasi', () => {
    expect(alasanTerkunci(ditugaskan(P2EPD, { adaRealisasi: true }))).toMatch(
      /realisasi/i,
    );
  });

  it('mengunci katalog tanpa utama atau pendukung aktif', () => {
    expect(
      alasanTerkunci(
        baris({ dapatDitugaskan: false, jumlahAktifitasPendukung: 0 }),
      ),
    ).toMatch(/pendukung/i);
  });

  it('membiarkan baris yang sehat', () => {
    expect(alasanTerkunci(baris())).toBeNull();
  });

  it('mendahulukan alasan realisasi daripada kelengkapan katalog', () => {
    const row = ditugaskan(P2EPD, {
      adaRealisasi: true,
      dapatDitugaskan: false,
    });
    expect(alasanTerkunci(row)).toMatch(/realisasi/i);
  });
});

describe('rencanaAksiKegiatan', () => {
  it('menugaskan kegiatan yang seluruhnya kosong lewat satu POST bulk', () => {
    const rows = [
      baris({ subkegiatanId: 1 }),
      baris({ subkegiatanId: 2 }),
      baris({ subkegiatanId: 3 }),
    ];

    expect(rencanaAksiKegiatan(rows, P2EPD)).toEqual({
      tugaskanIds: [1, 2, 3],
      pindahIds: [],
      cabutIds: [],
      dilewati: [],
    });
  });

  it('memisahkan yang belum ditugaskan dari yang perlu dipindah', () => {
    const rows = [
      baris({ subkegiatanId: 1 }),
      ditugaskan(PPM, { subkegiatanId: 2, rencanaId: 77 }),
      ditugaskan(P2EPD, { subkegiatanId: 3, rencanaId: 88 }),
    ];

    const rencana = rencanaAksiKegiatan(rows, P2EPD);

    expect(rencana.tugaskanIds).toEqual([1]);
    expect(rencana.pindahIds).toEqual([77]);
    // Yang sudah di bidang tujuan tidak ikut disentuh.
    expect(rencana.cabutIds).toEqual([]);
    expect(rencana.dilewati).toEqual([]);
  });

  it('mencabut seluruh isi kegiatan ketika tujuannya null', () => {
    const rows = [
      ditugaskan(P2EPD, { subkegiatanId: 1, rencanaId: 11 }),
      ditugaskan(P2EPD, { subkegiatanId: 2, rencanaId: 22 }),
    ];

    expect(rencanaAksiKegiatan(rows, null)).toMatchObject({
      tugaskanIds: [],
      pindahIds: [],
      cabutIds: [11, 22],
    });
  });

  it('melewati baris berrealisasi alih-alih memindahkannya paksa', () => {
    const rows = [
      baris({ subkegiatanId: 1 }),
      ditugaskan(PPM, {
        subkegiatanId: 2,
        rencanaId: 77,
        kode: '5.1.3.2.01.2',
        adaRealisasi: true,
      }),
    ];

    const rencana = rencanaAksiKegiatan(rows, P2EPD);

    expect(rencana.tugaskanIds).toEqual([1]);
    expect(rencana.pindahIds).toEqual([]);
    expect(rencana.dilewati).toEqual([
      { kode: '5.1.3.2.01.2', alasan: expect.stringMatching(/realisasi/i) },
    ]);
  });

  it('melewati katalog yang belum lengkap aktivitasnya', () => {
    const rows = [
      baris({ subkegiatanId: 1, kode: 'A', dapatDitugaskan: false }),
      baris({ subkegiatanId: 2, kode: 'B' }),
    ];

    const rencana = rencanaAksiKegiatan(rows, P2EPD);

    expect(rencana.tugaskanIds).toEqual([2]);
    expect(rencana.dilewati.map(d => d.kode)).toEqual(['A']);
  });

  it('tidak menghasilkan panggilan apa pun bila kegiatan sudah di bidang tujuan', () => {
    const rows = [
      ditugaskan(P2EPD, { subkegiatanId: 1, rencanaId: 11 }),
      ditugaskan(P2EPD, { subkegiatanId: 2, rencanaId: 22 }),
    ];

    expect(rencanaAksiKegiatan(rows, P2EPD)).toEqual({
      tugaskanIds: [],
      pindahIds: [],
      cabutIds: [],
      dilewati: [],
    });
  });
});

describe('bidangGrup', () => {
  it('mengembalikan bidang bersama ketika seragam', () => {
    expect(bidangGrup([ditugaskan(P2EPD), ditugaskan(P2EPD)])).toBe(P2EPD);
  });

  it('menandai campuran ketika anaknya berbeda bidang', () => {
    expect(bidangGrup([ditugaskan(P2EPD), ditugaskan(PPM)])).toBe('campuran');
  });

  it('menandai campuran ketika sebagian belum ditugaskan', () => {
    expect(bidangGrup([ditugaskan(P2EPD), baris()])).toBe('campuran');
  });

  it('mengembalikan null untuk kegiatan yang seluruhnya belum ditugaskan', () => {
    expect(bidangGrup([baris(), baris()])).toBeNull();
  });

  it('mengembalikan null untuk kegiatan kosong', () => {
    expect(bidangGrup([])).toBeNull();
  });
});

describe('ratakan', () => {
  it('mengumpulkan seluruh baris dari pohon program → kegiatan', () => {
    const program = [
      {
        kegiatan: [
          { subkegiatan: [baris({ subkegiatanId: 1 })] },
          { subkegiatan: [baris({ subkegiatanId: 2 })] },
        ],
      },
      { kegiatan: [{ subkegiatan: [baris({ subkegiatanId: 3 })] }] },
    ];

    expect(ratakan(program).map(b => b.subkegiatanId)).toEqual([1, 2, 3]);
  });
});
