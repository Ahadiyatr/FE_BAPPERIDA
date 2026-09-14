// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BobotMeter, BobotMeterLegenda } from './bobot-meter';

afterEach(cleanup);

describe('BobotMeter', () => {
  it('membedakan alokasi utama dan pendukung serta menjelaskan progres', () => {
    render(
      <>
        <BobotMeter
          utama={{ nama: 'Utama', target: 10, realisasi: 5, bobotTarget: 70 }}
          pendukung={[
            { nama: 'P1', target: 1, realisasi: 1, bobotTarget: 10 },
            { nama: 'P2', target: 1, realisasi: 0, bobotTarget: 10 },
            { nama: 'P3', target: 1, realisasi: 0, bobotTarget: 10 },
          ]}
        />
        <BobotMeterLegenda bobotUtama={70} bobotPendukung={[10, 10, 10]} />
      </>,
    );

    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/utama 35,0% dari 70,0%/i);
    expect(screen.getByText('70,0%')).toBeTruthy();
    expect(screen.getByText('30,0%')).toBeTruthy();
    expect(screen.getByText('3 aktivitas · masing-masing 10,0%')).toBeTruthy();
    expect(screen.getByText(/warna pekat menunjukkan/i)).toBeTruthy();
  });

  it('meringkas bobot pendukung yang tidak seragam tanpa daftar panjang', () => {
    render(<BobotMeterLegenda bobotPendukung={[4.29, 4.29, 4.26]} />);

    expect(screen.getByText('3 aktivitas · bobot disesuaikan per aktivitas')).toBeTruthy();
  });
});
