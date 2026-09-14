// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PenyediaPeran } from './peran';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
  api: { get: vi.fn() },
  dataOf: vi.fn(),
  ensureCsrf: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, '', '/');
});

afterEach(cleanup);

describe('PenyediaPeran', () => {
  it('tidak memeriksa sesi pada halaman login', () => {
    window.history.replaceState({}, '', '/login');

    render(
      <PenyediaPeran>
        <div>Halaman login</div>
      </PenyediaPeran>,
    );

    expect(api.get).not.toHaveBeenCalled();
  });

  it('menampilkan AlertDialog bawaan template ketika sesi berakhir', async () => {
    render(
      <PenyediaPeran>
        <div>Konten aplikasi</div>
      </PenyediaPeran>,
    );

    window.dispatchEvent(new CustomEvent('opera:unauthorized'));

    expect(await screen.findByRole('alertdialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Sesi berakhir' })).toBeTruthy();
    expect(screen.getByText(/masa aktif sesi Anda telah habis/i)).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Masuk kembali' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
