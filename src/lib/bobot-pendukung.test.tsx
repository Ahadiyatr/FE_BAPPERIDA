import { describe, expect, it } from 'vitest';

import {
  alasanCentangTerkunci,
  bagiBobotPendukung,
  bobotSetelahToggle,
  pendukungDipakai,
} from '@/lib/bobot-pendukung';
import type { IndikatorBidang } from '@/services';

function akt(ubah: Partial<IndikatorBidang> & { id: number }): IndikatorBidang {
  return {
    subkegiatanBidangId: 1,
    masterIndikatorId: 10,
    flagAdhoc: false,
    dipakai: true,
    tipeAktifitas: 'PENDUKUNG',
    namaAktifitas: `Pendukung ${ubah.id}`,
    bobotTarget: 10,
    target: 1,
    realisasi: 0,
    bobotRealisasi: 0,
    urutan: ubah.id,
    ...ubah,
  };
}

const utama = akt({ id: 0, tipeAktifitas: 'UTAMA', bobotTarget: 70 });

describe('bagiBobotPendukung', () => {
  it.each<[number, number[]]>([
    [0, []],
    [1, [30]],
    [2, [15, 15]],
    [3, [10, 10, 10]],
    [4, [7.5, 7.5, 7.5, 7.5]],
  ])('membagi 30%% ke %i pendukung', (n, harapan) => {
    expect(bagiBobotPendukung(n)).toEqual(harapan);
  });

  it('menyisakan selisih pembulatan pada elemen terakhir, seperti backend', () => {
    const bobot = bagiBobotPendukung(7);
    expect(bobot).toEqual([4.29, 4.29, 4.29, 4.29, 4.29, 4.29, 4.26]);
    expect(bobot.reduce((a, b) => a + b, 0)).toBe(30);
  });

  it('selalu berjumlah tepat 30 untuk n 1..12', () => {
    for (let n = 1; n <= 12; n++) {
      const jumlah = bagiBobotPendukung(n).reduce((a, b) => a + b, 0);
      expect(Math.round(jumlah * 100) / 100).toBe(30);
    }
  });
});

describe('pendukungDipakai', () => {
  it('menyaring utama dan yang tidak dipakai', () => {
    const daftar = [utama, akt({ id: 1 }), akt({ id: 2, dipakai: false }), akt({ id: 3 })];
    expect(pendukungDipakai(daftar).map(a => a.id)).toEqual([1, 3]);
  });
});

describe('alasanCentangTerkunci', () => {
  const tiga = [utama, akt({ id: 1 }), akt({ id: 2 }), akt({ id: 3 })];

  it('membiarkan pendukung sehat saat periode DRAFT', () => {
    expect(alasanCentangTerkunci(tiga[1], tiga, true)).toBeNull();
  });

  it('mengunci aktivitas utama', () => {
    expect(alasanCentangTerkunci(utama, tiga, true)).toMatch(/utama/i);
  });

  it('mengunci saat periode bukan DRAFT', () => {
    expect(alasanCentangTerkunci(tiga[1], tiga, false)).toMatch(/DRAFT/);
  });

  it('mengunci pendukung yang sudah punya realisasi', () => {
    const daftar = [utama, akt({ id: 1, realisasi: 2 }), akt({ id: 2 })];
    expect(alasanCentangTerkunci(daftar[1], daftar, true)).toMatch(/realisasi/i);
  });

  it('mengunci pendukung dipakai terakhir', () => {
    const daftar = [utama, akt({ id: 1 }), akt({ id: 2, dipakai: false })];
    expect(alasanCentangTerkunci(daftar[1], daftar, true)).toMatch(/minimal satu/i);
  });

  it('tetap mengizinkan MENGAKTIFKAN kembali walau hanya satu yang dipakai', () => {
    const daftar = [utama, akt({ id: 1 }), akt({ id: 2, dipakai: false })];
    expect(alasanCentangTerkunci(daftar[2], daftar, true)).toBeNull();
  });

  it('tidak memblokir pengaktifan ulang baris yang punya realisasi lama', () => {
    // Backend hanya menolak realisasi saat MENONAKTIFKAN, jadi jangan lebih ketat di UI.
    const daftar = [utama, akt({ id: 1 }), akt({ id: 2, dipakai: false, realisasi: 5 })];
    expect(alasanCentangTerkunci(daftar[2], daftar, true)).toBeNull();
  });
});

describe('bobotSetelahToggle', () => {
  it('menaikkan bobot sisanya saat satu dinonaktifkan', () => {
    const daftar = [utama, akt({ id: 1 }), akt({ id: 2 }), akt({ id: 3 })];
    expect(bobotSetelahToggle(daftar, 2)).toEqual({
      sebelum: 10,
      sesudah: 15,
      jumlahSesudah: 2,
    });
  });

  it('menurunkan bobot sisanya saat satu diaktifkan kembali', () => {
    const daftar = [utama, akt({ id: 1 }), akt({ id: 2, dipakai: false }), akt({ id: 3 })];
    expect(bobotSetelahToggle(daftar, 2)).toEqual({
      sebelum: 15,
      sesudah: 10,
      jumlahSesudah: 3,
    });
  });
});
