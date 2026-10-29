// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PapanKesiapan } from './PapanKesiapan';
import type { KesiapanBidang, Periode } from '@/services';

const getPapanKesiapan = vi.fn();
const getPenunjukan = vi.fn();
const tandaiKesiapan = vi.fn();
const ubahStatusPeriode = vi.fn();

vi.mock('@/services', () => ({
  getPapanKesiapan: (...a: unknown[]) => getPapanKesiapan(...a),
  getPenunjukan: (...a: unknown[]) => getPenunjukan(...a),
  tandaiKesiapan: (...a: unknown[]) => tandaiKesiapan(...a),
  ubahStatusPeriode: (...a: unknown[]) => ubahStatusPeriode(...a),
  salinRencana: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  apiMessage: (_e: unknown, fallback: string) => fallback,
}));

const periodeDraft: Periode = {
  id: 4, dokumenId: 1, namaPeriode: 'Triwulan I 2027',
  tanggalMulai: '2027-01-01', tanggalSelesai: '2027-03-31', status: 'DRAFT',
};

const bidang = (ubah: Partial<KesiapanBidang> & { bidangId: number; namaBidang: string }): KesiapanBidang => ({
  periodeId: 4,
  status: 'DRAFT',
  jumlahSubkegiatan: 4,
  jumlahLengkap: 4,
  jumlahTeragenda: 1,
  butir: [],
  ditandaiPada: null,
  ...ubah,
});

const PIK_KURANG = bidang({
  bidangId: 3,
  namaBidang: 'PIK',
  jumlahLengkap: 3,
  butir: ['5.01.03.2.02.0001: target harus lebih dari nol.'],
});
const PPM_SIAP = bidang({ bidangId: 4, namaBidang: 'PPM', status: 'SIAP', ditandaiPada: '2026-10-23T08:52:00+08:00' });
const RINOVA_MENUNGGU = bidang({ bidangId: 5, namaBidang: 'RINOVA' });

function tampilkan(periodeLainTerbuka: Periode | null = null, periode = periodeDraft) {
  return render(
    <MemoryRouter>
      <PapanKesiapan
        periode={periode}
        sumber={null}
        periodeLainTerbuka={periodeLainTerbuka}
        onPerubahan={vi.fn()}
      />
    </MemoryRouter>,
  );
}

const baris = (nama: string) =>
  screen.getByText(nama, { selector: 'p' }).closest('.relative') as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  getPenunjukan.mockResolvedValue({ ringkasan: { jumlahBelum: 0 } });
});

afterEach(cleanup);

describe('PapanKesiapan', () => {
  it('mengurutkan bidang yang perlu ditindaklanjuti di atas', async () => {
    getPapanKesiapan.mockResolvedValue([PPM_SIAP, RINOVA_MENUNGGU, PIK_KURANG]);
    tampilkan();
    await screen.findByText('PIK', { selector: 'p' });

    const nama = Array.from(document.querySelectorAll('p.text-sm.font-bold')).map(p => p.textContent);
    expect(nama).toEqual(['PIK', 'RINOVA', 'PPM']);
  });

  it('menampilkan kekurangan per subkegiatan dari butir backend', async () => {
    getPapanKesiapan.mockResolvedValue([PIK_KURANG]);
    tampilkan();
    await screen.findByText('1 subkegiatan perlu dilengkapi');

    await userEvent.click(screen.getByRole('button', { name: 'Lihat kekurangan' }));

    expect(screen.getByText('5.01.03.2.02.0001')).toBeTruthy();
    expect(screen.getByText('Target harus lebih dari nol.')).toBeTruthy();
  });

  it('menandai bidang yang lengkap langsung dari papan', async () => {
    getPapanKesiapan.mockResolvedValue([RINOVA_MENUNGGU]);
    tandaiKesiapan.mockResolvedValue('SIAP');
    tampilkan();
    await screen.findByText('Lengkap, menunggu ditandai');

    await userEvent.click(within(baris('RINOVA')).getByRole('button', { name: /Tandai siap/ }));

    await waitFor(() => expect(tandaiKesiapan).toHaveBeenCalledWith(5, 4, 'SIAP'));
    expect(await screen.findByText('RINOVA ditandai siap.')).toBeTruthy();
  });

  it('mengembalikan bidang siap ke draf', async () => {
    getPapanKesiapan.mockResolvedValue([PPM_SIAP]);
    tandaiKesiapan.mockResolvedValue('DRAFT');
    tampilkan();
    await screen.findByText(/ditandai 23 Okt/);

    await userEvent.click(screen.getByRole('button', { name: /Kembali ke draf/ }));

    await waitFor(() => expect(tandaiKesiapan).toHaveBeenCalledWith(4, 4, 'DRAFT'));
  });

  it('menahan tombol buka dan menyebut periode lain yang masih terbuka', async () => {
    getPapanKesiapan.mockResolvedValue([PPM_SIAP]);
    tampilkan({ ...periodeDraft, id: 3, namaPeriode: 'Triwulan IV 2026', status: 'OPEN' });
    await screen.findByText(/Triwulan IV 2026 masih terbuka/);

    const tombol = screen.getByRole('button', { name: 'Buka periode untuk pencatatan' }) as HTMLButtonElement;
    expect(tombol.disabled).toBe(true);
    expect(screen.getByText('1 syarat belum terpenuhi.')).toBeTruthy();
  });

  it('meminta konfirmasi sebelum membuka periode', async () => {
    getPapanKesiapan.mockResolvedValue([PPM_SIAP]);
    ubahStatusPeriode.mockResolvedValue({ ...periodeDraft, status: 'OPEN' });
    tampilkan();
    await screen.findByText('Semua syarat terpenuhi.');

    await userEvent.click(screen.getByRole('button', { name: 'Buka periode untuk pencatatan' }));
    expect(ubahStatusPeriode).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Ya, buka periode' }));
    await waitFor(() => expect(ubahStatusPeriode).toHaveBeenCalledWith(4, 'OPEN'));
  });

  it('memperingatkan subkegiatan yang belum ditugaskan tanpa menghalangi', async () => {
    getPapanKesiapan.mockResolvedValue([PPM_SIAP]);
    getPenunjukan.mockResolvedValue({ ringkasan: { jumlahBelum: 3 } });
    tampilkan();

    expect(await screen.findByText(/3 subkegiatan belum ditugaskan/)).toBeTruthy();
    expect(screen.getByText('Semua syarat terpenuhi.')).toBeTruthy();
  });

  it('hanya untuk dilihat saat periode sudah terbuka', async () => {
    getPapanKesiapan.mockResolvedValue([PPM_SIAP]);
    tampilkan(null, { ...periodeDraft, status: 'OPEN' });
    await screen.findByText(/papan ini hanya untuk dilihat/);

    expect(screen.queryByRole('button', { name: /Kembali ke draf/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Buka periode untuk pencatatan' })).toBeNull();
    expect(screen.getByRole('button', { name: /Lihat rencana/ })).toBeTruthy();
  });

  it('menyaring daftar menurut tahap', async () => {
    getPapanKesiapan.mockResolvedValue([PPM_SIAP, RINOVA_MENUNGGU, PIK_KURANG]);
    tampilkan();
    await screen.findByText('PIK', { selector: 'p' });

    await userEvent.click(screen.getByRole('button', { name: /Siap\s*1\s*Sudah ditandai siap/ }));

    expect(screen.queryByText('PIK', { selector: 'p' })).toBeNull();
    expect(screen.getByText('PPM', { selector: 'p' })).toBeTruthy();
  });
});
