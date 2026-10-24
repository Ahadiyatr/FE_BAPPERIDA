// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('./api', () => ({ api: mocks }));

import { eksporLaporan, namaBerkasDariHeader } from './laporan.service';

let diunduh: string[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  diunduh = [];
  URL.createObjectURL = vi.fn(() => 'blob:laporan');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    diunduh.push(this.download);
  });
});

afterEach(() => vi.restoreAllMocks());

describe('eksporLaporan', () => {
  it('memakai nama berkas dari Content-Disposition backend', async () => {
    mocks.get.mockResolvedValue({
      data: new Blob(['a,b']),
      headers: { 'content-disposition': 'attachment; filename=laporan-rincian-triwulan-iv-2026.csv' },
    });

    await eksporLaporan(3, 'rincian');

    expect(mocks.get).toHaveBeenCalledWith('/laporan/export', {
      params: { periode_id: 3, jenis: 'rincian' },
      responseType: 'blob',
    });
    expect(diunduh).toEqual(['laporan-rincian-triwulan-iv-2026.csv']);
  });

  it('kembali ke nama generik bila header tidak terbaca', async () => {
    mocks.get.mockResolvedValue({ data: new Blob(['a,b']), headers: {} });

    await eksporLaporan(3, 'bidang');

    expect(diunduh).toEqual(['laporan-bidang.csv']);
  });
});

describe('namaBerkasDariHeader', () => {
  it('mendahulukan filename* UTF-8 dan menerima filename bertanda kutip', () => {
    expect(namaBerkasDariHeader(`attachment; filename=lama.csv; filename*=UTF-8''laporan%20baru.csv`)).toBe('laporan baru.csv');
    expect(namaBerkasDariHeader('attachment; filename="laporan-bidang-x.csv"')).toBe('laporan-bidang-x.csv');
    expect(namaBerkasDariHeader(undefined)).toBeNull();
  });
});
