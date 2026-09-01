// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RencanaBidang from './RencanaBidang';
import type { IndikatorBidang, RencanaBidangDetail } from '@/services';

const getRencanaBidang = vi.fn();
const periksaKesiapan = vi.fn();
const getKatalogTersedia = vi.fn();
const setDipakaiAktifitas = vi.fn();
const hapusAktifitasDariRencana = vi.fn();

vi.mock('@/services', () => ({
  getRencanaBidang: (...a: unknown[]) => getRencanaBidang(...a),
  periksaKesiapan: (...a: unknown[]) => periksaKesiapan(...a),
  getKatalogTersedia: (...a: unknown[]) => getKatalogTersedia(...a),
  setDipakaiAktifitas: (...a: unknown[]) => setDipakaiAktifitas(...a),
  hapusAktifitasDariRencana: (...a: unknown[]) => hapusAktifitasDariRencana(...a),
  getPeriode: vi.fn(),
  cabutSubkegiatanDariRencana: vi.fn(),
  tambahAktifitasKeRencana: vi.fn(),
  tambahSubkegiatanKeRencana: vi.fn(),
  tandaiKesiapan: vi.fn(),
  ubahTargetAktifitas: vi.fn(),
  ubahTargetSubkegiatan: vi.fn(),
}));

function akt(ubah: Partial<IndikatorBidang> & { id: number }): IndikatorBidang {
  return {
    subkegiatanBidangId: 1,
    masterIndikatorId: 10 + ubah.id,
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

function detail(
  aktifitas: IndikatorBidang[],
  status: 'DRAFT' | 'OPEN' = 'DRAFT',
): RencanaBidangDetail {
  return {
    bidang: { id: 9, kode: '9', namaBidang: 'P2EPD', flagActive: true },
    periode: {
      id: 4,
      dokumenId: 1,
      namaPeriode: 'TW Uji',
      tanggalMulai: '2026-04-01',
      tanggalSelesai: '2026-06-30',
      status,
    },
    status: 'DRAFT',
    baris: [
      {
        subkegiatanBidang: {
          id: 1,
          periodeId: 4,
          bidangId: 9,
          indikatorUtamaId: 5,
          indikatorKinerja: 'Jumlah dokumen',
          target: 2,
          satuan: 'Dokumen',
          capaian: 0,
        },
        namaSubkegiatan: 'Pengelolaan Data Kelitbangan',
        kodeSubkegiatan: '5.5.2.2.01.12',
        aktifitas,
      },
    ],
  };
}

function pasang() {
  render(
    <MemoryRouter initialEntries={['/rencana/9?periode=4']}>
      <Routes>
        <Route path="/rencana/:bidangId" element={<RencanaBidang />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Checkbox pendukung, urut sesuai baris di daftar aktivitas. */
const checkboxPendukung = () => screen.getAllByRole('checkbox');

const utama = akt({ id: 0, tipeAktifitas: 'UTAMA', bobotTarget: 70, namaAktifitas: 'Aktivitas utama' });

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom tidak mengimplementasikan scrollIntoView; halaman ini memakainya untuk
  // menggulirkan navigator ke subkegiatan terpilih.
  Element.prototype.scrollIntoView = vi.fn();
  periksaKesiapan.mockResolvedValue({
    butir: [],
    jumlahMenghalangi: 0,
    bolehTandaiSiap: true,
  });
  getKatalogTersedia.mockResolvedValue([]);
});

afterEach(cleanup);

describe('RencanaBidang — pakai/tidak pakai aktivitas pendukung', () => {
  it('melepas centang memanggil setDipakaiAktifitas(id, false)', async () => {
    getRencanaBidang.mockResolvedValue(
      detail([utama, akt({ id: 1 }), akt({ id: 2 }), akt({ id: 3 })]),
    );
    setDipakaiAktifitas.mockResolvedValue(undefined);

    pasang();
    await screen.findByText('Pendukung 2');

    await userEvent.click(checkboxPendukung()[1]);

    await waitFor(() =>
      expect(setDipakaiAktifitas).toHaveBeenCalledWith(2, false),
    );
  });

  it('memasang centang kembali memanggil setDipakaiAktifitas(id, true)', async () => {
    getRencanaBidang.mockResolvedValue(
      detail([utama, akt({ id: 1 }), akt({ id: 2, dipakai: false, bobotTarget: 0 })]),
    );
    setDipakaiAktifitas.mockResolvedValue(undefined);

    pasang();
    await screen.findByText('Pendukung 2');

    await userEvent.click(checkboxPendukung()[1]);

    await waitFor(() =>
      expect(setDipakaiAktifitas).toHaveBeenCalledWith(2, true),
    );
  });

  it('tidak memberi checkbox pada aktivitas utama', async () => {
    getRencanaBidang.mockResolvedValue(detail([utama, akt({ id: 1 }), akt({ id: 2 })]));

    pasang();
    await screen.findByText('Aktivitas utama');

    // Dua pendukung → dua checkbox; utama tidak ikut.
    expect(checkboxPendukung()).toHaveLength(2);
  });

  it('mengunci centang terakhir yang masih dipakai', async () => {
    getRencanaBidang.mockResolvedValue(
      detail([utama, akt({ id: 1 }), akt({ id: 2, dipakai: false, bobotTarget: 0 })]),
    );

    pasang();
    await screen.findByText('Pendukung 1');

    const [satuSatunya, yangNonaktif] = checkboxPendukung();
    expect((satuSatunya as HTMLButtonElement).disabled).toBe(true);
    expect(satuSatunya.getAttribute('title')).toMatch(/minimal satu/i);
    // Yang nonaktif tetap bisa dipakai kembali.
    expect((yangNonaktif as HTMLButtonElement).disabled).toBe(false);
  });

  it('mengunci pendukung yang sudah punya realisasi', async () => {
    getRencanaBidang.mockResolvedValue(
      detail([utama, akt({ id: 1, realisasi: 3 }), akt({ id: 2 })]),
    );

    pasang();
    await screen.findByText('Pendukung 1');

    const kotak = checkboxPendukung()[0] as HTMLButtonElement;
    expect(kotak.disabled).toBe(true);
    expect(kotak.getAttribute('title')).toMatch(/realisasi/i);
  });

  it('mengunci seluruh centang saat periode bukan DRAFT', async () => {
    getRencanaBidang.mockResolvedValue(
      detail([utama, akt({ id: 1 }), akt({ id: 2 })], 'OPEN'),
    );

    pasang();
    await screen.findByText('Pendukung 1');

    for (const kotak of checkboxPendukung())
      expect((kotak as HTMLButtonElement).disabled).toBe(true);
  });

  it('menandai baris tak-dipakai dengan bobot "—" dan target terkunci', async () => {
    getRencanaBidang.mockResolvedValue(
      detail([
        utama,
        akt({ id: 1, bobotTarget: 30 }),
        akt({ id: 2, dipakai: false, bobotTarget: 0 }),
      ]),
    );

    pasang();
    await screen.findByText('Pendukung 2');

    expect(screen.getByText('1 tidak dipakai periode ini')).toBeTruthy();
    // Bobot ditulis "—", bukan "0,0%", supaya tidak terbaca sebagai capaian nol.
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText('0,0%')).toBeNull();
  });

  it('tombol hapus tetap hanya untuk ad-hoc', async () => {
    getRencanaBidang.mockResolvedValue(
      detail([utama, akt({ id: 1 }), akt({ id: 2, flagAdhoc: true })]),
    );

    pasang();
    await screen.findByText('Pendukung 2');

    const hapus = screen.getAllByTitle(/hapus aktivitas ad-hoc/i);
    expect(hapus).toHaveLength(1);
  });
});
