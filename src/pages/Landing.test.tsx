// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import Landing from './Landing';

const getLandingPublik = vi.fn();

vi.mock('../services/public-dashboard.service', () => ({
  getLandingPublik: () => getLandingPublik(),
}));

const landingTerisi = {
  periode: { id: 1, nama_periode: 'Triwulan IV 2026', status: 'LOCKED' },
  summary: { jumlah_bidang: 2, jumlah_program: 1, jumlah_subkegiatan: 3, jumlah_aktifitas: 12, rata_capaian_subkegiatan: 75.83, capaian_pd: 75.83 },
  bidang: [
    { bidang_id: 1, nama_bidang: 'P2EPD', jumlah_subkegiatan: 2, capaian_bidang: 63.75 },
    { bidang_id: 2, nama_bidang: 'PPM', jumlah_subkegiatan: 1, capaian_bidang: 100 },
  ],
  distribusi: [
    { bidang_id: 1, nama_bidang: 'P2EPD', persentase: 66.67 },
    { bidang_id: 2, nama_bidang: 'PPM', persentase: 33.33 },
  ],
  radar: [],
  program: [
    { kode_program: '5.01.01', nama_program: 'PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH KABUPATEN/KOTA', jumlah_subkegiatan: 2, capaian: 0 },
    { kode_program: '5.01.03', nama_program: 'PROGRAM KOORDINASI DAN SINKRONISASI PERENCANAAN PEMBANGUNAN DAERAH', jumlah_subkegiatan: 1, capaian: 3.85 },
  ],
  realisasi_bulanan: [
    { bulan: '2026-10', jumlah: 5, sudah_berjalan: true },
    { bulan: '2026-11', jumlah: 12, sudah_berjalan: true },
    { bulan: '2026-12', jumlah: 0, sudah_berjalan: false },
  ],
  sebaran_capaian: [
    { rentang: '0', jumlah: 0 },
    { rentang: '1-24', jumlah: 0 },
    { rentang: '25-49', jumlah: 1 },
    { rentang: '50-74', jumlah: 1 },
    { rentang: '75-99', jumlah: 0 },
    { rentang: '100', jumlah: 1 },
  ],
};

beforeAll(() => {
  // Recharts ResponsiveContainer membutuhkan ResizeObserver yang tidak ada di jsdom.
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  getLandingPublik.mockReset();
  getLandingPublik.mockResolvedValue(landingTerisi);
});

afterEach(cleanup);

function LokasiSaatIni() {
  const lokasi = useLocation();
  return <p>lokasi: {lokasi.pathname}{lokasi.search}</p>;
}

describe('Landing publik — format angka', () => {
  it('memakai format Indonesia satu desimal seperti layar admin', async () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(await screen.findByLabelText('Capaian keseluruhan 75,8%')).toBeTruthy();
    expect(screen.getAllByText('63,8%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100,0%').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/\d\.\d+%/);
  });

  it('menyebut periode yang sedang ditampilkan beserta statusnya', async () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(await screen.findByText('Triwulan IV 2026')).toBeTruthy();
    expect(screen.getByText('Sudah dikunci')).toBeTruthy();
  });
});

describe('Landing publik — capaian per program', () => {
  it('menampilkan nama program dalam huruf judul beserta persentasenya, tanpa kode program', async () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    const bagian = (await screen.findByText('Capaian Per Program')).closest('section') as HTMLElement;
    expect(within(bagian).getByText('Program Koordinasi dan Sinkronisasi Perencanaan Pembangunan Daerah')).toBeTruthy();
    expect(within(bagian).getByText('Program Penunjang Urusan Pemerintahan Daerah Kabupaten/Kota')).toBeTruthy();
    // persen1 membulatkan setengah ke atas: 3,85 → 3,9%.
    expect(within(bagian).getByText('3,9%')).toBeTruthy();
    expect(within(bagian).getByText('Berjalan')).toBeTruthy();
    expect(bagian.textContent).not.toMatch(/5\.01\.0\d/);
  });

  it('menyembunyikan bagian program bila daftar program kosong', async () => {
    getLandingPublik.mockResolvedValue({ ...landingTerisi, program: [] });

    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(await screen.findByText('Capaian Per Bidang')).toBeTruthy();
    expect(screen.queryByText('Capaian Per Program')).toBeNull();
  });
});

describe('Landing publik — realisasi per bulan', () => {
  it('menjumlahkan hanya bulan yang sudah berjalan dan menyebut bulan tersibuk', async () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    const ringkasan = await screen.findByLabelText('Ringkasan realisasi per bulan');
    expect(within(ringkasan).getByText('17')).toBeTruthy();
    expect(within(ringkasan).getByText('November 2026')).toBeTruthy();
    expect(within(ringkasan).getByText('2/3')).toBeTruthy();
  });

  it('menjelaskan grafik kosong saat belum ada bulan yang berjalan', async () => {
    getLandingPublik.mockResolvedValue({
      ...landingTerisi,
      realisasi_bulanan: [
        { bulan: '2027-01', jumlah: 0, sudah_berjalan: false },
        { bulan: '2027-02', jumlah: 0, sudah_berjalan: false },
      ],
    });

    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(await screen.findByText(/Belum ada bulan dalam periode ini yang sudah berjalan/)).toBeTruthy();
    expect(within(screen.getByLabelText('Ringkasan realisasi per bulan')).getByText('–')).toBeTruthy();
  });

  it('menyembunyikan bagian realisasi dan sebaran bila backend belum mengirimnya', async () => {
    // Respons backend lama: tanpa kunci realisasi_bulanan & sebaran_capaian.
    const tanpaDataBaru: Partial<typeof landingTerisi> = { ...landingTerisi };
    delete tanpaDataBaru.realisasi_bulanan;
    delete tanpaDataBaru.sebaran_capaian;
    getLandingPublik.mockResolvedValue(tanpaDataBaru);

    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(await screen.findByText('Capaian Per Bidang')).toBeTruthy();
    expect(screen.queryByText('Ritme Kerja Sepanjang Tahun')).toBeNull();
    expect(screen.queryByText('Sebaran Capaian Subkegiatan')).toBeNull();
  });
});

describe('Landing publik — sebaran capaian', () => {
  it('meringkas subkegiatan menjadi belum dimulai, berjalan, dan tuntas', async () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    const ringkasan = await screen.findByLabelText('Ringkasan sebaran capaian');
    const angkaDi = (label: string) => within(ringkasan).getByText(label).previousElementSibling?.textContent;
    expect(angkaDi('Belum dimulai')).toBe('0');
    expect(angkaDi('Berjalan')).toBe('2');
    expect(angkaDi('Tuntas')).toBe('1');
  });
});

describe('Landing publik — daftar bidang', () => {
  it('membuka halaman detail bidang yang dipilih', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/detail" element={<LokasiSaatIni />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Lihat detail PPM' }));

    expect(screen.getByText('lokasi: /detail?bidang=2')).toBeTruthy();
  });
});

describe('Landing publik — header', () => {
  it('memakai lambang Kabupaten Tabalong sebagai logo', async () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    const logo = await screen.findByRole('img', { name: 'Lambang Kabupaten Tabalong' });
    expect(logo.getAttribute('src')).toMatch(/logo-tabalong/);
  });
});

describe('Landing publik — footer', () => {
  it('memuat hak cipta Bapperida Pemerintah Kabupaten Tabalong', async () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(await screen.findByText('© 2026 · Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah')).toBeTruthy();
    expect(screen.getByText('Pemerintah Kabupaten Tabalong')).toBeTruthy();
  });
});

describe('Landing publik — belum ada periode dipublikasikan', () => {
  it('menampilkan keadaan kosong, bukan capaian 0,0% dan grafik kosong', async () => {
    getLandingPublik.mockResolvedValue({
      periode: null,
      summary: null,
      bidang: [],
      distribusi: [],
      radar: [],
      program: [],
      realisasi_bulanan: [],
      sebaran_capaian: [],
    });

    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(await screen.findByText('Belum ada periode kinerja yang dipublikasikan')).toBeTruthy();
    expect(screen.queryByText('0,0%')).toBeNull();
    expect(screen.queryByText(/Capaian Keseluruhan/)).toBeNull();
    expect(screen.queryByText('Capaian Per Bidang')).toBeNull();
  });
});
