// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./api', () => ({
  api: mocks,
  dataOf: (response: { data: { data: unknown } }) => response.data.data,
}));

import {
  catatRealisasi,
  getBuktiByBidang,
  uploadLampiran,
} from './realisasi.service';

const responsRealisasi = {
  id: 11,
  aktifitas_bidang_id: 7,
  tanggal_kegiatan: '2026-09-13',
  jumlah_realisasi: 1,
  keterangan: null,
  created_by: 3,
  log_entry_name: 'Admin Bidang',
  lampiran: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockResolvedValue({ data: { data: responsRealisasi } });
});

describe('payload multipart realisasi', () => {
  it('mengirim semua foto dan dokumen saat mencatat realisasi', async () => {
    const fotoA = new File(['a'], 'foto-a.jpg', { type: 'image/jpeg' });
    const fotoB = new File(['b'], 'foto-b.png', { type: 'image/png' });
    const dokumenA = new File(['c'], 'laporan-a.pdf', {
      type: 'application/pdf',
    });
    const dokumenB = new File(['d'], 'laporan-b.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await catatRealisasi({
      indikatorBidangId: 7,
      tanggalKegiatan: '2026-09-13',
      jumlahRealisasi: 1,
      keterangan: '',
      createdBy: 3,
      fotos: [fotoA, fotoB],
      dokumens: [dokumenA, dokumenB],
    });

    const form = mocks.post.mock.calls[0][1] as FormData;
    expect(form.getAll('fotos[]')).toEqual([fotoA, fotoB]);
    expect(form.getAll('dokumens[]')).toEqual([dokumenA, dokumenB]);
    expect(form.has('dokumen')).toBe(false);
  });

  it('mempertahankan semua file campuran ketika menambah bukti', async () => {
    const foto = new File(['a'], 'foto.jpg', { type: 'image/jpeg' });
    const dokumenA = new File(['b'], 'satu.pdf', { type: 'application/pdf' });
    const dokumenB = new File(['c'], 'dua.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await uploadLampiran(11, [foto, dokumenA, dokumenB]);

    const form = mocks.post.mock.calls[0][1] as FormData;
    expect(form.getAll('fotos[]')).toEqual([foto]);
    expect(form.getAll('dokumens[]')).toEqual([dokumenA, dokumenB]);
    expect(form.has('dokumen')).toBe(false);
  });
});

describe('bukti kegiatan admin aplikasi', () => {
  it('mengambil detail baca-saja per bidang dan memetakan lampiran', async () => {
    const rencana = {
      id: 55,
      aktifitas: [{ jumlah_catatan: 1 }],
    };
    const detail = {
      id: 55,
      kode_subkegiatan: 'SUB-55',
      nama_subkegiatan: 'Subkegiatan 55',
      aktifitas: [
        {
          id: 7,
          nama_aktifitas: 'Aktivitas 7',
          tipe_aktifitas: 'UTAMA',
          bobot_target: 1,
          target: 1,
          realisasi: 1,
          bobot_realisasi: 1,
          realisasi_kegiatan: [
            {
              ...responsRealisasi,
              id: 11,
              tanggal_kegiatan: '2026-09-13',
              lampiran: [
                {
                  id: 21,
                  tipe_berkas: 'FOTO',
                  nama_berkas: 'bukti.jpg',
                  mime_type: 'image/jpeg',
                  ukuran_byte: 12,
                  preview_url: '/api/v1/lampiran/21/preview',
                },
              ],
            },
          ],
        },
      ],
    };
    mocks.get.mockImplementation(async (path: string) => ({
      data: { data: path === '/periode/4/rencana' ? [rencana] : detail },
    }));

    const hasil = await getBuktiByBidang(2, 4, true);

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/periode/4/rencana', {
      params: { bidang_id: 2 },
    });
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/monitoring/subkegiatan/55');
    expect(hasil).toMatchObject([
      {
        realisasiId: 11,
        namaAktifitas: 'Aktivitas 7',
        kodeSubkegiatan: 'SUB-55',
        lampirans: [{ id: 21, namaBerkas: 'bukti.jpg' }],
      },
    ]);
  });
});
