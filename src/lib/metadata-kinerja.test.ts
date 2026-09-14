import { describe, expect, it } from 'vitest';

import {
  OUTPUT_BELUM_TERSEDIA,
  SATUAN_BELUM_TERSEDIA,
  teksOutputKinerja,
  teksSatuanKinerja,
} from '@/lib/metadata-kinerja';

describe('metadata kinerja', () => {
  it('mempertahankan dan merapikan nilai sumber yang tersedia', () => {
    expect(teksSatuanKinerja(' dokumen ')).toBe('dokumen');
    expect(teksOutputKinerja(' Laporan evaluasi ')).toBe('Laporan evaluasi');
  });

  it.each([null, undefined, '', '   '])(
    'menandai satuan kosong (%s) secara transparan',
    nilai => expect(teksSatuanKinerja(nilai)).toBe(SATUAN_BELUM_TERSEDIA),
  );

  it.each([null, undefined, '', '   '])(
    'menandai output kosong (%s) secara transparan',
    nilai => expect(teksOutputKinerja(nilai)).toBe(OUTPUT_BELUM_TERSEDIA),
  );
});
