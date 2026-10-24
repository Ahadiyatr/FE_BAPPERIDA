// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import KontrolHalaman from '@/components/Pagination';

afterEach(cleanup);

function props(ubah: Partial<React.ComponentProps<typeof KontrolHalaman>> = {}) {
  return {
    halaman: 1, ukuran: 10, totalHalaman: 3, total: 23, dari: 1, sampai: 10,
    ...ubah,
    setHalaman: vi.fn<(halaman: number) => void>(),
    setUkuran: vi.fn<(ukuran: number) => void>(),
  };
}

describe('KontrolHalaman', () => {
  it('menampilkan rentang data dan mengganti ukuran', () => {
    const p = props();
    render(<KontrolHalaman {...p} />);
    expect(screen.getByText('Menampilkan 1–10 dari 23 data')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Jumlah data per halaman'), { target: { value: '25' } });
    expect(p.setUkuran).toHaveBeenCalledWith(25);
  });

  it('menonaktifkan tombol di ujung dan berpindah halaman', () => {
    const p = props();
    render(<KontrolHalaman {...p} />);
    expect((screen.getByLabelText('Halaman sebelumnya') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Halaman berikutnya') as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByLabelText('Halaman berikutnya'));
    fireEvent.click(screen.getByLabelText('Halaman 3'));
    expect(p.setHalaman.mock.calls).toEqual([[2], [3]]);
  });

  it('menyembunyikan navigasi bila hanya satu halaman, dan seluruhnya bila kosong', () => {
    const { rerender, container } = render(
      <KontrolHalaman {...props({ totalHalaman: 1, total: 4, sampai: 4 })} />,
    );
    expect(screen.queryByLabelText('Navigasi halaman')).toBeNull();
    expect(screen.getByText('Menampilkan 1–4 dari 4 data')).toBeTruthy();

    rerender(<KontrolHalaman {...props({ totalHalaman: 1, total: 0, dari: 0, sampai: 0 })} />);
    expect(container.innerHTML).toBe('');
  });
});
