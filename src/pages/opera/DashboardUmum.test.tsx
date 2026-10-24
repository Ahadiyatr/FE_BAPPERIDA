// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardUmum from './DashboardUmum';

const sesi = vi.hoisted(() => ({ current: { peran: 'admin_aplikasi', bidangId: null as number | null } }));
const { eksporLaporan, tertunda } = vi.hoisted(() => ({
  eksporLaporan: vi.fn(),
  // Data capaian sengaja tidak pernah selesai dimuat: yang diuji hanya baris tombol ekspor.
  tertunda: () => new Promise(() => {}),
}));

vi.mock('@/services', () => ({
  getPeriode: () => Promise.resolve([{ id: 4, namaPeriode: 'Triwulan IV 2026', status: 'OPEN' }]),
  getRingkasanDashboard: tertunda,
  getRankingBidang: tertunda,
  getRankingProgram: tertunda,
  getSubkegiatanTertinggal: tertunda,
  getTrenCapaian: tertunda,
  eksporLaporan: (...args: unknown[]) => eksporLaporan(...args),
}));
vi.mock('@/lib/peran', () => ({ usePeran: () => sesi.current }));
vi.mock('@/services/api', () => ({
  apiMessage: (error: unknown, fallback: string) =>
    (error as { pesanServer?: string })?.pesanServer ?? fallback,
}));

const tampilkan = () => render(<MemoryRouter><DashboardUmum /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  sesi.current = { peran: 'admin_aplikasi', bidangId: null };
  eksporLaporan.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('DashboardUmum — ekspor laporan', () => {
  it('menyediakan ekspor rincian dan rekap bidang untuk admin aplikasi', async () => {
    tampilkan();

    await userEvent.click(await screen.findByRole('button', { name: /CSV rincian/ }));
    await userEvent.click(screen.getByRole('button', { name: /CSV rekap bidang/ }));

    expect(eksporLaporan.mock.calls).toEqual([[4, 'rincian'], [4, 'bidang']]);
  });

  it('menampilkan galat ekspor tanpa memakai kotak muat ulang data', async () => {
    eksporLaporan.mockRejectedValue(Object.assign(new Error('Request failed with status code 403'), { pesanServer: 'Akses ditolak.' }));
    tampilkan();

    await userEvent.click(await screen.findByRole('button', { name: /CSV rekap bidang/ }));

    expect((await screen.findByRole('alert')).textContent).toBe('Akses ditolak.');
    expect(screen.queryByRole('button', { name: /Coba lagi/ })).toBeNull();
  });

  it('tidak menampilkan tombol ekspor untuk admin bidang', async () => {
    sesi.current = { peran: 'admin_bidang', bidangId: 1 };
    tampilkan();

    await screen.findByText(/Triwulan IV 2026/);
    expect(screen.queryByRole('button', { name: /CSV/ })).toBeNull();
  });
});
