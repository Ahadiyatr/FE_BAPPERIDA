import { describe, expect, it } from 'vitest';

import { persen1, persen2 } from './format-angka';

describe('format-angka', () => {
  it('persen1 membulatkan setengah ke atas, bukan mengikuti nilai biner seperti toFixed', () => {
    expect(persen1(1.45)).toBe('1,5%');
    expect(persen1(70.05)).toBe('70,1%');
    expect(persen1(70.08)).toBe('70,1%');
    expect(persen1(100)).toBe('100,0%');
  });

  it('persen2 untuk rincian bobot selalu dua desimal', () => {
    expect(persen2(30 / 7)).toBe('4,29%');
    expect(persen2(30)).toBe('30,00%');
  });
});
