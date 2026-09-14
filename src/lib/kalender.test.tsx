import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bulanDariKunci,
  bulanPeriode,
  dalamRentang,
  dariKunci,
  geserBulan,
  jendelaGrid,
  kunciDariBulan,
  kunciTanggal,
  labelBulan,
  rentangKunci,
  ringkasSel,
  susunGridBulan,
  tanggalGrid,
} from '@/lib/kalender';
import type { AgendaKegiatan, RealisasiKalender } from '@/services/types';

function agenda(ubah: Partial<AgendaKegiatan> = {}): AgendaKegiatan {
  return {
    id: 1,
    aktifitasBidangId: 7,
    judulAgenda: 'Rapat koordinasi',
    tanggalMulai: '2026-02-10',
    tanggalSelesai: '2026-02-10',
    jumlahRencana: 1,
    lokasi: '',
    keterangan: '',
    status: 'RENCANA',
    terlewat: false,
    logEntryName: 'Admin',
    konteks: null,
    ...ubah,
  };
}

function realisasi(ubah: Partial<RealisasiKalender> = {}): RealisasiKalender {
  return {
    id: 90,
    aktifitasBidangId: 7,
    tanggalKegiatan: '2026-02-11',
    jumlahRealisasi: 1,
    keterangan: '',
    logEntryName: 'Admin',
    jumlahLampiran: 2,
    konteks: null,
    ...ubah,
  };
}

const FEB = { tahun: 2026, bulan: 2 };

describe('kunciTanggal / dariKunci', () => {
  const env = (globalThis as typeof globalThis & {
    process: { env: Record<string, string | undefined> };
  }).process.env;
  const zonaWaktuAwal = env.TZ;

  beforeAll(() => {
    env.TZ = 'Asia/Makassar';
  });

  afterAll(() => {
    if (zonaWaktuAwal === undefined) delete env.TZ;
    else env.TZ = zonaWaktuAwal;
  });

  it('mengikuti tanggal WITA pada awal hari dan pergantian bulan/tahun', () => {
    expect(kunciTanggal(new Date('2026-09-12T16:30:00.000Z'))).toBe('2026-09-13');
    expect(kunciTanggal(new Date('2026-09-13T15:59:59.000Z'))).toBe('2026-09-13');
    expect(kunciTanggal(new Date('2026-09-30T16:30:00.000Z'))).toBe('2026-10-01');
    expect(kunciTanggal(new Date('2026-12-31T16:30:00.000Z'))).toBe('2027-01-01');
  });

  it('tidak menggeser hari berapa pun jam lokalnya (jebakan WIB)', () => {
    expect(kunciTanggal(new Date(2026, 1, 10, 0, 0, 0))).toBe('2026-02-10');
    expect(kunciTanggal(new Date(2026, 1, 10, 23, 59, 59))).toBe('2026-02-10');
  });

  it('menambal nol di bulan dan tanggal satu digit', () => {
    expect(kunciTanggal(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('dariKunci menghasilkan tengah malam lokal, bukan UTC', () => {
    const d = dariKunci('2026-02-10');
    expect(d.getDate()).toBe(10);
    expect(d.getMonth()).toBe(1);
    expect(d.getHours()).toBe(0);
  });

  it('bolak-balik lewat kunci tidak kehilangan tanggal', () => {
    expect(kunciTanggal(dariKunci('2026-03-01'))).toBe('2026-03-01');
  });
});

describe('bulanDariKunci / kunciDariBulan / geserBulan', () => {
  it('menerima kunci bulan maupun kunci tanggal penuh', () => {
    expect(bulanDariKunci('2026-02')).toEqual(FEB);
    expect(bulanDariKunci('2026-02-10')).toEqual(FEB);
  });

  it('kunciDariBulan menambal nol', () => {
    expect(kunciDariBulan({ tahun: 2026, bulan: 2 })).toBe('2026-02');
  });

  it('geserBulan melewati batas tahun di kedua arah', () => {
    expect(geserBulan({ tahun: 2026, bulan: 12 }, 1)).toEqual({ tahun: 2027, bulan: 1 });
    expect(geserBulan({ tahun: 2026, bulan: 1 }, -1)).toEqual({ tahun: 2025, bulan: 12 });
  });
});

describe('jendelaGrid', () => {
  it('memundurkan ke Senin dan memajukan ke Minggu', () => {
    // 1 Feb 2026 hari Minggu, 28 Feb hari Sabtu.
    expect(jendelaGrid(FEB)).toEqual({ dari: '2026-01-26', sampai: '2026-03-01' });
  });

  it('tidak menambah sel bocoran saat bulan sudah mulai Senin', () => {
    // 1 Jun 2026 hari Senin.
    expect(jendelaGrid({ tahun: 2026, bulan: 6 }).dari).toBe('2026-06-01');
  });

  it('cocok dengan rentang yang dihitung backend untuk bulan yang sama', () => {
    // Dipaku bersama JadwalKegiatanTest::test_kalender_mengembalikan_jendela_pekan_penuh_mulai_senin.
    const { dari, sampai } = jendelaGrid(FEB);
    expect(dari).toBe('2026-01-26');
    expect(sampai).toBe('2026-03-01');
  });
});

describe('tanggalGrid', () => {
  it('panjangnya selalu kelipatan 7', () => {
    for (const bulan of [1, 2, 6, 11, 12]) {
      expect(tanggalGrid({ tahun: 2026, bulan }).length % 7).toBe(0);
    }
  });

  it('memuat seluruh hari bulan itu', () => {
    const grid = tanggalGrid(FEB);
    expect(grid).toContain('2026-02-01');
    expect(grid).toContain('2026-02-28');
  });

  it('menangani Februari kabisat', () => {
    expect(tanggalGrid({ tahun: 2028, bulan: 2 })).toContain('2028-02-29');
  });
});

describe('dalamRentang / rentangKunci', () => {
  it('dalamRentang inklusif di kedua ujung', () => {
    expect(dalamRentang('2026-01-01', '2026-01-01', '2026-03-31')).toBe(true);
    expect(dalamRentang('2026-03-31', '2026-01-01', '2026-03-31')).toBe(true);
    expect(dalamRentang('2026-04-01', '2026-01-01', '2026-03-31')).toBe(false);
  });

  it('memotong agenda ke batas jendela', () => {
    expect(rentangKunci('2026-01-28', '2026-02-03', '2026-02-01', '2026-02-28')).toEqual([
      '2026-02-01',
      '2026-02-02',
      '2026-02-03',
    ]);
  });

  it('mengembalikan daftar kosong saat agenda tidak menyinggung jendela', () => {
    expect(rentangKunci('2026-05-01', '2026-05-02', '2026-02-01', '2026-02-28')).toEqual([]);
  });
});

describe('susunGridBulan', () => {
  const dasar = {
    bulan: FEB,
    agenda: [] as AgendaKegiatan[],
    realisasi: [] as RealisasiKalender[],
    periodeMulai: '2026-01-01',
    periodeSelesai: '2026-03-31',
    hariIni: '2026-02-15',
  };

  const cari = (baris: ReturnType<typeof susunGridBulan>, kunci: string) =>
    baris.flat().find((s) => s.kunci === kunci)!;

  it('memecah jendela menjadi baris pekan berisi 7 sel', () => {
    const baris = susunGridBulan(dasar);
    expect(baris.every((p) => p.length === 7)).toBe(true);
  });

  it('menaruh agenda multi-hari di SETIAP sel yang disinggung', () => {
    const baris = susunGridBulan({
      ...dasar,
      agenda: [agenda({ tanggalMulai: '2026-02-10', tanggalSelesai: '2026-02-12' })],
    });

    expect(cari(baris, '2026-02-10').agenda.length).toBe(1);
    expect(cari(baris, '2026-02-11').agenda.length).toBe(1);
    expect(cari(baris, '2026-02-12').agenda.length).toBe(1);
    expect(cari(baris, '2026-02-13').agenda.length).toBe(0);
    // Objek yang sama, bukan salinan — karena itu konsumen wajib meng-key dengan id.
    expect(cari(baris, '2026-02-10').agenda[0]).toBe(cari(baris, '2026-02-12').agenda[0]);
  });

  it('memotong agenda yang mulai sebelum jendela', () => {
    const baris = susunGridBulan({
      ...dasar,
      agenda: [agenda({ tanggalMulai: '2026-01-20', tanggalSelesai: '2026-01-27' })],
    });

    // 26 & 27 Jan ada di jendela (sel bocoran); 20 Jan di luar dan tidak punya sel.
    expect(cari(baris, '2026-01-26').agenda.length).toBe(1);
    expect(cari(baris, '2026-01-27').agenda.length).toBe(1);
    expect(baris.flat().some((s) => s.kunci === '2026-01-20')).toBe(false);
  });

  it('menempatkan realisasi di tanggal kegiatannya', () => {
    const baris = susunGridBulan({ ...dasar, realisasi: [realisasi()] });
    expect(cari(baris, '2026-02-11').realisasi.length).toBe(1);
    expect(cari(baris, '2026-02-10').realisasi.length).toBe(0);
  });

  it('menandai sel di luar periode', () => {
    const baris = susunGridBulan({ ...dasar, periodeMulai: '2026-02-05', periodeSelesai: '2026-02-20' });
    expect(cari(baris, '2026-02-04').dalamPeriode).toBe(false);
    expect(cari(baris, '2026-02-05').dalamPeriode).toBe(true);
    expect(cari(baris, '2026-02-21').dalamPeriode).toBe(false);
  });

  it('menandai tepat satu sel sebagai hari ini', () => {
    const baris = susunGridBulan(dasar);
    expect(baris.flat().filter((s) => s.hariIni).map((s) => s.kunci)).toEqual(['2026-02-15']);
  });

  it('membedakan sel bulan ini dari sel bocoran', () => {
    const baris = susunGridBulan(dasar);
    expect(cari(baris, '2026-01-26').bulanIni).toBe(false);
    expect(cari(baris, '2026-02-01').bulanIni).toBe(true);
    expect(cari(baris, '2026-03-01').bulanIni).toBe(false);
  });

  it('menandai akhir pekan', () => {
    const baris = susunGridBulan(dasar);
    expect(cari(baris, '2026-02-07').akhirPekan).toBe(true); // Sabtu
    expect(cari(baris, '2026-02-09').akhirPekan).toBe(false); // Senin
  });
});

describe('bulanPeriode', () => {
  it('menghasilkan tiga bulan untuk periode triwulan', () => {
    expect(bulanPeriode('2026-01-01', '2026-03-31')).toEqual([
      { tahun: 2026, bulan: 1 },
      { tahun: 2026, bulan: 2 },
      { tahun: 2026, bulan: 3 },
    ]);
  });

  it('menghasilkan satu bulan saat periode berada di dalam satu bulan', () => {
    expect(bulanPeriode('2026-02-05', '2026-02-20')).toEqual([FEB]);
  });

  it('melewati batas tahun', () => {
    expect(bulanPeriode('2026-12-01', '2027-01-31')).toEqual([
      { tahun: 2026, bulan: 12 },
      { tahun: 2027, bulan: 1 },
    ]);
  });
});

describe('labelBulan / ringkasSel', () => {
  it('labelBulan memakai nama bulan Indonesia', () => {
    expect(labelBulan(FEB)).toMatch(/Februari/);
    expect(labelBulan(FEB)).toMatch(/2026/);
  });

  it('ringkasSel mendeteksi agenda terlewat', () => {
    const baris = susunGridBulan({
      bulan: FEB,
      agenda: [agenda({ terlewat: true }), agenda({ id: 2 })],
      realisasi: [realisasi({ tanggalKegiatan: '2026-02-10' })],
      periodeMulai: '2026-01-01',
      periodeSelesai: '2026-03-31',
      hariIni: '2026-02-15',
    });
    const sel = baris.flat().find((s) => s.kunci === '2026-02-10')!;

    expect(ringkasSel(sel)).toEqual({ jumlahAgenda: 2, jumlahRealisasi: 1, adaTerlewat: true });
  });
});
