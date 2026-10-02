// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PeriodeLayar from './PeriodeLayar';

const getPeriode = vi.fn();
const getDokumen = vi.fn();
const cekSyaratBuka = vi.fn();
const getCapaianPeriode = vi.fn();
const hitungUlangCapaian = vi.fn();
const hapusPeriode = vi.fn();

vi.mock('@/services', () => ({
  getPeriode: (...args: unknown[]) => getPeriode(...args),
  getDokumen: (...args: unknown[]) => getDokumen(...args),
  cekSyaratBuka: (...args: unknown[]) => cekSyaratBuka(...args),
  getCapaianPeriode: (...args: unknown[]) => getCapaianPeriode(...args),
  hitungUlangCapaian: (...args: unknown[]) => hitungUlangCapaian(...args),
  hapusPeriode: (...args: unknown[]) => hapusPeriode(...args),
  simpanPeriode: vi.fn(),
  ubahStatusPeriode: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  apiMessage: (_error: unknown, fallback: string) => fallback,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getPeriode.mockResolvedValue([]);
  getDokumen.mockResolvedValue([]);
  cekSyaratBuka.mockResolvedValue({ boleh: true, bidangBelumSiap: [], adaPeriodeLainTerbuka: null });
});

afterEach(cleanup);

describe('PeriodeLayar', () => {
  it('membuka form tambah dengan nama dan deskripsi dialog yang aksesibel', async () => {
    render(<PeriodeLayar />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Tambah periode' }),
    );

    expect(
      screen.getByRole('dialog', {
        name: 'Periode baru',
        description: /pilih dokumen perencanaan/i,
      }),
    ).toBeTruthy();
  });

  it('menampilkan snapshot dan menyediakan aksi hitung ulang sebagai alat pemulihan', async () => {
    getPeriode.mockResolvedValue([{
      id: 4,
      dokumenId: 1,
      namaPeriode: 'Triwulan IV',
      tanggalMulai: '2026-10-01',
      tanggalSelesai: '2026-12-31',
      status: 'LOCKED',
    }]);
    getCapaianPeriode.mockResolvedValue({ periodeId: 4, capaianPd: 65.39, rincian: [] });
    hitungUlangCapaian.mockResolvedValue({ periodeId: 4, capaianPd: 70, rincian: [] });

    render(<PeriodeLayar />);

    expect(await screen.findByText('65,39%')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Hitung ulang' }));

    const dialog = screen.getByRole('alertdialog', { name: 'Hitung ulang capaian?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Hitung ulang' }));

    await waitFor(() => expect(hitungUlangCapaian).toHaveBeenCalledWith(4));
    expect(await screen.findByText('70,00%')).toBeTruthy();
    expect(screen.getByText(/berhasil dihitung ulang/i)).toBeTruthy();
  });

  it('menghapus periode DRAFT kosong setelah konfirmasi', async () => {
    getPeriode
      .mockResolvedValueOnce([{
        id: 8,
        dokumenId: 1,
        namaPeriode: 'Draf Percobaan',
        tanggalMulai: '2027-01-01',
        tanggalSelesai: '2027-03-31',
        status: 'DRAFT',
        jumlahRencana: 0,
      }])
      .mockResolvedValueOnce([]);
    hapusPeriode.mockResolvedValue(undefined);

    render(<PeriodeLayar />);

    await userEvent.click(await screen.findByRole('button', { name: 'Hapus' }));
    expect(hapusPeriode).not.toHaveBeenCalled();

    const dialog = screen.getByRole('alertdialog', { name: 'Hapus periode kosong?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Hapus periode' }));

    await waitFor(() => expect(hapusPeriode).toHaveBeenCalledWith(8));
    expect(await screen.findByText(/berhasil dihapus/i)).toBeTruthy();
  });

  it('tidak menawarkan hapus untuk DRAFT berisi, OPEN, atau LOCKED', async () => {
    getPeriode.mockResolvedValue([
      { id: 1, dokumenId: 1, namaPeriode: 'Draf Berisi', tanggalMulai: '2026-01-01', tanggalSelesai: '2026-03-31', status: 'DRAFT', jumlahRencana: 1 },
      { id: 2, dokumenId: 1, namaPeriode: 'Terbuka', tanggalMulai: '2026-04-01', tanggalSelesai: '2026-06-30', status: 'OPEN', jumlahRencana: 1 },
      { id: 3, dokumenId: 1, namaPeriode: 'Terkunci', tanggalMulai: '2026-07-01', tanggalSelesai: '2026-09-30', status: 'LOCKED', jumlahRencana: 1 },
    ]);
    getCapaianPeriode.mockResolvedValue({ periodeId: 2, capaianPd: 0, rincian: [] });

    render(<PeriodeLayar />);
    await screen.findByText('Draf Berisi');

    expect(screen.queryByRole('button', { name: 'Hapus' })).toBeNull();
  });
});
