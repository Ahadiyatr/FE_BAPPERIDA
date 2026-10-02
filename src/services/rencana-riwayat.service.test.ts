import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiGet = vi.fn();

vi.mock('./api', () => ({
  api: { get: (...args: unknown[]) => apiGet(...args) },
  dataOf: (response: { data: { data: unknown } }) => response.data.data,
}));

import { getPeriodeRiwayatRencanaSaya } from './rencana.service';

beforeEach(() => vi.clearAllMocks());

describe('riwayat rencana bidang', () => {
  it('mengembalikan ID periode terkunci yang mempunyai rencana bidang', async () => {
    apiGet.mockResolvedValue({
      data: { data: [{ periode_id: 3 }, { periode_id: 3 }, { periode_id: 7 }] },
    });

    await expect(getPeriodeRiwayatRencanaSaya()).resolves.toEqual(new Set([3, 7]));
    expect(apiGet).toHaveBeenCalledWith('/bidang-saya/riwayat');
  });
});
