// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPeriode: vi.fn(),
  getBidang: vi.fn(),
  getBuktiByBidang: vi.fn(),
  hapusLampiran: vi.fn(),
  uploadLampiran: vi.fn(),
}));

const sesi = vi.hoisted(() => ({
  current: { peran: 'admin_bidang', bidangId: 1 } as {
    peran: 'admin_aplikasi' | 'admin_bidang';
    bidangId: number | null;
  },
}));

vi.mock('@/services', () => mocks);
vi.mock('@/lib/peran', () => ({ usePeran: () => sesi.current }));
// Thumbnail menarik blob ber-auth; di tes cukup ganti dengan <img> biasa.
vi.mock('@/components/AuthedMedia', () => ({
  AuthedImage: ({ alt }: { alt?: string }) => <img alt={alt} />,
  DocumentPreview: () => null,
  downloadAuthedFile: vi.fn(),
}));

import BuktiKegiatan from './BuktiKegiatan';

const periode = {
  id: 9,
  dokumenId: 1,
  namaPeriode: 'Triwulan III 2026',
  tanggalMulai: '2026-07-01',
  tanggalSelesai: '2026-09-30',
  status: 'OPEN' as const,
};

const foto = (id: number, realisasiId: number) => ({
  id,
  realisasiId,
  tipeBerkas: 'FOTO' as const,
  namaBerkas: `foto-${id}.jpg`,
  pathBerkas: '',
  ukuranByte: 2048,
});

function catatan(
  realisasiId: number,
  namaAktifitas: string,
  kode: string,
  lampirans: ReturnType<typeof foto>[],
) {
  return {
    realisasiId,
    tanggalKegiatan: '2026-09-03',
    jumlahRealisasi: 2,
    keterangan: '',
    logEntryName: 'Admin Keuangan',
    namaAktifitas,
    kodeSubkegiatan: kode,
    namaSubkegiatan: `Subkegiatan ${kode}`,
    lampirans,
  };
}

const data = [
  catatan(1, 'Membuat SPM Gaji', '5.1.1.2.02.1', [foto(11, 1), foto(12, 1)]),
  catatan(2, 'Menghitung Pajak TER', '5.1.1.2.02.1', []),
  catatan(3, 'Rekapitulasi Pengembalian Belanja', '5.1.1.2.02.7', []),
];

function renderHalaman() {
  return render(
    <MemoryRouter>
      <BuktiKegiatan />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sesi.current = { peran: 'admin_bidang', bidangId: 1 };
  mocks.getPeriode.mockResolvedValue([periode]);
  mocks.getBidang.mockResolvedValue([]);
  mocks.getBuktiByBidang.mockResolvedValue(data);
});

afterEach(cleanup);

const tombolSaring = (nama: RegExp) =>
  within(screen.getByRole('group', { name: 'Saring catatan' })).getByRole(
    'button',
    { name: nama },
  );

it('mengelompokkan catatan per subkegiatan dengan meter berbukti', async () => {
  renderHalaman();

  expect(await screen.findByText('Subkegiatan 5.1.1.2.02.1')).toBeTruthy();
  expect(screen.getByText('Subkegiatan 5.1.1.2.02.7')).toBeTruthy();
  expect(screen.getByText('1/2 berbukti')).toBeTruthy();
  expect(screen.getByText('0/1 berbukti')).toBeTruthy();
});

it('menyaring catatan yang belum dan sudah punya bukti', async () => {
  renderHalaman();
  await screen.findByText('Membuat SPM Gaji');

  expect(tombolSaring(/semua/i).textContent).toContain('3');
  expect(tombolSaring(/belum ada bukti/i).textContent).toContain('2');

  fireEvent.click(tombolSaring(/belum ada bukti/i));
  expect(screen.queryByText('Membuat SPM Gaji')).toBeNull();
  expect(screen.getByText('Menghitung Pajak TER')).toBeTruthy();
  expect(screen.getByText('Rekapitulasi Pengembalian Belanja')).toBeTruthy();

  fireEvent.click(tombolSaring(/sudah ada bukti/i));
  expect(screen.getByText('Membuat SPM Gaji')).toBeTruthy();
  expect(screen.queryByText('Menghitung Pajak TER')).toBeNull();
});

it('pencarian mempersempit daftar dan menampilkan state saringan kosong', async () => {
  renderHalaman();
  await screen.findByText('Membuat SPM Gaji');

  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'rekap' },
  });
  expect(screen.queryByText('Membuat SPM Gaji')).toBeNull();
  expect(screen.getByText('Rekapitulasi Pengembalian Belanja')).toBeTruthy();

  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'tidak-ada' },
  });
  expect(screen.getByText('Tidak ada catatan pada saringan ini.')).toBeTruthy();
});

it('memilih baris membuka panel detail beserta area unggah untuk admin bidang', async () => {
  renderHalaman();
  await screen.findByText('Menghitung Pajak TER');
  const detail = screen.getByRole('complementary', { name: 'Detail bukti' });
  expect(detail.textContent).toContain('Pilih catatan');

  fireEvent.click(screen.getByRole('button', { name: /menghitung pajak ter/i }));

  const terbuka = screen.getByRole('complementary', { name: 'Detail bukti' });
  expect(within(terbuka).getByText('Catatan ini belum punya bukti')).toBeTruthy();
  expect(within(terbuka).getByText('Tambah bukti')).toBeTruthy();
});

it('admin aplikasi hanya melihat bukti tanpa area unggah', async () => {
  sesi.current = { peran: 'admin_aplikasi', bidangId: null };
  mocks.getBidang.mockResolvedValue([{ id: 1, namaBidang: 'Keuangan' }]);
  renderHalaman();
  await screen.findByText('Membuat SPM Gaji');

  fireEvent.click(screen.getByRole('button', { name: /membuat spm gaji/i }));

  const detail = screen.getByRole('complementary', { name: 'Detail bukti' });
  expect(within(detail).getByRole('button', { name: /foto-11/ }))
    .toBeTruthy();
  expect(within(detail).queryByText('Tambah bukti')).toBeNull();
});
