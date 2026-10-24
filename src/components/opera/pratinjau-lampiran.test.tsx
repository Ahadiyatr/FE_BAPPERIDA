// @vitest-environment jsdom

import * as React from 'react';
import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/components/AuthedMedia', () => ({
  AuthedImage: ({ alt }: { alt?: string }) => <img alt={alt} />,
  DocumentPreview: () => null,
  downloadAuthedFile: vi.fn(),
}));

import type { RealisasiLampiran } from '@/services';
import { PratinjauLampiran } from './pratinjau-lampiran';

afterEach(cleanup);

const berkas = (
  id: number,
  tipeBerkas: 'FOTO' | 'DOKUMEN',
  namaBerkas: string,
): RealisasiLampiran => ({
  id,
  realisasiId: 1,
  tipeBerkas,
  namaBerkas,
  pathBerkas: '',
  ukuranByte: 1024,
});

const daftar = [
  berkas(1, 'FOTO', 'satu.png'),
  berkas(2, 'DOKUMEN', 'notulen.pdf'),
  berkas(3, 'FOTO', 'dua.png'),
  berkas(4, 'FOTO', 'tiga.png'),
];

/** Pembungkus stateful supaya onGanti benar-benar memindahkan foto. */
function Galeri({ awal, isi }: { awal: RealisasiLampiran; isi: RealisasiLampiran[] }) {
  const [l, setL] = React.useState(awal);
  return (
    <PratinjauLampiran lampiran={l} daftar={isi} onGanti={setL} onTutup={() => {}} />
  );
}

/** jsdom mengabaikan `touches` di init TouchEvent; pasang manual. */
function sentuh(
  el: Element,
  jenis: 'touchStart' | 'touchEnd',
  clientX: number,
) {
  const ev = createEvent[jenis](el);
  // react-remove-scroll (dialog Radix) juga membaca changedTouches saat touchstart.
  const titik = [{ clientX, clientY: 0 }];
  Object.defineProperty(ev, 'touches', {
    value: jenis === 'touchStart' ? titik : [],
  });
  Object.defineProperty(ev, 'changedTouches', { value: titik });
  fireEvent(el, ev);
}

const judul = () => screen.getByRole('dialog').querySelector('h2')?.textContent;

it('tidak menampilkan navigasi bila hanya ada satu foto', () => {
  render(<Galeri awal={daftar[0]} isi={daftar.slice(0, 2)} />);

  expect(screen.queryByRole('button', { name: 'Foto berikutnya' })).toBeNull();
  expect(judul()).not.toContain('/');
});

it('menggeser antarfoto, melewati dokumen, dan berputar di ujung', () => {
  render(<Galeri awal={daftar[0]} isi={daftar} />);
  expect(judul()).toContain('1 / 3');

  fireEvent.click(screen.getByRole('button', { name: 'Foto berikutnya' }));
  expect(screen.getByAltText('dua.png')).toBeTruthy();
  expect(judul()).toContain('2 / 3');

  fireEvent.click(screen.getByRole('button', { name: 'Foto berikutnya' }));
  fireEvent.click(screen.getByRole('button', { name: 'Foto berikutnya' }));
  expect(screen.getByAltText('satu.png')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Foto sebelumnya' }));
  expect(screen.getByAltText('tiga.png')).toBeTruthy();
});

it('mendukung panah keyboard dan swipe', () => {
  render(<Galeri awal={daftar[0]} isi={daftar} />);
  const dialog = screen.getByRole('dialog');

  fireEvent.keyDown(dialog, { key: 'ArrowRight' });
  expect(screen.getByAltText('dua.png')).toBeTruthy();
  fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
  expect(screen.getByAltText('satu.png')).toBeTruthy();

  const bidang = screen.getByAltText('satu.png').parentElement!;
  sentuh(bidang, 'touchStart', 300);
  sentuh(bidang, 'touchEnd', 200);
  expect(screen.getByAltText('dua.png')).toBeTruthy();

  // Geser pendek di bawah ambang tidak berpindah.
  const bidangBaru = screen.getByAltText('dua.png').parentElement!;
  sentuh(bidangBaru, 'touchStart', 300);
  sentuh(bidangBaru, 'touchEnd', 280);
  expect(screen.getByAltText('dua.png')).toBeTruthy();
});
