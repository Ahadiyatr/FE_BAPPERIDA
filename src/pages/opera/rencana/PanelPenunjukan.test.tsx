// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PanelPenunjukan } from './PanelPenunjukan';
import type { BarisPenunjukan, PenunjukanPeriode, Periode } from '@/services';

const getPenunjukan = vi.fn();
const getBidang = vi.fn();
const tugaskanSubkegiatan = vi.fn();
const pindahBidangSubkegiatan = vi.fn();
const cabutSubkegiatanDariRencana = vi.fn();

vi.mock('@/services', () => ({
  getPenunjukan: (...a: unknown[]) => getPenunjukan(...a),
  getBidang: (...a: unknown[]) => getBidang(...a),
  tugaskanSubkegiatan: (...a: unknown[]) => tugaskanSubkegiatan(...a),
  pindahBidangSubkegiatan: (...a: unknown[]) => pindahBidangSubkegiatan(...a),
  cabutSubkegiatanDariRencana: (...a: unknown[]) =>
    cabutSubkegiatanDariRencana(...a),
  salinRencana: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  apiMessage: (_e: unknown, fallback: string) => fallback,
}));

const P2EPD = 9;
const PPM = 11;

const periodeDraft: Periode = {
  id: 4,
  dokumenId: 1,
  namaPeriode: 'Uji TW-X',
  tanggalMulai: '2026-04-01',
  tanggalSelesai: '2026-06-30',
  status: 'DRAFT',
};

function baris(ubah: Partial<BarisPenunjukan> & { subkegiatanId: number }) {
  return {
    rencanaId: null,
    kode: `5.1.2.2.01.${ubah.subkegiatanId}`,
    nama: `Subkegiatan ${ubah.subkegiatanId}`,
    indikatorKinerja: 'Jumlah dokumen',
    targetAnjuran: 2,
    satuan: null,
    flagActive: true,
    bidangId: null,
    namaBidang: null,
    jumlahAktifitasUtama: 1,
    jumlahAktifitasPendukung: 3,
    dapatDitugaskan: true,
    adaRealisasi: false,
    ...ubah,
  } satisfies BarisPenunjukan;
}

function data(
  subkegiatan: BarisPenunjukan[],
  periode: Periode = periodeDraft,
): PenunjukanPeriode {
  const ditugaskan = subkegiatan.filter(s => s.bidangId !== null).length;
  return {
    periode,
    ringkasan: {
      jumlahSubkegiatan: subkegiatan.length,
      jumlahDitugaskan: ditugaskan,
      jumlahBelum: subkegiatan.length - ditugaskan,
      perBidang: [],
    },
    program: [
      {
        kode: '5.1.2',
        nama: 'Program Perencanaan',
        kegiatan: [
          {
            kode: '5.1.2.2.01',
            nama: 'Penyusunan Perencanaan dan Pendanaan',
            subkegiatan,
          },
        ],
      },
    ],
  };
}

/** Select di header kegiatan adalah yang pertama; sisanya milik tiap baris. */
function selectKegiatan(): HTMLSelectElement {
  return screen.getAllByRole('combobox')[0] as HTMLSelectElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  getBidang.mockResolvedValue([
    { id: P2EPD, kode: String(P2EPD), namaBidang: 'P2EPD', flagActive: true },
    { id: PPM, kode: String(PPM), namaBidang: 'PPM', flagActive: true },
  ]);
});

// Proyek tidak memakai `globals: true`, jadi auto-cleanup Testing Library tidak
// terpasang sendiri — tanpa ini DOM antar-tes menumpuk dan query berbasis indeks
// (getAllByRole(...)[1]) mengambil elemen milik tes sebelumnya.
afterEach(cleanup);

describe('PanelPenunjukan', () => {
  it('menugaskan seluruh isi kegiatan lewat satu panggilan bulk', async () => {
    getPenunjukan.mockResolvedValue(
      data([
        baris({ subkegiatanId: 1 }),
        baris({ subkegiatanId: 2 }),
        baris({ subkegiatanId: 3 }),
      ]),
    );
    tugaskanSubkegiatan.mockResolvedValue([]);

    render(
      <PanelPenunjukan
        periode={periodeDraft}
        sumber={null}
        onPerubahan={vi.fn()}
      />,
    );
    await screen.findByText('Penyusunan Perencanaan dan Pendanaan');

    await userEvent.selectOptions(selectKegiatan(), String(P2EPD));

    await waitFor(() => expect(tugaskanSubkegiatan).toHaveBeenCalledTimes(1));
    expect(tugaskanSubkegiatan).toHaveBeenCalledWith({
      bidangId: P2EPD,
      periodeId: 4,
      subkegiatanIds: [1, 2, 3],
    });
    expect(pindahBidangSubkegiatan).not.toHaveBeenCalled();
  });

  it('memindahkan baris yang sudah ditugaskan, bukan menugaskan ulang', async () => {
    getPenunjukan.mockResolvedValue(
      data([baris({ subkegiatanId: 1, bidangId: P2EPD, rencanaId: 77 })]),
    );
    pindahBidangSubkegiatan.mockResolvedValue(undefined);

    render(
      <PanelPenunjukan
        periode={periodeDraft}
        sumber={null}
        onPerubahan={vi.fn()}
      />,
    );
    await screen.findByText('Subkegiatan 1');

    // combobox[1] = pemilih pada baris subkegiatan.
    await userEvent.selectOptions(
      screen.getAllByRole('combobox')[1],
      String(PPM),
    );

    await waitFor(() =>
      expect(pindahBidangSubkegiatan).toHaveBeenCalledWith(77, PPM),
    );
    expect(tugaskanSubkegiatan).not.toHaveBeenCalled();
  });

  it('mencabut penugasan ketika dikembalikan ke "belum ditugaskan"', async () => {
    getPenunjukan.mockResolvedValue(
      data([baris({ subkegiatanId: 1, bidangId: P2EPD, rencanaId: 77 })]),
    );
    cabutSubkegiatanDariRencana.mockResolvedValue(undefined);

    render(
      <PanelPenunjukan
        periode={periodeDraft}
        sumber={null}
        onPerubahan={vi.fn()}
      />,
    );
    await screen.findByText('Subkegiatan 1');

    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], '');

    await waitFor(() =>
      expect(cabutSubkegiatanDariRencana).toHaveBeenCalledWith(77),
    );
  });

  it('mengunci baris yang sudah punya realisasi dan menjelaskan alasannya', async () => {
    getPenunjukan.mockResolvedValue(
      data([
        baris({
          subkegiatanId: 1,
          bidangId: P2EPD,
          rencanaId: 77,
          adaRealisasi: true,
        }),
      ]),
    );

    render(
      <PanelPenunjukan
        periode={periodeDraft}
        sumber={null}
        onPerubahan={vi.fn()}
      />,
    );
    await screen.findByText('Subkegiatan 1');

    const pemilihBaris = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    expect(pemilihBaris.disabled).toBe(true);
    expect(pemilihBaris.title).toMatch(/realisasi/i);
  });

  it('menandai kegiatan yang bidangnya campuran', async () => {
    getPenunjukan.mockResolvedValue(
      data([
        baris({ subkegiatanId: 1, bidangId: P2EPD, rencanaId: 77 }),
        baris({ subkegiatanId: 2, bidangId: PPM, rencanaId: 78 }),
      ]),
    );

    render(
      <PanelPenunjukan
        periode={periodeDraft}
        sumber={null}
        onPerubahan={vi.fn()}
      />,
    );
    await screen.findByText('Penyusunan Perencanaan dan Pendanaan');

    expect(selectKegiatan().value).toBe('campuran');
  });

  it('mengunci seluruh kontrol saat periode sudah dibuka', async () => {
    const periodeOpen = { ...periodeDraft, status: 'OPEN' as const };
    getPenunjukan.mockResolvedValue(
      data([baris({ subkegiatanId: 1, bidangId: P2EPD, rencanaId: 77 })], periodeOpen),
    );

    render(
      <PanelPenunjukan
        periode={periodeOpen}
        sumber={null}
        onPerubahan={vi.fn()}
      />,
    );
    await screen.findByText('Subkegiatan 1');

    expect(screen.getByText(/Penunjukan terkunci/i)).toBeTruthy();
    for (const pemilih of screen.getAllByRole('combobox'))
      expect((pemilih as HTMLSelectElement).disabled).toBe(true);
  });

  it('menyaring ke subkegiatan yang belum ditugaskan', async () => {
    getPenunjukan.mockResolvedValue(
      data([
        baris({ subkegiatanId: 1, bidangId: P2EPD, rencanaId: 77 }),
        baris({ subkegiatanId: 2 }),
      ]),
    );

    render(
      <PanelPenunjukan
        periode={periodeDraft}
        sumber={null}
        onPerubahan={vi.fn()}
      />,
    );
    await screen.findByText('Subkegiatan 1');

    await userEvent.click(
      screen.getByRole('button', { name: 'Belum ditugaskan' }),
    );

    expect(screen.queryByText('Subkegiatan 1')).toBeNull();
    expect(screen.getByText('Subkegiatan 2')).toBeTruthy();
  });

  it('menugaskan pilihan massal lintas baris dalam satu panggilan', async () => {
    getPenunjukan.mockResolvedValue(
      data([baris({ subkegiatanId: 1 }), baris({ subkegiatanId: 2 })]),
    );
    tugaskanSubkegiatan.mockResolvedValue([]);

    render(
      <PanelPenunjukan
        periode={periodeDraft}
        sumber={null}
        onPerubahan={vi.fn()}
      />,
    );
    await screen.findByText('Subkegiatan 1');

    await userEvent.click(screen.getByLabelText('Pilih 5.1.2.2.01.1'));
    await userEvent.click(screen.getByLabelText('Pilih 5.1.2.2.01.2'));

    const bar = screen.getByText(/subkegiatan terpilih/i).closest('div')!;
    await userEvent.selectOptions(
      within(bar).getByRole('combobox'),
      String(PPM),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Terapkan' }));

    await waitFor(() => expect(tugaskanSubkegiatan).toHaveBeenCalledTimes(1));
    expect(tugaskanSubkegiatan).toHaveBeenCalledWith({
      bidangId: PPM,
      periodeId: 4,
      subkegiatanIds: [1, 2],
    });
  });
});
