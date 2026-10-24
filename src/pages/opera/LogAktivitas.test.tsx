// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LogAktivitasLayar from './LogAktivitas';

const getLog = vi.hoisted(() => vi.fn());
const getRingkasanLog = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  getLog: (...args: unknown[]) => getLog(...args),
  getRingkasanLog: (...args: unknown[]) => getRingkasanLog(...args),
  getPeriode: () => Promise.resolve([]),
  getBidang: () => Promise.resolve([]),
  getUsers: () => Promise.resolve([]),
}));
vi.mock('@/lib/peran', () => ({ usePeran: () => ({ peran: 'admin_aplikasi', bidangId: null }) }));

function kejadian(id: number) {
  return {
    id,
    waktu: '2026-10-20T02:00:00Z',
    userId: 1,
    namaPengguna: 'Admin',
    peran: 'admin_aplikasi',
    aksi: id % 2 ? 'BUAT' : 'HAPUS',
    entitas: 'MASTER_BIDANG',
    entitasId: id,
    ringkasan: `Kejadian nomor ${id}`,
    periodeId: null,
    bidangId: null,
  };
}

afterEach(cleanup);
beforeEach(() => {
  getLog.mockReset().mockImplementation(({ halaman }: { halaman: number }) =>
    Promise.resolve(halaman === 2 ? [kejadian(26)] : [kejadian(1)]),
  );
  getRingkasanLog.mockReset().mockResolvedValue({
    total: 26, hariIni: 0, pengguna: 1, perhatian: 0, perHari: [],
    perGrup: { master: 26, rencana: 0, pelaksanaan: 0, sesi: 0 },
  });
});

function tampilkan() {
  render(<MemoryRouter><LogAktivitasLayar /></MemoryRouter>);
}

describe('LogAktivitas — pagination server', () => {
  it('meminta halaman berikutnya ke server dengan total dari ringkasan', async () => {
    tampilkan();
    expect(await screen.findByText('Menampilkan 1–25 dari 26 data')).toBeTruthy();
    expect(getLog).toHaveBeenLastCalledWith(expect.objectContaining({ batas: 25, halaman: 1 }));

    fireEvent.click(screen.getByLabelText('Halaman 2'));

    expect(await screen.findByText('Menampilkan 26–26 dari 26 data')).toBeTruthy();
    expect(getLog).toHaveBeenLastCalledWith(expect.objectContaining({ batas: 25, halaman: 2 }));
    // Pindah halaman tidak memuat ulang ringkasan.
    expect(getRingkasanLog).toHaveBeenCalledTimes(1);
  });

  it('mengganti saringan mengembalikan daftar ke halaman 1', async () => {
    tampilkan();
    fireEvent.click(await screen.findByLabelText('Halaman 2'));
    await screen.findByText('Menampilkan 26–26 dari 26 data');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'bidang' } });

    expect(await screen.findByText('Menampilkan 1–25 dari 26 data')).toBeTruthy();
    expect(getLog).toHaveBeenLastCalledWith(expect.objectContaining({ cari: 'bidang', halaman: 1 }));
    expect(getLog).not.toHaveBeenCalledWith(expect.objectContaining({ cari: 'bidang', halaman: 2 }));
  });
});
