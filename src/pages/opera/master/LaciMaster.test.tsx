// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LaciMaster } from './LaciMaster';

const simpanKegiatan = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  getDokumen: () => Promise.resolve([]),
  getProgram: () => Promise.resolve([]),
  getProgramById: () => Promise.resolve({ id: 1, kodeProgram: '9.9.1' }),
  getKegiatanByProgram: () => Promise.resolve([]),
  getKegiatanById: () => Promise.resolve(null),
  getSubkegiatanByKegiatan: () => Promise.resolve([]),
  getSubkegiatanById: () => Promise.resolve(null),
  getAktifitasByIndikatorUtama: () => Promise.resolve([]),
  simpanProgram: vi.fn(),
  simpanKegiatan: (...args: unknown[]) => simpanKegiatan(...args),
  simpanSubkegiatan: vi.fn(),
  simpanAktifitas: vi.fn(),
  // Diimpor tingkat.ts; tidak dipanggil di test ini.
  getKegiatan: vi.fn(),
  getSubkegiatan: vi.fn(),
  setAktifProgram: vi.fn(),
  setAktifKegiatan: vi.fn(),
  setAktifSubkegiatan: vi.fn(),
  setAktifAktifitas: vi.fn(),
  hapusProgram: vi.fn(),
  hapusKegiatan: vi.fn(),
  hapusSubkegiatan: vi.fn(),
  hapusAktifitas: vi.fn(),
}));
vi.mock('@/services/api', () => ({
  apiMessage: (error: unknown, fallback: string) =>
    (error as { pesanServer?: string })?.pesanServer ?? fallback,
}));

afterEach(cleanup);

describe('LaciMaster', () => {
  it('menampilkan pesan server saat simpan ditolak, bukan pesan mentah axios', async () => {
    simpanKegiatan.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 422'), {
        pesanServer: 'Kode kegiatan sudah dipakai.',
      }),
    );
    render(
      <LaciMaster tingkat="kegiatan" baris={null} indukId={1} jumlahPendukungAktif={0}
        terbuka onTutup={vi.fn()} onTersimpan={vi.fn()} />,
    );

    const kode = document.getElementById('kodeKegiatan') as HTMLInputElement;
    await userEvent.clear(kode);
    await userEvent.type(kode, '9.9.1.01');
    await userEvent.type(document.getElementById('namaKegiatan') as HTMLInputElement, 'Kegiatan uji');
    await userEvent.click(screen.getByRole('button', { name: /^Simpan$/ }));

    expect(await screen.findByText('Kode kegiatan sudah dipakai.')).toBeTruthy();
    expect(screen.queryByText('Request failed with status code 422')).toBeNull();
  });
});
