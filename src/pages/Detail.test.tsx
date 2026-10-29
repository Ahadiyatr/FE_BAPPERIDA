// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Detail from './Detail';

const getDetailBidangPublik = vi.fn();

vi.mock('../services/public-dashboard.service', () => ({
  getDetailBidangPublik: (id: string) => getDetailBidangPublik(id),
}));

const detailTerisi = {
  periode: { id: 1, nama_periode: 'Triwulan IV 2026', status: 'LOCKED' },
  header: { bidang_id: 1, nama_bidang: 'P2EPD', jumlah_subkegiatan: 3, capaian_bidang: 63.75 },
  rincian: [
    { id: 1, kode_subkegiatan: '9.9.1.1.01.1', nama_subkegiatan: 'Subkegiatan Uji S1', indikator_kinerja: 'Jumlah dokumen', target: 10, satuan: 'Dokumen', capaian: 92.5 },
    { id: 2, kode_subkegiatan: '9.9.1.1.01.2', nama_subkegiatan: 'Subkegiatan Uji S2', indikator_kinerja: null, target: 4, satuan: null, capaian: 35 },
    { id: 3, kode_subkegiatan: '9.9.1.1.01.3', nama_subkegiatan: 'Subkegiatan Uji S3', indikator_kinerja: null, target: 0, satuan: null, capaian: 0 },
  ],
};

beforeEach(() => {
  getDetailBidangPublik.mockReset();
  getDetailBidangPublik.mockResolvedValue(detailTerisi);
});

afterEach(cleanup);

const tampilkan = (url = '/detail?bidang=1') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/" element={<p>halaman landing</p>} />
        <Route path="/detail" element={<Detail />} />
      </Routes>
    </MemoryRouter>,
  );

describe('Detail bidang publik — format angka', () => {
  it('memakai format Indonesia satu desimal seperti layar admin', async () => {
    tampilkan();

    expect(await screen.findByText('92,5%')).toBeTruthy();
    expect(screen.getByText('35,0%')).toBeTruthy();
    expect(screen.getByLabelText('Capaian bidang 63,8%')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\d\.\d+%/);
  });
});

describe('Detail bidang publik — isi', () => {
  it('menyebut bidang, periode, dan ringkasan status subkegiatan', async () => {
    tampilkan();

    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByText('Triwulan IV 2026')).toBeTruthy();
    const ringkasan = screen.getByLabelText('Ringkasan status subkegiatan');
    const angkaDi = (label: string) => within(ringkasan).getByText(label).previousElementSibling?.textContent;
    expect(angkaDi('Subkegiatan')).toBe('3');
    expect(angkaDi('Belum dimulai')).toBe('1');
    expect(angkaDi('Berjalan')).toBe('2');
    expect(angkaDi('Tuntas')).toBe('0');
  });

  it('menampilkan indikator kinerja saja, tanpa kode subkegiatan dan target', async () => {
    tampilkan();

    expect(await screen.findByText('Jumlah dokumen')).toBeTruthy();
    expect(document.body.textContent).not.toContain('9.9.1.1.01');
    expect(document.body.textContent).not.toMatch(/Target|Tanpa target/);
  });

  it('memakai header dan footer yang sama dengan landing', async () => {
    tampilkan();

    expect(await screen.findByRole('img', { name: 'Lambang Kabupaten Tabalong' })).toBeTruthy();
    expect(screen.getByText('Pemerintah Kabupaten Tabalong')).toBeTruthy();
  });

  it('kembali ke landing lewat tautan di baris menu', async () => {
    tampilkan();

    fireEvent.click(await screen.findByRole('link', { name: /Kembali ke dashboard/ }));

    expect(screen.getByText('halaman landing')).toBeTruthy();
  });
});

describe('Detail bidang publik — badge status', () => {
  it('membedakan Tuntas dari Berjalan', async () => {
    getDetailBidangPublik.mockResolvedValue({
      ...detailTerisi,
      rincian: [
        { ...detailTerisi.rincian[0], capaian: 100 },
        { ...detailTerisi.rincian[1], capaian: 35 },
      ],
    });
    tampilkan();

    const tuntas = await screen.findByText('Tuntas', { selector: '.lp-badge' });
    const berjalan = screen.getAllByText('Berjalan', { selector: '.lp-badge' })[0];
    expect(tuntas.classList.contains('lp-tuntas')).toBe(true);
    expect(berjalan.classList.contains('lp-tuntas')).toBe(false);
  });
});

describe('Detail bidang publik — keadaan gagal', () => {
  it('memberi tahu bila bidang tidak ditentukan', async () => {
    tampilkan('/detail');

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Bidang tidak ditentukan.')).toBeTruthy();
    expect(getDetailBidangPublik).not.toHaveBeenCalled();
  });
});
