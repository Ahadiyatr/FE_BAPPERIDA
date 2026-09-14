// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PenyusunanRencana from './PenyusunanRencana';

const getPeriode = vi.fn();

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
Element.prototype.scrollIntoView = vi.fn();

vi.mock('@/services', () => ({
  getPeriode: (...args: unknown[]) => getPeriode(...args),
}));

vi.mock('./rencana/PanelPenunjukan', () => ({
  PanelPenunjukan: ({ periode }: { periode: { namaPeriode: string } }) =>
    <div>Rencana {periode.namaPeriode}</div>,
}));

vi.mock('./rencana/PapanKesiapan', () => ({
  PapanKesiapan: () => <div>Papan kesiapan</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getPeriode.mockResolvedValue(
    Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      dokumenId: 1,
      namaPeriode: `Triwulan ${index + 1}`,
      tanggalMulai: `2026-${String((index % 9) + 1).padStart(2, '0')}-01`,
      tanggalSelesai: `2026-${String((index % 9) + 1).padStart(2, '0')}-28`,
      status: index === 0 ? 'DRAFT' : 'LOCKED',
    })),
  );
});

afterEach(cleanup);

describe('PenyusunanRencana', () => {
  it('memilih banyak periode melalui combobox yang dapat dicari', async () => {
    render(<PenyusunanRencana />, { wrapper: MemoryRouter });

    const pemilih = await screen.findByRole('combobox', { name: 'Pilih periode penyusunan' });
    expect(pemilih.textContent).toContain('Triwulan 1');
    expect(pemilih.textContent).not.toContain('01 Jan 2026');

    await userEvent.click(pemilih);
    expect(screen.getAllByText(/01 Jan 2026/).length).toBeGreaterThan(0);
    await userEvent.type(screen.getByPlaceholderText('Cari periode…'), 'Triwulan 12');
    await userEvent.click(screen.getByText('Triwulan 12'));

    expect(pemilih.textContent).toContain('Triwulan 12');
    expect(screen.getByText('Rencana Triwulan 12')).toBeTruthy();
  });
});
