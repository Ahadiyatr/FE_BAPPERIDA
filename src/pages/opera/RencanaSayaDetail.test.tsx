// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RencanaSayaDetail from './RencanaSayaDetail';

const svc = vi.hoisted(() => ({
  getRencanaSayaDetail: vi.fn(),
  setDipakaiAktifitas: vi.fn(),
  tambahAktifitasKeRencana: vi.fn(),
  hapusAktifitasDariRencana: vi.fn(),
}));

vi.mock('@/services', () => svc);
vi.mock('@/services/api', () => ({
  apiMessage: (_error: unknown, fallback: string) => fallback,
}));

const akt = (id: number, nama: string, tipe: 'UTAMA' | 'PENDUKUNG', bobot: number, extra: object = {}) => ({
  id, namaAktifitas: nama, tipeAktifitas: tipe, satuan: 'dokumen', bobotTarget: bobot, target: 2,
  realisasi: 0, bobotRealisasi: 0, jumlahCatatan: 0, jumlahLampiran: 0, flagAdhoc: false,
  dipakai: true, urutan: id, catatan: [], ...extra,
});

const detail = (status: string, aktifitas = [
  akt(1, 'S1 Utama', 'UTAMA', 70),
  akt(2, 'S1 Pendukung P1', 'PENDUKUNG', 15),
  akt(3, 'S1 Pendukung P2', 'PENDUKUNG', 15),
  akt(4, 'S1 Pendukung P3 ad-hoc', 'PENDUKUNG', 0, { flagAdhoc: true, dipakai: false }),
]) => ({
  id: 9, kodeProgram: '9.9.1', namaProgram: 'Program', kodeKegiatan: '9.9.1.01', namaKegiatan: 'Kegiatan',
  kodeSubkegiatan: '9.9.1.01.1', namaSubkegiatan: 'Subkegiatan Uji S1', indikatorKinerja: 'Indikator',
  outputKinerja: '', target: 10, satuan: 'dokumen', capaian: 0, bidang: { id: 1, namaBidang: 'P2EPD' },
  periode: { id: 5, namaPeriode: 'Triwulan I 2027', status, tanggalMulai: '2027-01-01', tanggalSelesai: '2027-03-31' },
  aktifitas,
});

const tampilkan = () => render(
  <MemoryRouter initialEntries={['/rencana-saya/9']}>
    <Routes><Route path="/rencana-saya/:id" element={<RencanaSayaDetail />} /></Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
  svc.getRencanaSayaDetail.mockResolvedValue(detail('DRAFT'));
  svc.setDipakaiAktifitas.mockResolvedValue(undefined);
  svc.tambahAktifitasKeRencana.mockResolvedValue(undefined);
  svc.hapusAktifitasDariRencana.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('RencanaSayaDetail — admin bidang menyusun pendukung saat DRAFT', () => {
  it('meng-uncheck pendukung lalu memuat ulang detail', async () => {
    tampilkan();

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Pakai S1 Pendukung P1' }));

    await waitFor(() => expect(svc.setDipakaiAktifitas).toHaveBeenCalledWith(2, false));
    await waitFor(() => expect(svc.getRencanaSayaDetail).toHaveBeenCalledTimes(2));
  });

  it('mencentang lagi pendukung yang tidak dipakai', async () => {
    tampilkan();

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Pakai S1 Pendukung P3 ad-hoc' }));

    await waitFor(() => expect(svc.setDipakaiAktifitas).toHaveBeenCalledWith(4, true));
  });

  it('tidak mengizinkan meng-uncheck pendukung terakhir yang dipakai', async () => {
    svc.getRencanaSayaDetail.mockResolvedValue(detail('DRAFT', [
      akt(1, 'S2 Utama', 'UTAMA', 70),
      akt(2, 'S2 Pendukung P1', 'PENDUKUNG', 30),
    ]));
    tampilkan();

    const centang = await screen.findByRole('checkbox', { name: 'Pakai S2 Pendukung P1' });
    expect((centang as HTMLButtonElement).disabled).toBe(true);
  });

  it('menambah dan menghapus pendukung ad-hoc', async () => {
    tampilkan();

    await userEvent.type(await screen.findByPlaceholderText('Nama aktivitas pendukung'), 'Rapat tambahan');
    const target = screen.getByRole('spinbutton', { name: 'Target aktivitas baru' });
    await userEvent.clear(target);
    await userEvent.type(target, '2');
    await userEvent.click(screen.getByRole('button', { name: 'Tambah' }));
    await waitFor(() => expect(svc.tambahAktifitasKeRencana).toHaveBeenCalledWith({
      subkegiatanBidangId: 9, namaAktifitas: 'Rapat tambahan', target: 2,
    }));

    await userEvent.click(screen.getByRole('button', { name: 'Hapus S1 Pendukung P3 ad-hoc' }));
    await waitFor(() => expect(svc.hapusAktifitasDariRencana).toHaveBeenCalledWith(4));
  });

  it('tidak menawarkan penyusunan setelah periode dibuka', async () => {
    svc.getRencanaSayaDetail.mockResolvedValue(detail('OPEN', [
      akt(1, 'S1 Utama', 'UTAMA', 70),
      akt(2, 'S1 Pendukung P1', 'PENDUKUNG', 30),
    ]));
    tampilkan();

    await screen.findByText('Subkegiatan Uji S1');
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByPlaceholderText('Nama aktivitas pendukung')).toBeNull();
  });
});
