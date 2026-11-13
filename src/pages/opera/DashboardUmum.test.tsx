// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardUmum from './DashboardUmum';

const sesi = vi.hoisted(() => ({ current: { peran: 'admin_aplikasi', bidangId: null as number | null } }));
// Data capaian sengaja tidak pernah selesai dimuat: yang diuji hanya baris header.
const tertunda = vi.hoisted(() => () => new Promise(() => {}));

vi.mock('@/services', () => ({
  getPeriode: () => Promise.resolve([{ id: 4, namaPeriode: 'Triwulan IV 2026', status: 'OPEN' }]),
  getRingkasanDashboard: tertunda,
  getRankingBidang: tertunda,
  getRankingProgram: tertunda,
  getSubkegiatanTertinggal: tertunda,
  getTrenCapaian: tertunda,
}));
vi.mock('@/lib/peran', () => ({ usePeran: () => sesi.current }));
vi.mock('@/services/api', () => ({
  apiMessage: (error: unknown, fallback: string) =>
    (error as { pesanServer?: string })?.pesanServer ?? fallback,
}));

const tampilkan = () => render(<MemoryRouter><DashboardUmum /></MemoryRouter>);

beforeEach(() => {
  sesi.current = { peran: 'admin_aplikasi', bidangId: null };
});

afterEach(cleanup);

describe('DashboardUmum — ekspor laporan disembunyikan', () => {
  it('tidak menampilkan tombol ekspor untuk admin aplikasi', async () => {
    tampilkan();

    await screen.findByText(/Triwulan IV 2026/);
    expect(screen.queryByRole('button', { name: /CSV/ })).toBeNull();
  });

  it('tidak menampilkan tombol ekspor untuk admin bidang', async () => {
    sesi.current = { peran: 'admin_bidang', bidangId: 1 };
    tampilkan();

    await screen.findByText(/Triwulan IV 2026/);
    expect(screen.queryByRole('button', { name: /CSV/ })).toBeNull();
  });
});
