// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MasterDokumen from './MasterDokumen';

const { getDokumenDenganIsi, simpanDokumen } = vi.hoisted(() => ({
  getDokumenDenganIsi: vi.fn(),
  simpanDokumen: vi.fn(),
}));

vi.mock('@/services', () => ({
  getDokumenDenganIsi: (...args: unknown[]) => getDokumenDenganIsi(...args),
  setAktifDokumen: vi.fn(),
  simpanDokumen: (...args: unknown[]) => simpanDokumen(...args),
}));

vi.mock('@/services/api', () => ({
  apiMessage: (_error: unknown, fallback: string) => fallback,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getDokumenDenganIsi.mockResolvedValue([
    {
      id: 1, nama: 'Renstra 2026–2030', tahunMulai: 2026, tahunSelesai: 2030,
      status: 'AKTIF', flagActive: true, jumlahProgram: 2, jumlahPeriode: 1,
    },
  ]);
  simpanDokumen.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('MasterDokumen — dokumen datar tanpa hirarki RPJMD/RKPD', () => {
  it('menampilkan isi program dan periode tanpa kode atau jenis rekaan', async () => {
    render(<MasterDokumen />);

    expect(await screen.findByText('2 program · 1 periode')).toBeTruthy();
    const halaman = document.body.textContent ?? '';
    expect(halaman).not.toMatch(/DOK-|RPJMD|RKPD/);
  });

  it('laci hanya berisi isian yang disimpan backend', async () => {
    render(<MasterDokumen />);
    await screen.findByText('Renstra 2026–2030');

    await userEvent.click(screen.getByRole('button', { name: /Tambah dokumen/ }));
    const laci = screen.getByRole('dialog');

    expect(Array.from(laci.querySelectorAll('label > span')).map((s) => s.textContent)).toEqual([
      'Nama', 'Tahun mulai', 'Tahun selesai', 'Status', 'Keterangan (opsional)',
    ]);
    expect(Array.from(laci.querySelectorAll('option')).map((o) => o.textContent)).toEqual(['Aktif', 'Arsip']);
  });

  it('menampilkan keterangan di bawah nama bila ada', async () => {
    getDokumenDenganIsi.mockResolvedValue([
      {
        id: 1, nama: 'Renstra 2026–2030', tahunMulai: 2026, tahunSelesai: 2030,
        status: 'AKTIF', flagActive: true, keterangan: 'Perkada No. 12/2025', jumlahProgram: 0, jumlahPeriode: 0,
      },
    ]);
    render(<MasterDokumen />);

    expect(await screen.findByText('Perkada No. 12/2025')).toBeTruthy();
  });

  it('menyimpan nama, tahun, status, dan keterangan yang diisi', async () => {
    render(<MasterDokumen />);
    await screen.findByText('Renstra 2026–2030');

    await userEvent.click(screen.getByRole('button', { name: /Tambah dokumen/ }));
    const laci = screen.getByRole('dialog');
    const [nama, mulai, selesai] = Array.from(laci.querySelectorAll('input'));
    await userEvent.type(nama, 'Renstra Baru');
    await userEvent.clear(mulai); await userEvent.type(mulai, '2031');
    await userEvent.clear(selesai); await userEvent.type(selesai, '2035');
    await userEvent.selectOptions(laci.querySelector('select')!, 'ARSIP');
    await userEvent.type(laci.querySelector('textarea')!, 'Catatan revisi');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(simpanDokumen).toHaveBeenCalledWith({
      id: undefined, nama: 'Renstra Baru', tahunMulai: 2031, tahunSelesai: 2035, status: 'ARSIP',
      keterangan: 'Catatan revisi',
    }));
  });
});
