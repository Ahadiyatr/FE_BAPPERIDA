// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Detail from './Detail';

vi.mock('../services/public-dashboard.service', () => ({
  getDetailBidangPublik: () => Promise.resolve({
    periode: { id: 1, nama_periode: 'Triwulan IV 2026', status: 'LOCKED' },
    header: { bidang_id: 1, nama_bidang: 'P2EPD', jumlah_subkegiatan: 2, capaian_bidang: 63.75 },
    rincian: [
      { id: 1, kode_subkegiatan: '9.9.1.1.01.1', nama_subkegiatan: 'Subkegiatan Uji S1', indikator_kinerja: null, target: 10, satuan: null, capaian: 92.5 },
      { id: 2, kode_subkegiatan: '9.9.1.1.01.2', nama_subkegiatan: 'Subkegiatan Uji S2', indikator_kinerja: null, target: 4, satuan: null, capaian: 35 },
    ],
  }),
}));

afterEach(cleanup);

describe('Detail bidang publik — format angka', () => {
  it('memakai format Indonesia satu desimal seperti layar admin', async () => {
    render(<MemoryRouter initialEntries={['/detail?bidang=1']}><Detail /></MemoryRouter>);

    expect(await screen.findByText('92,5%')).toBeTruthy();
    expect(screen.getByText('35,0%')).toBeTruthy();
    expect(document.body.textContent).toContain('63,8%');
    expect(document.body.textContent).not.toMatch(/\d\.\d+%/);
  });
});
