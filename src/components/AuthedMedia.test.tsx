// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../services/api', () => ({ default: api }));

import { AuthedImage, kosongkanCacheBlob } from './AuthedMedia';

beforeEach(() => {
  vi.clearAllMocks();
  kosongkanCacheBlob();
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

it('foto yang sama dipasang dua kali hanya memicu satu request', async () => {
  render(
    <>
      <AuthedImage lampiranId={7} alt="a" />
      <AuthedImage lampiranId={7} alt="b" />
    </>,
  );

  await screen.findByAltText('a');
  await screen.findByAltText('b');
  expect(api.get).toHaveBeenCalledTimes(1);
});

it('dipasang ulang setelah unmount memakai cache tanpa request baru', async () => {
  const { unmount } = render(<AuthedImage lampiranId={7} alt="foto" />);
  await screen.findByAltText('foto');
  unmount();
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();

  render(<AuthedImage lampiranId={7} alt="foto" />);
  expect((screen.getByAltText('foto') as HTMLImageElement).src).toBe('blob:foto');
  expect(api.get).toHaveBeenCalledTimes(1);
});

it('galat tidak di-cache sehingga bisa dicoba lagi', async () => {
  api.get.mockRejectedValueOnce({ response: { status: 500 } });
  const { unmount } = render(<AuthedImage lampiranId={8} alt="foto" />);
  expect(await screen.findByText('NO FOTO')).toBeTruthy();
  unmount();

  render(<AuthedImage lampiranId={8} alt="foto" />);
  await screen.findByAltText('foto');
  expect(api.get).toHaveBeenCalledTimes(2);
});
