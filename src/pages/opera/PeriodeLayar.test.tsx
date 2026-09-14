// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PeriodeLayar from './PeriodeLayar';

const getPeriode = vi.fn();
const getDokumen = vi.fn();

vi.mock('@/services', () => ({
  getPeriode: (...args: unknown[]) => getPeriode(...args),
  getDokumen: (...args: unknown[]) => getDokumen(...args),
  cekSyaratBuka: vi.fn(),
  simpanPeriode: vi.fn(),
  ubahStatusPeriode: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  apiMessage: (_error: unknown, fallback: string) => fallback,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getPeriode.mockResolvedValue([]);
  getDokumen.mockResolvedValue([]);
});

afterEach(cleanup);

describe('PeriodeLayar', () => {
  it('membuka form tambah dengan nama dan deskripsi dialog yang aksesibel', async () => {
    render(<PeriodeLayar />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Tambah periode' }),
    );

    expect(
      screen.getByRole('dialog', {
        name: 'Periode baru',
        description: /pilih dokumen perencanaan/i,
      }),
    ).toBeTruthy();
  });
});
