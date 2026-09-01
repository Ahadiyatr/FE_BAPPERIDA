import { api, dataOf } from './api';
import { getBidangById } from './bidang.service';
import { getPeriodeById } from './periode.service';
import { getSubkegiatan } from './subkegiatan.service';
import type {
  BarisPenunjukan,
  BarisRencana,
  HasilPemeriksaan,
  HasilSalinRencana,
  IndikatorBidang,
  KatalogTersedia,
  KesiapanBidang,
  OpsiSalinRencana,
  PenunjukanPeriode,
  Periode,
  RencanaBidangDetail,
  StatusKesiapan,
  SubkegiatanBidang,
} from './types';

type AktifitasRow = {
  id: number;
  subkegiatan_bidang_id: number;
  master_aktifitas_id: number | null;
  flag_adhoc: boolean;
  /** Opsional: endpoint lama belum mengirimnya. */
  dipakai?: boolean;
  nama_aktifitas: string;
  tipe_aktifitas: 'UTAMA' | 'PENDUKUNG';
  bobot_target: number;
  target: number;
  realisasi: number;
  bobot_realisasi: number;
  urutan: number;
};
type RencanaRow = {
  id: number;
  periode_id: number;
  bidang_id: number;
  subkegiatan_id: number;
  kode_subkegiatan: string;
  nama_subkegiatan: string;
  indikator_kinerja: string;
  target: number;
  satuan: string;
  capaian: number;
  aktifitas?: AktifitasRow[];
  jumlah_aktifitas?: number;
};
type KesiapanRow = {
  bidang_id: number;
  nama_bidang: string;
  periode_id: number;
  status: StatusKesiapan;
  jumlah_subkegiatan: number;
  jumlah_lengkap: number;
  butir: string[];
};
const aktifitas = (r: AktifitasRow): IndikatorBidang => ({
  id: r.id,
  subkegiatanBidangId: r.subkegiatan_bidang_id,
  masterIndikatorId: r.master_aktifitas_id ?? 0,
  flagAdhoc: r.flag_adhoc,
  // Baris lama / endpoint yang belum mengirim field ini dianggap dipakai.
  dipakai: r.dipakai ?? true,
  tipeAktifitas: r.tipe_aktifitas,
  namaAktifitas: r.nama_aktifitas,
  bobotTarget: Number(r.bobot_target),
  target: Number(r.target),
  realisasi: Number(r.realisasi),
  bobotRealisasi: Number(r.bobot_realisasi),
  urutan: r.urutan,
});
const skb = (r: RencanaRow): SubkegiatanBidang => ({
  id: r.id,
  periodeId: r.periode_id,
  bidangId: r.bidang_id,
  indikatorUtamaId: r.subkegiatan_id,
  indikatorKinerja: r.indikator_kinerja ?? '',
  target: Number(r.target),
  satuan: r.satuan ?? '',
  capaian: Number(r.capaian),
});
const baris = (r: RencanaRow): BarisRencana => ({
  subkegiatanBidang: skb(r),
  namaSubkegiatan: r.nama_subkegiatan,
  kodeSubkegiatan: r.kode_subkegiatan,
  aktifitas: (r.aktifitas ?? []).map(aktifitas),
});

async function daftar(
  periodeId: number,
  bidangId?: number,
): Promise<RencanaRow[]> {
  return dataOf<RencanaRow[]>(
    await api.get(`/periode/${periodeId}/rencana`, {
      params: bidangId ? { bidang_id: bidangId } : {},
    }),
  );
}

const kesiapan = (r: KesiapanRow): KesiapanBidang => ({
  bidangId: r.bidang_id,
  namaBidang: r.nama_bidang,
  periodeId: r.periode_id,
  status: r.status,
  jumlahSubkegiatan: r.jumlah_subkegiatan,
  jumlahLengkap: r.jumlah_lengkap,
});
export async function getPapanKesiapan(
  periodeId: number,
): Promise<KesiapanBidang[]> {
  return dataOf<KesiapanRow[]>(
    await api.get(`/periode/${periodeId}/kesiapan`),
  ).map(kesiapan);
}
export async function getRencanaBidang(
  bidangId: number,
  periodeId: number,
): Promise<RencanaBidangDetail | null> {
  const [bidang, periode, rows, papan] = await Promise.all([
    getBidangById(bidangId),
    getPeriodeById(periodeId),
    daftar(periodeId, bidangId),
    getPapanKesiapan(periodeId),
  ]);
  if (!bidang || !periode) return null;
  const status = papan.find(b => b.bidangId === bidangId)?.status ?? 'DRAFT';
  return { bidang, periode, status, baris: rows.map(baris) };
}

async function ubah(rencanaId: number, payload: any): Promise<RencanaRow> {
  return dataOf<RencanaRow>(await api.patch(`/rencana/${rencanaId}`, payload));
}
export async function ubahTargetSubkegiatan(
  id: number,
  target: number,
): Promise<SubkegiatanBidang> {
  return skb(await ubah(id, { TARGET: target }));
}
export async function ubahTargetAktifitas(
  id: number,
  target: number,
): Promise<IndikatorBidang> {
  const detail = dataOf<RencanaRow>(
    await api.get(`/rencana/${await cariRencanaId(id)}`),
  );
  await ubah(detail.id, { aktifitas: [{ id, TARGET: target }] });
  const ulang = dataOf<RencanaRow>(await api.get(`/rencana/${detail.id}`));
  return aktifitas(ulang.aktifitas!.find(a => a.id === id)!);
}
async function cariRencanaId(aktifitasId: number): Promise<number> {
  const periods = dataOf<any[]>(await api.get('/periode'));
  for (const p of periods) {
    const rows = await daftar(p.id);
    const found = rows.find(r =>
      (r.aktifitas ?? []).some(a => a.id === aktifitasId),
    );
    if (found) return found.id;
  }
  throw new Error('Aktifitas tidak ditemukan.');
}
export async function tambahAktifitasKeRencana(i: {
  subkegiatanBidangId: number;
  namaAktifitas: string;
  target: number;
}): Promise<IndikatorBidang> {
  return aktifitas(
    dataOf<AktifitasRow>(
      await api.post('/aktifitas-bidang', {
        subkegiatan_bidang_id: i.subkegiatanBidangId,
        nama_aktifitas: i.namaAktifitas,
        target: i.target,
      }),
    ),
  );
}
export async function hapusAktifitasDariRencana(id: number): Promise<void> {
  await api.delete(`/aktifitas-bidang/${id}`);
}
/**
 * Pakai / tidak pakai satu aktivitas pendukung pada periode ini. Bukan penghapusan:
 * barisnya tetap ada, hanya keluar dari pembagi 30/n. Hanya saat periode DRAFT.
 */
export async function setDipakaiAktifitas(
  id: number,
  dipakai: boolean,
): Promise<IndikatorBidang> {
  return aktifitas(
    dataOf<AktifitasRow>(
      await api.patch(`/aktifitas-bidang/${id}/dipakai`, { dipakai }),
    ),
  );
}
export async function getKatalogTersedia(
  periodeId: number,
): Promise<KatalogTersedia[]> {
  const [master, rows] = await Promise.all([
    getSubkegiatan(),
    daftar(periodeId),
  ]);
  const dipakai = new Set(rows.map(r => r.subkegiatan_id));
  return master
    .filter(s => !dipakai.has(s.id))
    .map(s => ({
      indikatorUtamaId: s.id,
      kode: s.kodeIndikatorUtama,
      nama: s.namaIndikatorUtama,
      indikatorKinerja: s.indikatorKinerja,
      targetAnjuran: s.targetKinerja,
      satuan: s.satuanKinerja,
      jumlahAktifitas: 0,
    }));
}
/** Tugaskan sekaligus — backend menerima array, jadi satu kegiatan cukup satu panggilan. */
export async function tugaskanSubkegiatan(i: {
  bidangId: number;
  periodeId: number;
  subkegiatanIds: number[];
}): Promise<BarisRencana[]> {
  return dataOf<RencanaRow[]>(
    await api.post(`/periode/${i.periodeId}/rencana`, {
      bidang_id: i.bidangId,
      subkegiatan_ids: i.subkegiatanIds,
    }),
  ).map(baris);
}
export async function tambahSubkegiatanKeRencana(i: {
  indikatorUtamaId: number;
  bidangId: number;
  periodeId: number;
}): Promise<BarisRencana> {
  const hasil = await tugaskanSubkegiatan({
    bidangId: i.bidangId,
    periodeId: i.periodeId,
    subkegiatanIds: [i.indikatorUtamaId],
  });
  return hasil[0];
}
export async function cabutSubkegiatanDariRencana(id: number): Promise<void> {
  await api.delete(`/rencana/${id}`);
}
/** Ganti bidang penanggung jawab tanpa kehilangan target & aktifitas ad-hoc yang sudah disetel. */
export async function pindahBidangSubkegiatan(
  rencanaId: number,
  bidangId: number,
): Promise<void> {
  await api.patch(`/rencana/${rencanaId}/pindah-bidang`, {
    bidang_id: bidangId,
  });
}

type PenunjukanBarisRow = {
  subkegiatan_id: number;
  rencana_id: number | null;
  kode_subkegiatan: string;
  nama_subkegiatan: string;
  indikator_kinerja: string | null;
  target_anjuran: number | null;
  satuan: string | null;
  flag_active: boolean;
  bidang_id: number | null;
  nama_bidang: string | null;
  jumlah_aktifitas_utama: number;
  jumlah_aktifitas_pendukung: number;
  dapat_ditugaskan: boolean;
  ada_realisasi: boolean;
};
type PenunjukanRow = {
  periode: {
    id: number;
    dokumen_id: number | null;
    nama_periode: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: Periode['status'];
  };
  ringkasan: {
    jumlah_subkegiatan: number;
    jumlah_ditugaskan: number;
    jumlah_belum: number;
    per_bidang: {
      bidang_id: number;
      nama_bidang: string | null;
      jumlah: number;
    }[];
  };
  program: {
    kode_program: string;
    nama_program: string | null;
    kegiatan: {
      kode_kegiatan: string;
      nama_kegiatan: string | null;
      subkegiatan: PenunjukanBarisRow[];
    }[];
  }[];
};
const barisPenunjukan = (r: PenunjukanBarisRow): BarisPenunjukan => ({
  subkegiatanId: r.subkegiatan_id,
  rencanaId: r.rencana_id,
  kode: r.kode_subkegiatan,
  nama: r.nama_subkegiatan,
  indikatorKinerja: r.indikator_kinerja ?? '',
  targetAnjuran: r.target_anjuran === null ? null : Number(r.target_anjuran),
  satuan: r.satuan,
  flagActive: r.flag_active,
  bidangId: r.bidang_id,
  namaBidang: r.nama_bidang,
  jumlahAktifitasUtama: r.jumlah_aktifitas_utama,
  jumlahAktifitasPendukung: r.jumlah_aktifitas_pendukung,
  dapatDitugaskan: r.dapat_ditugaskan,
  adaRealisasi: r.ada_realisasi,
});
export async function getPenunjukan(
  periodeId: number,
): Promise<PenunjukanPeriode> {
  const r = dataOf<PenunjukanRow>(
    await api.get(`/periode/${periodeId}/penunjukan`),
  );
  return {
    periode: {
      id: r.periode.id,
      dokumenId: r.periode.dokumen_id,
      namaPeriode: r.periode.nama_periode,
      tanggalMulai: r.periode.tanggal_mulai,
      tanggalSelesai: r.periode.tanggal_selesai,
      status: r.periode.status,
    },
    ringkasan: {
      jumlahSubkegiatan: r.ringkasan.jumlah_subkegiatan,
      jumlahDitugaskan: r.ringkasan.jumlah_ditugaskan,
      jumlahBelum: r.ringkasan.jumlah_belum,
      perBidang: r.ringkasan.per_bidang.map(b => ({
        bidangId: b.bidang_id,
        namaBidang: b.nama_bidang ?? '—',
        jumlah: b.jumlah,
      })),
    },
    program: r.program.map(p => ({
      kode: p.kode_program,
      nama: p.nama_program ?? '',
      kegiatan: p.kegiatan.map(k => ({
        kode: k.kode_kegiatan,
        nama: k.nama_kegiatan ?? '',
        subkegiatan: k.subkegiatan.map(barisPenunjukan),
      })),
    })),
  };
}
export async function periksaKesiapan(
  bidangId: number,
  periodeId: number,
): Promise<HasilPemeriksaan> {
  const rows = dataOf<KesiapanRow[]>(
    await api.get(`/periode/${periodeId}/kesiapan`),
  );
  const hasil = rows.find(r => r.bidang_id === bidangId);
  const butir = hasil?.butir ?? [
    'Belum ada pembagian rencana untuk bidang ini.',
  ];
  return {
    butir: butir.map(rincian => ({
      nada: 'bad',
      menghalangi: true,
      judul: 'Rencana belum siap',
      rincian,
    })),
    jumlahMenghalangi: butir.length,
    bolehTandaiSiap: butir.length === 0,
  };
}
export async function tandaiKesiapan(
  bidangId: number,
  periodeId: number,
  status: StatusKesiapan,
): Promise<StatusKesiapan> {
  const rows = dataOf<KesiapanRow[]>(
    await api.patch(`/periode/${periodeId}/kesiapan/${bidangId}`, { status }),
  );
  return rows.find(r => r.bidang_id === bidangId)?.status ?? 'DRAFT';
}
export async function salinRencana(
  o: OpsiSalinRencana,
): Promise<HasilSalinRencana> {
  const h = dataOf<{ jumlah_subkegiatan: number; jumlah_aktifitas: number }>(
    await api.post(`/periode/${o.kePeriodeId}/salin-rencana`, {
      periode_sumber_id: o.dariPeriodeId,
      ikut_struktur: o.ikutStruktur,
      ikut_aktifitas: o.ikutAktifitas,
      ikut_target: o.ikutTarget,
      ikut_capaian_nol: o.ikutCapaianNol,
    }),
  );
  return {
    jumlahSubkegiatan: h.jumlah_subkegiatan,
    jumlahAktifitas: h.jumlah_aktifitas,
    jumlahBidangDitimpa: 0,
  };
}
