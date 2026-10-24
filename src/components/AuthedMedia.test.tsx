// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../services/api', () => ({ default: api }));

import { AuthedImage } from './AuthedMedia';

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom tidak menyediakan object URL.
  URL.createObjectURL = vi.fn(() => 'blob:foto');
  URL.revokeObjectURL = vi.fn();
  api.get.mockResolvedValue({ data: new Blob(['x']) });
});

afterEach(cleanup);

it('menampilkan foto setelah blob ber-auth termuat', async () => {
  render(<AuthedImage lampiranId={7} alt="dokumentasi.png" />);

  const img = (await screen.findByAltText('dokumentasi.png')) as HTMLImageElement;
  expect(img.src).toBe('blob:foto');
  expect(api.get).toHaveBeenCalledWith('/lampiran/7/preview', { responseType: 'blob' });
});

it('menandai foto rusak bila browser gagal men-decode gambarnya', async () => {
  render(<AuthedImage lampiranId={7} alt="dokumentasi.png" />);

  fireEvent.error(await screen.findByAltText('dokumentasi.png'));

  expect(screen.getByText('FOTO RUSAK')).toBeTruthy();
  expect(screen.queryByAltText('dokumentasi.png')).toBeNull();
});
