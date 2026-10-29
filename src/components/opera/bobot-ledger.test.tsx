// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LedgerCapaian, LedgerTambahPendukung } from './bobot-ledger';

afterEach(cleanup);

describe('BobotLedger', () => {
  it('rincian bobot dua desimal, total capaian satu desimal seperti layar lain', () => {
    render(<LedgerCapaian bobotUtama={42.35} bobotPendukung={27.73} jumlahPendukung={3} />);

    expect(screen.getByText('42,35%')).toBeTruthy();
    expect(screen.getByText('27,73%')).toBeTruthy();
    expect(screen.getByText('70,1%')).toBeTruthy();
  });

  it('bobot pendukung baru tampil dua desimal agar n × bobot tetap 30%', () => {
    render(<LedgerTambahPendukung jumlahSekarang={6} />);

    expect(screen.getByText('Bobot baris baru ini').parentElement?.textContent).toContain('4,29%');
  });
});
