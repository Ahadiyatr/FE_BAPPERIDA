// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import KalenderRencana from './KalenderRencana';
// Import tipe murni — dihapus saat kompilasi, jadi tidak menyentuh modul yang di-mock.
import type { Peran } from '@/lib/peran';
import type { AgendaKegiatan, DetailSubkegiatan, KalenderBulan, RealisasiKalender } from '@/services';

const getKalenderBulan = vi.fn();
const getPeriode = vi.fn();
const getRencanaSayaRingkas = vi.fn();
const hapusAgenda = vi.fn();
const simpanAgenda = vi.fn();

vi.mock('@/services', () => ({
  getKalenderBulan: (...a: unknown[]) => getKalenderBulan(...a),
  getPeriode: (...a: unknown[]) => getPeriode(...a),
  getRencanaSayaRingkas: (...a: unknown[]) => getRencanaSayaRingkas(...a),
  hapusAgenda: (...a: unknown[]) => hapusAgenda(...a),
  simpanAgenda: (...a: unknown[]) => simpanAgenda(...a),
  getJadwalAktifitas: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  apiMessage: (_e: unknown, fallback: string) => fallback,
}));

let peranSaatIni: Exclude<Peran, 'publik'> = 'admin_bidang';

vi.mock('@/lib/peran', async (orig) => ({
  ...(await orig<typeof import('@/lib/peran')>()),
  usePeran: () => ({
    peran: peranSaatIni,
    bidangId: 3,
    user: null,
    memuat: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const PERIODE = {
  id: 1,
  dokumenId: 1,
  namaPeriode: 'Triwulan I 2026',
  tanggalMulai: '2026-01-01',
  tanggalSelesai: '2026-03-31',
  status: 'DRAFT' as const,
};

function agenda(ubah: Partial<AgendaKegiatan> = {}): AgendaKegiatan {
  return {
    id: 41,
    aktifitasBidangId: 7,
    judulAgenda: 'Rapat koordinasi RINOVA',
    tanggalMulai: '2026-02-10',
    tanggalSelesai: '2026-02-10',
    jumlahRencana: 1,
    lokasi: 'Ruang rapat lantai 2',
    keterangan: '',
    status: 'RENCANA',
    terlewat: false,
    logEntryName: 'Admin Bidang',
    konteks: {
      bidangId: 3,
      namaBidang: 'P2EPD',
      subkegiatanBidangId: 12,
      kodeSubkegiatan: '5.1.2.2.01.1',
      namaSubkegiatan: 'Analisis Kondisi Daerah',
      namaAktifitas: 'Menyusun laporan bulanan',
      tipeAktifitas: 'UTAMA',
      satuan: 'Laporan',
    },
    ...ubah,
  };
}

function realisasi(ubah: Partial<RealisasiKalender> = {}): RealisasiKalender {
  return {
    id: 90,
    aktifitasBidangId: 7,
    tanggalKegiatan: '2026-02-11',
    jumlahRealisasi: 1,
    keterangan: '',
    logEntryName: 'Admin Bidang',
    jumlahLampiran: 2,
    konteks: agenda().konteks,
    ...ubah,
  };
}

function detailSubkegiatan(): DetailSubkegiatan {
  return {
    id: 12,
    kodeProgram: '5.1',
    namaProgram: 'Program P2EPD',
    kodeKegiatan: '5.1.2',
    namaKegiatan: 'Kegiatan P2EPD',
    kodeSubkegiatan: '5.1.2.2.01.1',
    namaSubkegiatan: 'Analisis Kondisi Daerah',
    indikatorKinerja: 'Jumlah dokumen',
    outputKinerja: 'Dokumen analisis',
    target: 4,
    satuan: 'Dokumen',
    capaian: 0,
    bidang: { id: 3, namaBidang: 'P2EPD' },
    periode: null,
    aktifitas: [
      {
        id: 7,
        namaAktifitas: 'Menyusun laporan bulanan',
        tipeAktifitas: 'UTAMA',
        satuan: 'Laporan',
        bobotTarget: 70,
        target: 4,
        realisasi: 0,
        bobotRealisasi: 0,
        jumlahCatatan: 0,
        jumlahLampiran: 0,
        flagAdhoc: false,
        urutan: 1,
        catatan: [],
      },
      {
        id: 8,
        namaAktifitas: 'Diskusi kelompok terpumpun',
        tipeAktifitas: 'PENDUKUNG',
        satuan: 'Kali',
        bobotTarget: 30,
        target: 2,
        realisasi: 0,
        bobotRealisasi: 0,
        jumlahCatatan: 0,
        jumlahLampiran: 0,
        flagAdhoc: false,
        urutan: 2,
        catatan: [],
      },
    ],
  };
}

function kalender(ubah: Partial<KalenderBulan> = {}): KalenderBulan {
  return {
    periode: PERIODE,
    bulan: '2026-02',
    rentang: { dari: '2026-01-26', sampai: '2026-03-01' },
    dapatMenjadwalkan: true,
    bidang: [{ id: 3, namaBidang: 'P2EPD' }],
    ringkasan: { jumlahAgenda: 1, jumlahRealisasi: 1, agendaTerlewat: 0 },
    agenda: [agenda()],
    realisasi: [realisasi()],
    ...ubah,
  };
}

const tampilkan = () => render(<MemoryRouter><KalenderRencana /></MemoryRouter>);

/** Sel tanggal dikenali lewat aria-label "YYYY-MM-DD: N agenda, M realisasi". */
const sel = (kunci: string) => screen.getByRole('button', { name: new RegExp(`^${kunci}:`) });

beforeEach(() => {
  vi.clearAllMocks();
  peranSaatIni = 'admin_bidang';
  getPeriode.mockResolvedValue([PERIODE]);
  getKalenderBulan.mockResolvedValue(kalender());
  getRencanaSayaRingkas.mockResolvedValue([]);
  simpanAgenda.mockResolvedValue(undefined);
  hapusAgenda.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('KalenderRencana', () => {
  it('menampilkan penanda agenda dan realisasi pada sel tanggalnya', async () => {
    tampilkan();

    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    expect(sel('2026-02-10').getAttribute('aria-label')).toMatch(/1 agenda, 0 realisasi/);
    expect(sel('2026-02-11').getAttribute('aria-label')).toMatch(/0 agenda, 1 realisasi/);
    expect(sel('2026-02-12').getAttribute('aria-label')).toMatch(/0 agenda, 0 realisasi/);
  });

  it('mengklik tanggal membuka daftar agenda hari itu', async () => {
    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    await userEvent.click(sel('2026-02-10'));

    expect(screen.getByText('Rapat koordinasi RINOVA')).toBeTruthy();
    expect(screen.getByText('Ruang rapat lantai 2')).toBeTruthy();
  });

  it('menampilkan realisasi tercatat di panel hari', async () => {
    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    await userEvent.click(sel('2026-02-11'));

    expect(screen.getByText('Menyusun laporan bulanan')).toBeTruthy();
  });

  it('admin_bidang tidak mengirim bidang_id — server yang mengunci ke bidangnya', async () => {
    tampilkan();

    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());
    expect(getKalenderBulan.mock.calls[0][0].bidangId).toBe(null);
  });

  it('admin_aplikasi melihat penyaring bidang dan tidak melihat tombol tambah agenda', async () => {
    peranSaatIni = 'admin_aplikasi';
    getKalenderBulan.mockResolvedValue(kalender({ dapatMenjadwalkan: false }));

    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());
    await userEvent.click(sel('2026-02-10'));

    expect(screen.getByLabelText('Saring bidang')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Agenda$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ubah agenda' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hapus agenda' })).toBeNull();
  });

  it('tombol tambah mati saat periode tidak menerima penjadwalan', async () => {
    getKalenderBulan.mockResolvedValue(kalender({ dapatMenjadwalkan: false }));

    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());
    await userEvent.click(sel('2026-02-10'));

    expect(screen.queryByRole('button', { name: /Agenda$/ })).toBeNull();
  });

  it('navigasi bulan dikunci ke rentang periode', async () => {
    // Periode Jan–Mar, bulan tampil Februari: kedua tombol hidup.
    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    const sebelum = screen.getByRole('button', { name: 'Bulan sebelumnya' }) as HTMLButtonElement;
    const sesudah = screen.getByRole('button', { name: 'Bulan berikutnya' }) as HTMLButtonElement;
    expect(sebelum.disabled).toBe(false);
    expect(sesudah.disabled).toBe(false);
  });

  it('dropdown bulan memindahkan kalender langsung ke bulan pilihan', async () => {
    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    await userEvent.selectOptions(screen.getByLabelText('Pilih bulan'), '2026-03');

    await waitFor(() =>
      expect(getKalenderBulan).toHaveBeenLastCalledWith(
        expect.objectContaining({ bulan: '2026-03' }),
      ),
    );
  });

  it('menampilkan preview tahunan dan membuka bulan yang dipilih', async () => {
    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    await userEvent.click(screen.getByRole('button', { name: 'Periode' }));

    expect(await screen.findByText('Preview tahun 2026')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Buka Januari 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Buka Februari 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Buka Maret 2026' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Buka April 2026' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Buka Januari 2026' }));
    expect(screen.getByRole('button', { name: 'Bulanan' }).getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByLabelText('Pilih bulan') as HTMLSelectElement).value).toBe('2026-01');
  });

  it('tombol bulan sebelumnya mati di bulan pertama periode', async () => {
    getKalenderBulan.mockResolvedValue(
      kalender({ bulan: '2026-01', rentang: { dari: '2025-12-29', sampai: '2026-02-01' } }),
    );

    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    const sebelum = screen.getByRole('button', { name: 'Bulan sebelumnya' }) as HTMLButtonElement;
    expect(sebelum.disabled).toBe(true);
  });

  it('menandai sel di luar periode dan tidak menawarkan tambah agenda di sana', async () => {
    getKalenderBulan.mockResolvedValue(
      kalender({
        periode: { ...PERIODE, tanggalMulai: '2026-02-05', tanggalSelesai: '2026-02-20' },
      }),
    );

    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());
    await userEvent.click(sel('2026-02-03'));

    expect(screen.getByText('Tanggal ini di luar rentang periode.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Agenda$/ })).toBeNull();
  });

  it('menampilkan ringkasan agenda terlewat dari server', async () => {
    getKalenderBulan.mockResolvedValue(
      kalender({
        agenda: [agenda({ terlewat: true })],
        ringkasan: { jumlahAgenda: 1, jumlahRealisasi: 1, agendaTerlewat: 1 },
      }),
    );

    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    const kartu = screen.getByText('Agenda terlewat').closest('div')!;
    expect(within(kartu).getByText('1')).toBeTruthy();
  });

  it('menampilkan pesan galat saat pemuatan kalender gagal', async () => {
    getKalenderBulan.mockRejectedValue(new Error('boom'));

    tampilkan();

    await waitFor(() => expect(screen.getByText('Gagal memuat kalender.')).toBeTruthy());
  });

  it('mengisi form tambah agenda dan menyimpannya lewat simpanAgenda', async () => {
    getRencanaSayaRingkas.mockResolvedValue([detailSubkegiatan()]);
    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());
    await waitFor(() => expect(getRencanaSayaRingkas).toHaveBeenCalled());

    await userEvent.click(sel('2026-02-12'));
    await userEvent.click(screen.getByRole('button', { name: /Agenda$/ }));

    expect(await screen.findByText('Tambah agenda')).toBeTruthy();
    await userEvent.selectOptions(screen.getByLabelText('Aktivitas'), '8');
    await userEvent.type(screen.getByLabelText('Judul agenda'), 'Rapat pembahasan baru');
    // Muat awal memanggil getKalenderBulan dua kali (sekali tanpa bulan, sekali lagi setelah
    // bulan default server tersimpan ke state) — ambil baseline setelah stabil, bukan angka tetap.
    const panggilanSebelum = getKalenderBulan.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() =>
      expect(simpanAgenda).toHaveBeenCalledWith({
        id: null,
        aktifitasBidangId: 8,
        judulAgenda: 'Rapat pembahasan baru',
        tanggalMulai: '2026-02-12',
        tanggalSelesai: '2026-02-12',
        jumlahRencana: 1,
        lokasi: '',
        keterangan: '',
        status: undefined,
      }),
    );
    // onTersimpan memicu refresh kalender.
    await waitFor(() => expect(getKalenderBulan.mock.calls.length).toBeGreaterThan(panggilanSebelum));
  });

  it('mengubah agenda lewat tombol Ubah agenda dan memanggil simpanAgenda dengan id semula', async () => {
    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    await userEvent.click(sel('2026-02-10'));
    await userEvent.click(screen.getByRole('button', { name: 'Ubah agenda' }));

    expect(await screen.findByText('Ubah agenda')).toBeTruthy();
    const judul = screen.getByLabelText('Judul agenda') as HTMLInputElement;
    await userEvent.clear(judul);
    await userEvent.type(judul, 'Rapat koordinasi direvisi');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() =>
      expect(simpanAgenda).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 41,
          aktifitasBidangId: 7,
          judulAgenda: 'Rapat koordinasi direvisi',
          tanggalMulai: '2026-02-10',
          tanggalSelesai: '2026-02-10',
          status: 'RENCANA',
        }),
      ),
    );
  });

  it('menghapus agenda lewat konfirmasi dan memanggil hapusAgenda', async () => {
    tampilkan();
    await waitFor(() => expect(getKalenderBulan).toHaveBeenCalled());

    await userEvent.click(sel('2026-02-10'));
    await userEvent.click(screen.getByRole('button', { name: 'Hapus agenda' }));

    expect(await screen.findByText('Hapus agenda ini?')).toBeTruthy();
    const panggilanSebelum = getKalenderBulan.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Hapus' }));

    await waitFor(() => expect(hapusAgenda).toHaveBeenCalledWith(41));
    await waitFor(() => expect(getKalenderBulan.mock.calls.length).toBeGreaterThan(panggilanSebelum));
  });
});
