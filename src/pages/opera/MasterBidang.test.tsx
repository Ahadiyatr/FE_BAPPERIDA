// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MasterBidang from './MasterBidang';

const getBidang = vi.fn();
const hapusBidang = vi.fn();
const simpanBidang = vi.fn();

vi.mock('@/services', () => ({
  getBidang: (...args: unknown[]) => getBidang(...args),
  hapusBidang: (...args: unknown[]) => hapusBidang(...args),
  setAktifBidang: vi.fn(),
  simpanBidang: (...args: unknown[]) => simpanBidang(...args),
}));

vi.mock('@/services/api', () => ({
  apiMessage: (error: unknown, fallback: string) =>
    (error as { pesanServer?: string })?.pesanServer ?? fallback,
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

  it('menampilkan pesan dari server saat simpan ditolak, bukan pesan mentah axios', async () => {
    simpanBidang.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 422'), {
        pesanServer: 'Kode bidang sudah dipakai.',
      }),
    );
    render(<MasterBidang />);

    await screen.findByText('Bidang Belum Dipakai');
    await userEvent.click(screen.getByRole('button', { name: /Tambah bidang/ }));
    const dialog = screen.getByRole('dialog');
    const [kode, nama] = Array.from(dialog.querySelectorAll('input'));
    await userEvent.type(kode, 'P2EPD');
    await userEvent.type(nama, 'P2EPD');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Kode bidang sudah dipakai.')).toBeTruthy();
    expect(screen.queryByText('Request failed with status code 422')).toBeNull();
  });
});
