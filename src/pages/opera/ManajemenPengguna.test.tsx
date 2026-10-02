// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ManajemenPengguna from './ManajemenPengguna';

const getUsers = vi.fn();
const getBidang = vi.fn();
const resetPasswordUser = vi.fn();

vi.mock('@/services', () => ({
  getUsers: (...args: unknown[]) => getUsers(...args),
  getBidang: (...args: unknown[]) => getBidang(...args),
  resetPasswordUser: (...args: unknown[]) => resetPasswordUser(...args),
  setAktifUser: vi.fn(),
  simpanUser: vi.fn(),
}));
vi.mock('@/services/api', () => ({
  apiMessage: (_e: unknown, fallback: string) => fallback,
}));
vi.mock('@/utils/toast', () => ({
  Toast: { fire: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  getBidang.mockResolvedValue([
    { id: 1, kode: 'PPM', namaBidang: 'Bidang PPM', flagActive: true },
    { id: 2, kode: 'PIK', namaBidang: 'Bidang PIK', flagActive: true },
  ]);
  getUsers.mockResolvedValue([
    { id: 1, name: 'Ayu Admin', email: 'ayu@example.test', role: 'admin_aplikasi', bidangId: null, flagActive: true },
    { id: 2, name: 'Budi PPM', email: 'budi@example.test', role: 'admin_bidang', bidangId: 1, flagActive: true },
    { id: 3, name: 'Citra PIK', email: 'citra@example.test', role: 'admin_bidang', bidangId: 2, flagActive: false },
  ]);
});

afterEach(cleanup);

describe('ManajemenPengguna', () => {
  it('mencari pengguna berdasarkan nama, email, atau bidang', async () => {
    render(<ManajemenPengguna />);
    await screen.findByText('Ayu Admin');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Cari pengguna' }), 'PPM');

    expect(screen.getByText('Budi PPM')).toBeTruthy();
    expect(screen.queryByText('Ayu Admin')).toBeNull();
    expect(screen.queryByText('Citra PIK')).toBeNull();
  });

  it('menggabungkan filter peran, bidang, dan status lalu dapat membersihkannya', async () => {
    render(<ManajemenPengguna />);
    await screen.findByText('Ayu Admin');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter peran pengguna' }), 'admin_bidang');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter bidang pengguna' }), '2');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter status pengguna' }), 'nonaktif');

    expect(screen.getByText('Citra PIK')).toBeTruthy();
    expect(screen.queryByText('Budi PPM')).toBeNull();
    expect(screen.getByText('1 dari 3 pengguna')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Bersihkan saringan' }));
    expect(screen.getByText('Ayu Admin')).toBeTruthy();
    expect(screen.getByText('Budi PPM')).toBeTruthy();
    expect(screen.getByText('3 dari 3 pengguna')).toBeTruthy();
  });

  it('mereset kata sandi mode manual memanggil resetPasswordUser dan menutup dialog', async () => {
    resetPasswordUser.mockResolvedValue(null);
    render(<ManajemenPengguna />);
    await screen.findByText('Ayu Admin');

    const barisBudi = screen.getByText('Budi PPM').closest('tr')!;
    await userEvent.click(within(barisBudi).getByRole('button', { name: /Reset sandi/ }));

    expect(await screen.findByText('Reset kata sandi')).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'SandiBaru1234');
    await userEvent.type(screen.getByLabelText('Konfirmasi'), 'SandiBaru1234');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(resetPasswordUser).toHaveBeenCalledWith(2, 'SandiBaru1234'));
    await waitFor(() => expect(screen.queryByText('Reset kata sandi')).toBeNull());
  });

  it('mode buatkan otomatis menampilkan sandi hasil generate dan tidak langsung menutup', async () => {
    resetPasswordUser.mockResolvedValue('Xy7pQ2mZaB');
    render(<ManajemenPengguna />);
    await screen.findByText('Ayu Admin');

    const barisBudi = screen.getByText('Budi PPM').closest('tr')!;
    await userEvent.click(within(barisBudi).getByRole('button', { name: /Reset sandi/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Buatkan otomatis' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(resetPasswordUser).toHaveBeenCalledWith(2, undefined));
    expect(await screen.findByText('Xy7pQ2mZaB')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Selesai' })).toBeTruthy();
  });
});
