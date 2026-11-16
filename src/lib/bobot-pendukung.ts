import type { IndikatorBidang } from '@/services';

export const pendukungDipakai = (aktifitas: IndikatorBidang[]): IndikatorBidang[] =>
  aktifitas.filter(a => a.tipeAktifitas === 'PENDUKUNG' && a.dipakai);

export const pendukungSemua = (aktifitas: IndikatorBidang[]): IndikatorBidang[] =>
  aktifitas.filter(a => a.tipeAktifitas === 'PENDUKUNG');

export function bagiBobotPendukung(n: number): number[] {
  if (n <= 0) return [];
  const masing = Math.round((30 / n) * 100) / 100;
  return Array.from({ length: n }, (_, i) =>
    i === n - 1 ? Math.round((30 - masing * (n - 1)) * 100) / 100 : masing,
  );
}

export function alasanCentangTerkunci(
  aktifitas: IndikatorBidang,
  semuaAktifitas: IndikatorBidang[],
  periodeDraft: boolean,
): string | null {
  if (aktifitas.tipeAktifitas !== 'PENDUKUNG')
    return 'Aktivitas utama memegang bobot 70% dan tidak bisa dilepas.';
  if (!periodeDraft)
    return 'Hanya bisa diubah saat periode berstatus DRAFT.';
  if (aktifitas.dipakai && aktifitas.realisasi > 0)
    return 'Sudah ada realisasi tercatat pada aktivitas ini.';
  if (aktifitas.dipakai && pendukungDipakai(semuaAktifitas).length <= 1)
    return 'Sisakan minimal satu aktivitas pendukung — 30% harus ada pemegangnya.';
  return null;
}

export function bobotSetelahToggle(
  aktifitas: IndikatorBidang[],
  idDitoggle: number,
): { sebelum: number; sesudah: number; jumlahSesudah: number } {
  const dipakai = pendukungDipakai(aktifitas);
  const target = aktifitas.find(a => a.id === idDitoggle);
  const jumlahSesudah = target?.dipakai ? dipakai.length - 1 : dipakai.length + 1;

  return {
    sebelum: dipakai.length > 0 ? 30 / dipakai.length : 0,
    sesudah: jumlahSesudah > 0 ? 30 / jumlahSesudah : 0,
    jumlahSesudah,
  };
}
