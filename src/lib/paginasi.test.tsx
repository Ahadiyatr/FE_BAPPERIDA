// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { nomorHalaman, usePaginasi } from '@/lib/paginasi';

const deret = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('usePaginasi', () => {
  it('memotong baris sesuai halaman dan ukuran', () => {
    const { result } = renderHook(() => usePaginasi(deret(23)));
    expect(result.current.potongan).toEqual(deret(10));
    expect(result.current.totalHalaman).toBe(3);

    act(() => result.current.setHalaman(3));
    expect(result.current.potongan).toEqual([21, 22, 23]);
    expect([result.current.dari, result.current.sampai, result.current.total]).toEqual([21, 23, 23]);
  });

  it('mengganti ukuran kembali ke halaman 1', () => {
    const { result } = renderHook(() => usePaginasi(deret(60)));
    act(() => result.current.setHalaman(4));
    act(() => result.current.setUkuran(25));
    expect(result.current.halaman).toBe(1);
    expect(result.current.potongan).toHaveLength(25);
  });

  it('menjepit halaman bila baris menyusut', () => {
    const { result, rerender } = renderHook(({ baris }) => usePaginasi(baris), {
      initialProps: { baris: deret(30) },
    });
    act(() => result.current.setHalaman(3));
    rerender({ baris: deret(15) });
    expect(result.current.halaman).toBe(2);
    expect(result.current.potongan).toEqual([11, 12, 13, 14, 15]);
  });

  it('kembali ke halaman 1 hanya saat kunciReset berubah, bukan saat data dimuat ulang', () => {
    const { result, rerender } = renderHook(
      ({ baris, cari }) => usePaginasi(baris, { kunciReset: [cari] }),
      { initialProps: { baris: deret(30), cari: '' } },
    );
    act(() => result.current.setHalaman(2));

    rerender({ baris: deret(30), cari: '' });
    expect(result.current.halaman).toBe(2);

    rerender({ baris: deret(30), cari: 'a' });
    expect(result.current.halaman).toBe(1);
  });

  it('melaporkan rentang kosong tanpa baris', () => {
    const { result } = renderHook(() => usePaginasi([]));
    expect([result.current.dari, result.current.sampai, result.current.totalHalaman]).toEqual([0, 0, 1]);
  });
});

describe('nomorHalaman', () => {
  it('menampilkan semua nomor bila sedikit', () => {
    expect(nomorHalaman(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('menyisipkan elipsis di sekitar halaman aktif', () => {
    expect(nomorHalaman(1, 20)).toEqual([1, 2, 3, 4, null, 20]);
    expect(nomorHalaman(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
    expect(nomorHalaman(20, 20)).toEqual([1, null, 17, 18, 19, 20]);
  });
});
