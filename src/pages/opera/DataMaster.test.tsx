// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DataMaster from './DataMaster';

const getProgram = vi.hoisted(() => vi.fn());
const hapusProgram = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  getProgram: (...args: unknown[]) => getProgram(...args),
  getKegiatan: () => Promise.resolve([]),
  getSubkegiatan: () => Promise.resolve([]),
  getJumlahAktifitas: () => Promise.resolve(0),
  getKegiatanByProgram: () => Promise.resolve([]),
  getSubkegiatanByKegiatan: () => Promise.resolve([]),
  getAktifitasByIndikatorUtama: () => Promise.resolve([]),
  setAktifProgram: vi.fn(),
  setAktifKegiatan: vi.fn(),
  setAktifSubkegiatan: vi.fn(),
  setAktifAktifitas: vi.fn(),
  hapusProgram: (...args: unknown[]) => hapusProgram(...args),
  hapusKegiatan: vi.fn(),
  hapusSubkegiatan: vi.fn(),
  hapusAktifitas: vi.fn(),
  importKatalogExcel: vi.fn(),
  previewImportExcel: vi.fn(),
  unduhTemplateImportExcel: vi.fn(),
}));
vi.mock('@/services/api', () => ({
  apiMessage: (error: unknown, fallback: string) =>
    (error as { pesanServer?: string })?.pesanServer ?? fallback,
}));

const PROGRAM = [
  { id: 1, dokumenId: 1, urusanId: 0, kodeProgram: '5.01.02', namaProgram: 'PROGRAM PERENCANAAN', flagActive: true },
  { id: 2, dokumenId: 1, urusanId: 0, kodeProgram: '5.05.04', namaProgram: 'PROGRAM UJI', flagActive: true },
];

function tampilkan() {
  render(
    <MemoryRouter initialEntries={['/master/program']}>
      <Routes>
        <Route path="/master/:tingkat" element={<DataMaster />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Klik Hapus → konfirmasi; mengembalikan jumlah panggilan getProgram sebelum menghapus. */
async function hapusBaris(kode: string): Promise<number> {
  const baris = (await screen.findByText(kode)).closest('tr') as HTMLElement;
  const sebelum = getProgram.mock.calls.length;
  await userEvent.click(within(baris).getByRole('button', { name: /Hapus/ }));
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog.textContent).toContain(`Hapus program ${kode}?`);
  expect(dialog.textContent).toContain('belum memiliki kegiatan');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Hapus program' }));
  return sebelum;
}

afterEach(cleanup);
beforeEach(() => {
  getProgram.mockReset().mockResolvedValue(PROGRAM);
  hapusProgram.mockReset();
});

describe('DataMaster — hapus', () => {
  it('menghapus program lalu memuat ulang daftar', async () => {
    hapusProgram.mockResolvedValue(undefined);
    tampilkan();

    const sebelum = await hapusBaris('5.05.04');

    expect(hapusProgram).toHaveBeenCalledWith(2);
    await vi.waitFor(() => expect(getProgram.mock.calls.length).toBeGreaterThan(sebelum));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('menampilkan alasan penolakan server tanpa mengubah daftar', async () => {
    hapusProgram.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 422'), {
        pesanServer: 'Program tidak bisa dihapus karena masih memiliki kegiatan.',
      }),
    );
    tampilkan();

    const sebelum = await hapusBaris('5.01.02');

    expect(await screen.findByText('Program tidak bisa dihapus karena masih memiliki kegiatan.')).toBeTruthy();
    expect(hapusProgram).toHaveBeenCalledWith(1);
    expect(getProgram.mock.calls.length).toBe(sebelum);
    expect(screen.getByText('5.01.02')).toBeTruthy();
  });
});
