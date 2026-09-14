// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MasterBidang from './MasterBidang';

const getBidang = vi.fn();
const hapusBidang = vi.fn();

vi.mock('@/services', () => ({
  getBidang: (...args: unknown[]) => getBidang(...args),
  hapusBidang: (...args: unknown[]) => hapusBidang(...args),
  setAktifBidang: vi.fn(),
  simpanBidang: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  apiMessage: (_error: unknown, fallback: string) => fallback,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getBidang.mockResolvedValue([
    { id: 17, kode: '17', namaBidang: 'Bidang Belum Dipakai', flagActive: true },
  ]);
  hapusBidang.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('MasterBidang', () => {
  it('hanya memuat bidang aktif secara default dan dapat menampilkan semuanya', async () => {
    render(<MasterBidang />);

    await screen.findByText('Bidang Belum Dipakai');
    expect(getBidang).toHaveBeenCalledWith({ termasukNonaktif: false });

    await userEvent.click(
      screen.getByRole('button', { name: 'Tampilkan semua bidang' }),
    );

    await waitFor(() =>
      expect(getBidang).toHaveBeenLastCalledWith({ termasukNonaktif: true }),
    );
    expect(
      screen.getByRole('button', { name: 'Tampilkan bidang aktif' }),
    ).toBeTruthy();
  });

  it('menghapus bidang setelah pengguna mengonfirmasi', async () => {
    render(<MasterBidang />);

    await screen.findByText('Bidang Belum Dipakai');
    await userEvent.click(screen.getByRole('button', { name: 'Hapus' }));

    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText(/hanya akan dihapus jika belum memiliki pengguna/i)).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Hapus bidang' }));

    await waitFor(() => expect(hapusBidang).toHaveBeenCalledWith(17));
    await waitFor(() => expect(getBidang).toHaveBeenCalledTimes(2));
  });
});
