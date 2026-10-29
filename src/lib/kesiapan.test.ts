import { describe, expect, it } from 'vitest';

import type { KesiapanBidang, Periode } from '@/services';
import {
  jumlahSubkegiatanKurang,
  pecahButir,
  syaratBukaPeriode,
  tahapKesiapan,
  urutkanKesiapan,
} from './kesiapan';

const bidang = (ubah: Partial<KesiapanBidang> & { bidangId: number; namaBidang: string }): KesiapanBidang => ({
  periodeId: 1,
  status: 'DRAFT',
  jumlahSubkegiatan: 4,
  jumlahLengkap: 4,
  jumlahTeragenda: 0,
  butir: [],
  ditandaiPada: null,
  ...ubah,
});

const periodeOpen: Periode = {
  id: 9, dokumenId: 1, namaPeriode: 'Triwulan IV 2026',
  tanggalMulai: '2026-10-01', tanggalSelesai: '2026-12-31', status: 'OPEN',
};

describe('tahapKesiapan', () => {
  it('memisahkan DRAFT yang masih cacat dari DRAFT yang tinggal ditandai', () => {
    expect(tahapKesiapan(bidang({ bidangId: 1, namaBidang: 'A', butir: ['5.01: target harus lebih dari nol.'] }))).toBe('kurang');
    expect(tahapKesiapan(bidang({ bidangId: 1, namaBidang: 'A' }))).toBe('menunggu');
    expect(tahapKesiapan(bidang({ bidangId: 1, namaBidang: 'A', status: 'SIAP' }))).toBe('siap');
  });
});

describe('urutkanKesiapan', () => {
  it('menaruh yang perlu ditindaklanjuti di atas, lalu urut nama', () => {
    const urut = urutkanKesiapan([
      bidang({ bidangId: 1, namaBidang: 'PPM', status: 'SIAP' }),
      bidang({ bidangId: 2, namaBidang: 'RINOVA' }),
      bidang({ bidangId: 3, namaBidang: 'PIK', butir: ['x'] }),
      bidang({ bidangId: 4, namaBidang: 'Keuangan', status: 'SIAP' }),
    ]);
    expect(urut.map(b => b.namaBidang)).toEqual(['PIK', 'RINOVA', 'Keuangan', 'PPM']);
  });
});

describe('pecahButir', () => {
  it('memisahkan kode subkegiatan dari pesannya', () => {
    expect(pecahButir('5.01.03.2.02.0001: target harus lebih dari nol.')).toEqual({
      kode: '5.01.03.2.02.0001',
      pesan: 'Target harus lebih dari nol.',
    });
  });

  it('membiarkan butir tingkat bidang tanpa kode', () => {
    expect(pecahButir('Belum ada subkegiatan yang dibagi ke bidang ini.')).toEqual({
      kode: null,
      pesan: 'Belum ada subkegiatan yang dibagi ke bidang ini.',
    });
  });
});

describe('jumlahSubkegiatanKurang', () => {
  it('menghitung subkegiatan berbeda, bukan jumlah butir', () => {
    const b = bidang({
      bidangId: 1,
      namaBidang: 'PIK',
      butir: [
        '5.01.03.2.02.0001: target harus lebih dari nol.',
        '5.01.03.2.02.0001: bobot aktivitas harus 70/30 dan berjumlah 100.',
        '5.01.03.2.02.0003: harus memiliki minimal satu aktivitas pendukung yang dipakai.',
      ],
    });
    expect(jumlahSubkegiatanKurang(b)).toBe(2);
  });
});

describe('syaratBukaPeriode', () => {
  it('menyebut bidang yang belum siap dan periode lain yang masih terbuka', () => {
    const syarat = syaratBukaPeriode(
      [
        bidang({ bidangId: 1, namaBidang: 'PPM', status: 'SIAP' }),
        bidang({ bidangId: 2, namaBidang: 'PIK', butir: ['x'] }),
      ],
      periodeOpen,
    );
    const [pembagian, siap, tunggal] = syarat;
    expect(pembagian.terpenuhi).toBe(true);
    expect(siap.terpenuhi).toBe(false);
    expect(siap.keterangan).toContain('PIK');
    expect(siap.hitungan).toBe('1 dari 2');
    expect(tunggal.terpenuhi).toBe(false);
    expect(tunggal.keterangan).toContain('Triwulan IV 2026');
  });

  it('tidak menganggap papan kosong sebagai "semua siap"', () => {
    const syarat = syaratBukaPeriode([], null);
    expect(syarat.find(s => s.kunci === 'pembagian')?.terpenuhi).toBe(false);
    expect(syarat.find(s => s.kunci === 'siap')?.terpenuhi).toBe(false);
  });
});
