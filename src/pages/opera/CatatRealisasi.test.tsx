// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import CatatRealisasi, { RiwayatRealisasi } from './CatatRealisasi';

const svc = vi.hoisted(() => ({
  getRealisasiByIndikatorBidang: vi.fn(),
  ubahRealisasi: vi.fn(),
  hapusRealisasi: vi.fn(),
  catatRealisasi: vi.fn(),
  getAktifitasBidang: vi.fn(),
  getBidang: vi.fn(),
  getPeriode: vi.fn(),
  pratinjauRealisasi: vi.fn(),
}));
const getRealisasiByIndikatorBidang = svc.getRealisasiByIndikatorBidang;

vi.mock('@/services', () => svc);
vi.mock('@/lib/peran', () => ({ usePeran: () => ({ peran: 'admin_bidang', bidangId: 1 }) }));
vi.mock('@/services/api', () => ({ apiMessage: (_e: unknown, fallback: string) => fallback }));

const baris = {
  indikatorBidangId: 7, namaAktifitas: 'S1 Utama', realisasi: 12, target: 10,
} as unknown as Parameters<typeof RiwayatRealisasi>[0]['baris'];

const tampilkan = (bolehUbah = true) => render(
  <RiwayatRealisasi baris={baris} bolehUbah={bolehUbah} onTutup={vi.fn()} onTersimpan={vi.fn()} />,
);

beforeEach(() => {
  vi.clearAllMocks();
  getRealisasiByIndikatorBidang.mockResolvedValue([
    { id: 1, tanggalKegiatan: '2026-10-19', jumlahRealisasi: 12, keterangan: 'Tahap 1', lampiran: [] },
    { id: 2, tanggalKegiatan: '2026-10-20', jumlahRealisasi: 1, keterangan: '', lampiran: [] },
  ]);
});

afterEach(cleanup);

describe('RiwayatRealisasi — tombol ikon punya nama aksesibel', () => {
  it('membedakan tombol koreksi tiap catatan dan membuka form koreksi', async () => {
    tampilkan();

    expect(await screen.findByRole('button', { name: 'Koreksi catatan 2026-10-20 · 1' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Koreksi catatan 2026-10-19 · 12' }));

    expect(screen.getByText('Koreksi catatan')).toBeTruthy();
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('12');
  });

  it('membedakan tombol hapus tiap catatan dan meminta konfirmasi', async () => {
    tampilkan();

    await userEvent.click(await screen.findByRole('button', { name: 'Hapus catatan 2026-10-20 · 1' }));

    expect(screen.getByRole('button', { name: 'Hapus' })).toBeTruthy();
  });

  it('tidak menampilkan tombol ubah dan hapus saat pencatatan tidak dibuka', async () => {
    tampilkan(false);

    await screen.findByText('Tahap 1');
    expect(screen.queryByRole('button', { name: /Koreksi catatan|Hapus catatan/ })).toBeNull();
  });
});

const aktivitas = (periodeId: number) => [{
  indikatorBidangId: periodeId === 3 ? 9 : 4, kodeSubkegiatan: '9.9.1.1.01.1', namaSubkegiatan: 'Subkegiatan Uji S1',
  namaAktifitas: periodeId === 3 ? 'Utama periode terbuka' : 'Utama periode terkunci', tipeAktifitas: 'UTAMA',
  bobotTarget: 70, target: 10, realisasi: 3, capaianSubkegiatan: 21, jumlahCatatan: 1, jumlahLampiran: 1, selesai: false,
}];

const bukaHalaman = (url: string) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes><Route path="/realisasi" element={<CatatRealisasi />} /></Routes>
  </MemoryRouter>,
);

describe('CatatRealisasi — tautan ?periode & ?aktifitas (P2-R11)', () => {
  beforeEach(() => {
    svc.getPeriode.mockResolvedValue([
      { id: 1, namaPeriode: 'Triwulan IV 2026', status: 'LOCKED' },
      { id: 3, namaPeriode: 'Triwulan I 2027', status: 'OPEN' },
    ]);
    svc.getAktifitasBidang.mockImplementation((_bidang: number, periode: number) => Promise.resolve(aktivitas(periode)));
    svc.pratinjauRealisasi.mockResolvedValue(null);
  });

  it('tautan Catat dari Rencana Saya memuat tabel dan membuka form aktivitasnya', async () => {
    bukaHalaman('/realisasi?periode=3&aktifitas=9');

    expect(await screen.findByRole('heading', { name: 'Catat realisasi' }, { timeout: 3000 })).toBeTruthy();
    expect(screen.getAllByText('Utama periode terbuka').length).toBeGreaterThan(0);
    expect(screen.queryByText('Memuat…')).toBeNull();
  });

  it('tautan ke periode yang bukan OPEN tetap memakai periode itu', async () => {
    bukaHalaman('/realisasi?periode=1');

    expect(await screen.findByText('Utama periode terkunci', {}, { timeout: 3000 })).toBeTruthy();
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.queryByText('Utama periode terbuka')).toBeNull();
  });
});
