// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Login from './Login';
import { normalkanTujuanLogin } from '../lib/tujuan-login';

const login = vi.fn();
const fire = vi.fn();
const sesi = {
  user: null as null | {
    id: number;
    name: string;
    email: string;
    role: 'admin_bidang' | 'admin_aplikasi';
    bidang: { id: number; nama_bidang: string }[];
  },
};

vi.mock('../lib/peran', async () => {
  const actual = await vi.importActual<typeof import('../lib/peran')>('../lib/peran');
  return {
    ...actual,
    usePeran: () => ({
      login,
      user: sesi.user,
      memuat: false,
    }),
  };
});

vi.mock('../services/api', () => ({
  apiMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) =>
    error.response?.data?.message ?? fallback,
}));

vi.mock('sweetalert2', () => ({
  default: { fire: (...args: unknown[]) => fire(...args) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sesi.user = null;
});

afterEach(cleanup);

describe('Login', () => {
  const adminAplikasi = {
    id: 1,
    name: 'Admin Aplikasi',
    email: 'admin@bapperida.test',
    role: 'admin_aplikasi' as const,
    bidang: [],
  };
  const adminBidang = {
    ...adminAplikasi,
    role: 'admin_bidang' as const,
    bidang: [{ id: 2, nama_bidang: 'PPM' }],
  };

  function LokasiSekarang() {
    const lokasi = useLocation();
    return <div data-testid="lokasi">{`${lokasi.pathname}${lokasi.search}${lokasi.hash}`}</div>;
  }

  function renderLogin(initialEntry: string | { pathname: string; state?: unknown } = '/login') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<LokasiSekarang />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  async function masukSebagai(pengguna: typeof adminAplikasi | typeof adminBidang) {
    login.mockResolvedValue(pengguna);
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
  }

  it('menampilkan pesan login gagal tanpa mencetak payload kredensial ke console', async () => {
    const error = {
      response: {
        data: { success: false, message: 'Email atau password salah.' },
      },
      config: {
        data: JSON.stringify({
          email: 'admin@bapperida.test',
          password: 'rahasia-sekali',
        }),
      },
    };
    login.mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderLogin();

    const password = screen.getByLabelText('Password');
    await userEvent.clear(password);
    await userEvent.type(password, 'rahasia-sekali');
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    expect(await screen.findByText('Email atau password salah.')).toBeTruthy();
    await waitFor(() => expect(fire).toHaveBeenCalled());
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('kembali ke route tersimpan lengkap dengan query dan hash', async () => {
    sessionStorage.setItem(
      'opera:redirect_after_login',
      '/monitoring/subkegiatan/42?periode=9#bukti',
    );
    sessionStorage.setItem('opera:session_expired', '1');
    renderLogin();

    await masukSebagai(adminAplikasi);

    expect((await screen.findByTestId('lokasi')).textContent).toBe(
      '/monitoring/subkegiatan/42?periode=9#bukti',
    );
    expect(sessionStorage.getItem('opera:redirect_after_login')).toBeNull();
    expect(sessionStorage.getItem('opera:session_expired')).toBeNull();
  });

  it('memakai navigation state ketika tidak ada tujuan sesi tersimpan', async () => {
    renderLogin({ pathname: '/login', state: { dari: '/realisasi?periode=9#form' } });

    await masukSebagai(adminBidang);

    expect((await screen.findByTestId('lokasi')).textContent).toBe('/realisasi?periode=9#form');
  });

  it('jatuh ke dashboard ketika tujuan tidak sesuai hak akses pengguna', async () => {
    sessionStorage.setItem('opera:redirect_after_login', '/monitoring/subkegiatan/42');
    renderLogin();

    await masukSebagai(adminBidang);

    expect((await screen.findByTestId('lokasi')).textContent).toBe('/dashboard');
  });

  it('jatuh ke dashboard tanpa route asal', async () => {
    renderLogin();

    await masukSebagai(adminAplikasi);

    expect((await screen.findByTestId('lokasi')).textContent).toBe('/dashboard');
  });

  it.each([
    'https://jahat.example/ambil-sesi',
    '//jahat.example/ambil-sesi',
    '/\\jahat.example/ambil-sesi',
    ' /monitoring',
    '/login',
  ])('menolak tujuan open redirect atau tidak aman: %s', (tujuan) => {
    expect(normalkanTujuanLogin(tujuan)).toBeNull();
  });
});
