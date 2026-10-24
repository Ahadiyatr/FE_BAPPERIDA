import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  getProgram: vi.fn(),
  getKegiatan: vi.fn(),
  getKegiatanById: vi.fn(),
  getBidang: vi.fn(),
  getPeriode: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    get: (...args: unknown[]) => mocks.apiGet(...args),
    post: (...args: unknown[]) => mocks.apiPost(...args),
  },
  dataOf: (response: { data: { data: unknown } }) => response.data.data,
}));
vi.mock('./program.service', () => ({ getProgram: mocks.getProgram }));
vi.mock('./kegiatan.service', () => ({
  getKegiatan: mocks.getKegiatan,
  getKegiatanById: mocks.getKegiatanById,
}));
vi.mock('./bidang.service', () => ({ getBidang: mocks.getBidang }));
vi.mock('./periode.service', () => ({ getPeriode: mocks.getPeriode }));

import {
  getCapaianPeriode,
  getCapaianProgram,
  getRincianKegiatan,
  getRingkasanDashboard,
  hitungUlangCapaian,
} from './capaian.service';

beforeEach(() => vi.clearAllMocks());

describe('capaian service', () => {
  it('menampilkan angka ringkasan API tanpa menggantinya dengan nol', async () => {
    mocks.getPeriode.mockResolvedValue([{ id: 4, status: 'OPEN' }]);
    mocks.apiGet.mockResolvedValue({ data: { data: { ringkasan: {
      capaian_pd: 93.5, jumlah_bidang: 1, jumlah_bidang_siap: 1,
      jumlah_subkegiatan: 4, jumlah_aktifitas: 67, jumlah_realisasi: 143,
    } } } });
    await expect(getRingkasanDashboard(4)).resolves.toMatchObject({
      capaianPd: 93.5, jumlahBidang: 1, jumlahBidangSiap: 1,
      jumlahSubkegiatan: 4, jumlahAktifitas: 67, jumlahRealisasi: 143,
    });
  });

  it('membaca snapshot dan menjalankan pemulihan capaian periode', async () => {
    const response = {
      data: {
        data: {
          periode_id: 4,
          capaian_pd: 65.39,
          rincian: [{
            bidang_id: 2,
            capaian_bidang: 70,
            dihitung_pada: '2026-10-02T12:00:00+07:00',
            bidang: { nama_bidang: 'P2EPD' },
          }],
        },
      },
    };
    mocks.apiGet.mockResolvedValue(response);
    mocks.apiPost.mockResolvedValue(response);

    await expect(getCapaianPeriode(4)).resolves.toMatchObject({
      periodeId: 4,
      capaianPd: 65.39,
      rincian: [{ namaBidang: 'P2EPD', capaianBidang: 70 }],
    });
    await expect(hitungUlangCapaian(4)).resolves.toMatchObject({ capaianPd: 65.39 });

    expect(mocks.apiGet).toHaveBeenCalledWith('/periode/4/capaian');
    expect(mocks.apiPost).toHaveBeenCalledWith('/periode/4/hitung-ulang');
  });

  it('memakai master termasuk nonaktif untuk mendapatkan ID kegiatan historis', async () => {
    mocks.getProgram.mockResolvedValue([
      { id: 7, kodeProgram: 'P-1', namaProgram: 'Program', flagActive: false },
    ]);
    mocks.getKegiatan.mockResolvedValue([
      { id: 42, programId: 7, kodeKegiatan: 'K-1', namaKegiatan: 'Kegiatan', flagActive: false },
    ]);
    mocks.getBidang.mockResolvedValue([]);
    mocks.apiGet.mockResolvedValue({
      data: {
        data: {
          program: [{
            kode_program: 'P-1',
            nama_program: 'Program',
            jumlah_subkegiatan: 0,
            capaian: 0,
            kegiatan: [{
              kode_kegiatan: 'K-1',
              nama_kegiatan: 'Kegiatan',
              jumlah_subkegiatan: 0,
              capaian: 0,
              subkegiatan: [],
            }],
          }],
        },
      },
    });

    const hasil = await getCapaianProgram(3);

    expect(mocks.getProgram).toHaveBeenCalledWith({ termasukNonaktif: true });
    expect(mocks.getKegiatan).toHaveBeenCalledWith({ termasukNonaktif: true });
    expect(mocks.getBidang).toHaveBeenCalledWith({ termasukNonaktif: true });
    expect(hasil[0].perKegiatan[0].kegiatanId).toBe(42);
  });

  it('tidak mengirim request kegiatan untuk ID nol', async () => {
    await expect(getRincianKegiatan(0, 3)).resolves.toEqual([]);
    expect(mocks.getKegiatanById).not.toHaveBeenCalled();
    expect(mocks.apiGet).not.toHaveBeenCalled();
  });
});
