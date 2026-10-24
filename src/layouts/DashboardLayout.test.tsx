// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Peran } from '@/lib/peran';
import DashboardLayout from './DashboardLayout';

let peranAktif: Peran = 'admin_bidang';

vi.mock('@/lib/peran', async importOriginal => {
  const asli = await importOriginal<typeof import('@/lib/peran')>();
  return {
    ...asli,
    usePeran: () => ({
      peran: peranAktif,
      bidangId: peranAktif === 'admin_bidang' ? 3 : null,
      user: {
        name: 'Uji',
        role: peranAktif,
        bidang: peranAktif === 'admin_bidang' ? [{ id: 3, nama_bidang: 'PPM' }] : [],
      },
      memuat: false,
      logout: vi.fn(),
    }),
  };
});

afterEach(cleanup);

function tampilkan(peran: Peran, path: string) {
  peranAktif = peran;
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="*" element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  return within(screen.getByRole('navigation'));
}

describe('DashboardLayout — nama menu per peran', () => {
  it('admin bidang melihat "Capaian Program" dan "Program Bidang"', () => {
    const nav = tampilkan('admin_bidang', '/monitoring');

    expect(nav.getByRole('link', { name: 'Capaian Program' }).getAttribute('href')).toBe('/monitoring');
    expect(nav.getByRole('link', { name: 'Program Bidang' }).getAttribute('href')).toBe('/rencana-saya');
    expect(nav.queryByText('Monitoring Kinerja')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Capaian Program' })).toBeTruthy();
  });

  it('admin aplikasi tetap melihat "Monitoring Kinerja"', () => {
    const nav = tampilkan('admin_aplikasi', '/monitoring');

    expect(nav.getByRole('link', { name: 'Monitoring Kinerja' }).getAttribute('href')).toBe('/monitoring');
    // "Capaian Program" milik admin aplikasi tetap menunjuk halamannya sendiri.
    expect(nav.getByRole('link', { name: 'Capaian Program' }).getAttribute('href')).toBe('/capaian-program');
    expect(nav.queryByText('Program Bidang')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Monitoring Kinerja' })).toBeTruthy();
  });
});
