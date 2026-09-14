import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  getProgram: vi.fn(),
  getKegiatan: vi.fn(),
  getKegiatanById: vi.fn(),
  getBidang: vi.fn(),
}));

vi.mock('./api', () => ({
  api: { get: (...args: unknown[]) => mocks.apiGet(...args) },
  dataOf: (response: { data: { data: unknown } }) => response.data.data,
}));
vi.mock('./program.service', () => ({ getProgram: mocks.getProgram }));
vi.mock('./kegiatan.service', () => ({
  getKegiatan: mocks.getKegiatan,
  getKegiatanById: mocks.getKegiatanById,
}));
vi.mock('./bidang.service', () => ({ getBidang: mocks.getBidang }));
vi.mock('./periode.service', () => ({ getPeriode: vi.fn() }));

import { getCapaianProgram, getRincianKegiatan } from './capaian.service';

beforeEach(() => vi.clearAllMocks());

describe('capaian service', () => {
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
