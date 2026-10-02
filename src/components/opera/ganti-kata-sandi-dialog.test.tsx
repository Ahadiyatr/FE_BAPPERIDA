// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GantiKataSandiDialog } from './ganti-kata-sandi-dialog';

const gantiKataSandi = vi.fn();

vi.mock('@/services', () => ({
  gantiKataSandi: (...a: unknown[]) => gantiKataSandi(...a),
}));
vi.mock('@/services/api', () => ({
  apiMessage: (_e: unknown, fallback: string) => fallback,
}));
vi.mock('@/utils/toast', () => ({
  Toast: { fire: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

describe('GantiKataSandiDialog', () => {
  it('mengirim kata sandi lama dan baru lalu menutup dialog saat berhasil', async () => {
    gantiKataSandi.mockResolvedValue(undefined);
    const onTutup = vi.fn();
    render(<GantiKataSandiDialog terbuka onTutup={onTutup} />);

    await userEvent.type(screen.getByLabelText('Kata sandi saat ini'), 'lamasekali');
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'SandiBaru1234');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'SandiBaru1234');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(gantiKataSandi).toHaveBeenCalledWith('lamasekali', 'SandiBaru1234'));
    await waitFor(() => expect(onTutup).toHaveBeenCalled());
  });

  it('menonaktifkan Simpan saat sandi baru tidak memenuhi kebijakan atau konfirmasi tidak cocok', async () => {
    render(<GantiKataSandiDialog terbuka onTutup={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Kata sandi saat ini'), 'lamasekali');
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'pendek');
    expect(screen.getByText('Minimal 12 karakter, berisi huruf dan angka.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);

    await userEvent.clear(screen.getByLabelText('Kata sandi baru'));
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'SandiBaru1234');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'beda12345');
    expect(screen.getByText('Konfirmasi belum cocok.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('menolak kata sandi baru yang sama dengan kata sandi lama', async () => {
    render(<GantiKataSandiDialog terbuka onTutup={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Kata sandi saat ini'), 'SamaSekali123');
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'SamaSekali123');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'SamaSekali123');

    expect(screen.getByText('Kata sandi baru harus berbeda dari yang sekarang.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
    expect(gantiKataSandi).not.toHaveBeenCalled();
  });

  it('menampilkan pesan galat dari server dan tidak menutup dialog', async () => {
    gantiKataSandi.mockRejectedValue(new Error('boom'));
    const onTutup = vi.fn();
    render(<GantiKataSandiDialog terbuka onTutup={onTutup} />);

    await userEvent.type(screen.getByLabelText('Kata sandi saat ini'), 'lamasekali');
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'SandiBaru1234');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'SandiBaru1234');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Gagal mengganti kata sandi.')).toBeTruthy();
    expect(onTutup).not.toHaveBeenCalled();
  });
});
